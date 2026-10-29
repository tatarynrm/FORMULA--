import {
  type AdminTest,
  COLLECTION_SECTIONS,
  ERROR_CODES,
  type QuestionInput,
  type StudentTestSummary,
  TESTS,
  type TestCollection,
  type TestFilterOptions,
  type TestSummary,
} from '@formula/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isUniqueViolation } from '../../common/utils/pg-errors.js';
import { AccessService } from '../access/access.service.js';
import { CatalogService } from '../catalog/catalog.service.js';
import type { CreateTestDto, SaveQuestionsDto, UpdateTestDto } from './dto/tests.dto.js';
import { TestsRepository } from './tests.repository.js';

export interface StudentTestQuery {
  collection?: TestCollection;
  category?: string;
  year?: number;
  specialty?: string;
  q?: string;
}

@Injectable()
export class TestsService {
  constructor(
    private readonly repository: TestsRepository,
    private readonly access: AccessService,
    private readonly catalog: CatalogService,
  ) {}

  // ---- Admin ----

  /** Each collection is managed from its own admin section, so a "bases" editor cannot touch AMPS. */
  private async assertCanManage(userId: string, collection: TestCollection): Promise<void> {
    const context = await this.access.getContext(userId);
    if (!this.access.canUseSection(context, COLLECTION_SECTIONS[collection])) {
      throw new ForbiddenException();
    }
  }

  async adminList(
    userId: string,
    collection: TestCollection,
    subtopicId?: string,
  ): Promise<TestSummary[]> {
    await this.assertCanManage(userId, collection);
    return this.repository.list({ collection, ...(subtopicId ? { subtopicId } : {}) });
  }

  async adminGet(userId: string, id: string): Promise<AdminTest> {
    const test = await this.requireTest(id);
    await this.assertCanManage(userId, test.collection);
    return { ...test, questions: await this.repository.findQuestions(id) };
  }

  async create(userId: string, dto: CreateTestDto): Promise<AdminTest> {
    await this.assertCanManage(userId, dto.collection);

    if ((dto.collection === 'subtopic') !== Boolean(dto.subtopicId)) {
      throw new BadRequestException(
        'A subtopic is required for subtopic tests and not allowed for other collections',
      );
    }

    const id = await this.repository
      .create({
        kind: dto.kind,
        collection: dto.collection,
        subtopicId: dto.subtopicId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category ?? null,
        year: dto.year ?? null,
        specialty: dto.specialty ?? null,
        timeLimitSeconds: dto.timeLimitSeconds ?? null,
        createdBy: userId,
      })
      .catch((error: unknown) => {
        // A foreign key violation means the subtopic does not exist.
        if (
          typeof error === 'object' &&
          error !== null &&
          (error as { code?: string }).code === '23503'
        ) {
          throw new NotFoundException('Subtopic not found');
        }
        // The unique index allows one test per subtopic (its kind is chosen when it is created).
        if (isUniqueViolation(error)) {
          throw new ConflictException({
            code: ERROR_CODES.CONFLICT,
            message: 'This subtopic already has a test',
          });
        }
        throw error;
      });
    if (!id) throw new BadRequestException('Test was not created');
    return this.adminGet(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateTestDto): Promise<AdminTest> {
    const test = await this.requireTest(id);
    await this.assertCanManage(userId, test.collection);

    // The kind decides how questions look (options or a written answer), so it is only free to
    // change while there are none. Afterwards the admin removes the questions first.
    if (dto.kind && dto.kind !== test.kind && test.questionCount > 0) {
      throw new ConflictException({
        code: ERROR_CODES.CONFLICT,
        message: 'Remove the questions before changing the kind of the test',
      });
    }

    if (dto.status === 'published') {
      this.assertPublishable(dto.kind ?? test.kind, await this.repository.findQuestions(id));
    }

    await this.repository.update(id, dto);
    return this.adminGet(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const test = await this.requireTest(id);
    await this.assertCanManage(userId, test.collection);
    await this.repository.delete(id);
  }

  async saveQuestions(userId: string, id: string, dto: SaveQuestionsDto): Promise<AdminTest> {
    const test = await this.requireTest(id);
    await this.assertCanManage(userId, test.collection);

    const questions: QuestionInput[] = dto.questions;
    const isChoice = test.kind === 'choice';

    // Ids must belong to this test; otherwise one test could hijack the questions of another.
    const owned = await this.repository.findOwnedIds(id);
    for (const question of questions) {
      if (question.id && !owned.questions.has(question.id)) {
        throw new BadRequestException('A question id does not belong to this test');
      }
      for (const option of question.options ?? []) {
        if (option.id && !owned.options.has(option.id)) {
          throw new BadRequestException('An option id does not belong to this test');
        }
      }
    }

    // Images must be uploaded images.
    const imageIds = questions
      .flatMap((question) => [
        question.imageFileId,
        ...(question.options ?? []).map((option) => option.imageFileId),
      ])
      .filter((value): value is string => Boolean(value));
    const knownImages = await this.repository.findImageIds([...new Set(imageIds)]);
    if (imageIds.some((imageId) => !knownImages.has(imageId))) {
      throw new BadRequestException('An image was not found (upload it with purpose "image")');
    }

    if (isChoice) {
      for (const question of questions) {
        const options = question.options ?? [];
        if (options.length > TESTS.MAX_OPTIONS) {
          throw new BadRequestException(`A question can have at most ${TESTS.MAX_OPTIONS} options`);
        }
        if (options.some((option) => !option.body.trim() && !option.imageFileId)) {
          throw new BadRequestException('Every option needs a text or an image');
        }
      }
    }

    // A published test must stay valid, and the check runs BEFORE anything is stored, so a rejected
    // edit leaves the questions exactly as they were (unpublish the test first to save a draft state).
    if (test.status === 'published') {
      this.assertPublishable(
        test.kind,
        questions.map((question) => ({
          body: question.body,
          options: (question.options ?? []).map((option) => ({
            isCorrect: option.isCorrect,
            body: option.body,
            imageFileId: option.imageFileId ?? null,
          })),
        })),
      );
    }

    await this.repository.replaceQuestions(id, questions, isChoice);
    return this.adminGet(userId, id);
  }

  // ---- Student ----

  async listForStudent(userId: string, query: StudentTestQuery): Promise<StudentTestSummary[]> {
    const isAdmin = await this.isAdmin(userId);
    return this.repository.listForStudent({
      userId,
      isAdmin,
      ...(query.collection ? { collection: query.collection } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.year ? { year: query.year } : {}),
      ...(query.specialty ? { specialty: query.specialty } : {}),
      ...(query.q ? { query: query.q } : {}),
    });
  }

  async listForSubtopic(userId: string, subtopicId: string): Promise<StudentTestSummary[]> {
    if (!(await this.catalog.canOpenSubtopic(userId, subtopicId))) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'You do not have access to this subtopic',
      });
    }
    return this.repository.listForStudent({
      userId,
      isAdmin: await this.isAdmin(userId),
      collection: 'subtopic',
      subtopicId,
    });
  }

  /** Whether the student may (still) take the tests of a subtopic; an attempt checks it on every step. */
  canTakeSubtopicTests(userId: string, subtopicId: string): Promise<boolean> {
    return this.catalog.canOpenSubtopic(userId, subtopicId);
  }

  async getForStudent(userId: string, testId: string): Promise<StudentTestSummary> {
    const [test] = await this.repository.listForStudent({
      userId,
      isAdmin: await this.isAdmin(userId),
      testId,
    });
    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  filterOptions(collection: TestCollection): Promise<TestFilterOptions> {
    return this.repository.filterOptions(collection);
  }

  listFavorites(userId: string): Promise<StudentTestSummary[]> {
    return this.isAdmin(userId).then((isAdmin) =>
      this.repository.listForStudent({ userId, isAdmin, onlyFavorites: true }),
    );
  }

  async addFavorite(userId: string, testId: string): Promise<void> {
    // Only tests the student can see may be saved.
    await this.getForStudent(userId, testId);
    await this.repository.addFavorite(userId, testId);
  }

  removeFavorite(userId: string, testId: string): Promise<void> {
    return this.repository.removeFavorite(userId, testId);
  }

  // ---- helpers ----

  private async isAdmin(userId: string): Promise<boolean> {
    return (await this.access.getContext(userId))?.role === 'admin';
  }

  private async requireTest(id: string): Promise<TestSummary> {
    const test = await this.repository.findById(id);
    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  /** What a test needs before students may see it. */
  private assertPublishable(
    kind: TestSummary['kind'],
    questions: {
      body: string;
      options: { isCorrect: boolean; body: string; imageFileId: string | null }[];
    }[],
  ): void {
    const problem = (message: string) =>
      new ConflictException({ code: ERROR_CODES.CONFLICT, message });

    if (questions.length === 0) throw problem('Add at least one question before publishing');
    if (kind !== 'choice') return;

    questions.forEach((question, index) => {
      const number = index + 1;
      if (question.options.length < TESTS.MIN_OPTIONS) {
        throw problem(`Question ${number} needs at least ${TESTS.MIN_OPTIONS} answer options`);
      }
      if (!question.options.some((option) => option.isCorrect)) {
        throw problem(`Question ${number} has no correct option`);
      }
    });
  }
}
