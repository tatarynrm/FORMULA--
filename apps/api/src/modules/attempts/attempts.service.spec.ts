import { BadRequestException, ConflictException } from '@nestjs/common';

import type { NotificationsService } from '../notifications/notifications.service.js';
import type { TestsService } from '../tests/tests.service.js';
import {
  type AnswerRecord,
  type AttemptRecord,
  type AttemptsRepository,
  type FullQuestion,
} from './attempts.repository.js';
import { AttemptsService } from './attempts.service.js';

const USER = 'user-1';

function option(
  id: string,
  position: number,
  isCorrect: boolean,
  explanation: string | null = null,
) {
  return { id, position, body: id, imageFileId: null, explanation, isCorrect };
}

const choiceQuestions: FullQuestion[] = [
  {
    id: 'q1',
    position: 1,
    body: 'One right answer',
    imageFileId: null,
    explanation: 'Because.',
    maxScore: 1,
    options: [option('a', 1, false), option('b', 2, true, 'This one'), option('c', 3, false)],
  },
  {
    id: 'q2',
    position: 2,
    body: 'Two right answers',
    imageFileId: null,
    explanation: null,
    maxScore: 1,
    options: [option('d', 1, true), option('e', 2, false), option('f', 3, true)],
  },
];

const situationalQuestions: FullQuestion[] = [
  {
    id: 's1',
    position: 1,
    body: 'Explain',
    imageFileId: null,
    explanation: 'Model answer',
    maxScore: 5,
    options: [],
  },
  {
    id: 's2',
    position: 2,
    body: 'Describe',
    imageFileId: null,
    explanation: null,
    maxScore: 3,
    options: [],
  },
];

/** In-memory stand-in for the attempts tables. */
class FakeRepository {
  attempt: AttemptRecord;
  answers: AnswerRecord[] = [];
  finished: {
    status: string;
    score: number | null;
    maxScore: number;
    correctCount: number | null;
    totalCount: number;
  } | null = null;
  reviewed: { totalScore: number } | null = null;

  constructor(
    private readonly questions: FullQuestion[],
    kind: 'choice' | 'situational',
    overrides: Partial<AttemptRecord> = {},
  ) {
    this.attempt = {
      id: 'attempt-1',
      userId: USER,
      testId: 'test-1',
      status: 'in_progress',
      timed: false,
      timeLimitSeconds: null,
      explanationsEnabled: false,
      startedAt: new Date(),
      finishedAt: null,
      reviewedAt: null,
      score: null,
      maxScore: null,
      correctCount: null,
      totalCount: null,
      testTitle: 'Test',
      testKind: kind,
      testCollection: 'base',
      testSubtopicId: null,
      testSubtopicTitle: null,
      testTopicTitle: null,
      testSubjectTitle: null,
      ...overrides,
    };
  }

  async findById() {
    return this.attempt;
  }
  async loadQuestions() {
    return this.questions;
  }
  async getAnswers() {
    return this.answers;
  }
  async upsertAnswer(input: {
    questionId: string;
    optionIds: string[];
    textAnswer: string | null;
    isCorrect: boolean | null;
  }) {
    this.answers = this.answers.filter((answer) => answer.questionId !== input.questionId);
    this.answers.push({ ...input, score: null, reviewerComment: null });
  }
  async finish(input: {
    status: 'completed' | 'pending_review';
    score: number | null;
    maxScore: number;
    correctCount: number | null;
    totalCount: number;
  }) {
    this.finished = input;
    this.attempt = {
      ...this.attempt,
      status: input.status,
      finishedAt: new Date(),
      score: input.score,
      maxScore: input.maxScore,
      correctCount: input.correctCount,
      totalCount: input.totalCount,
    };
    return true;
  }
  async findStudent() {
    return { name: 'Anna Test', email: 'anna@example.com' };
  }
  async applyReview(input: { totalScore: number }) {
    this.reviewed = input;
    this.attempt = { ...this.attempt, status: 'reviewed', score: input.totalScore };
    return true;
  }
}

/** Notifications are a side effect of grading; here they are swallowed. */
const notifications = {
  notify: async () => null,
  notifySection: async () => undefined,
} as unknown as NotificationsService;

function createService(repository: FakeRepository) {
  return new AttemptsService(
    repository as unknown as AttemptsRepository,
    {} as TestsService,
    notifications,
  );
}

describe('AttemptsService (choice tests)', () => {
  it('grades a single and a multiple answer, and counts a skipped question as wrong', async () => {
    const repository = new FakeRepository(choiceQuestions, 'choice');
    const service = createService(repository);

    await service.saveAnswer(USER, 'attempt-1', 'q1', { optionIds: ['b'] });
    await service.saveAnswer(USER, 'attempt-1', 'q2', { optionIds: ['d'] }); // one of two right options: wrong

    const result = await service.finish(USER, 'attempt-1');
    expect(result.attempt).toMatchObject({
      status: 'completed',
      correctCount: 1,
      totalCount: 2,
      percent: 50,
    });
    expect(result.questions[0]?.isCorrect).toBe(true);
    expect(result.questions[1]?.isCorrect).toBe(false);
  });

  it('never sends the right answers in a session', async () => {
    const service = createService(new FakeRepository(choiceQuestions, 'choice'));

    const session = await service.getSession(USER, 'attempt-1');
    expect(JSON.stringify(session)).not.toMatch(/isCorrect|This one|Because/);
    expect(session.questions[0]?.multiple).toBe(false);
    expect(session.questions[1]?.multiple).toBe(true);
    expect(session.questions[0]?.options.map((o) => o.letter)).toEqual(['A', 'B', 'C']);
  });

  it('rejects two options for a single-answer question and unknown options', async () => {
    const service = createService(new FakeRepository(choiceQuestions, 'choice'));

    await expect(
      service.saveAnswer(USER, 'attempt-1', 'q1', { optionIds: ['a', 'b'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.saveAnswer(USER, 'attempt-1', 'q1', { optionIds: ['zzz'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('with explanations on, answers are final and come back with feedback', async () => {
    const service = createService(
      new FakeRepository(choiceQuestions, 'choice', { explanationsEnabled: true }),
    );

    const first = await service.saveAnswer(USER, 'attempt-1', 'q1', { optionIds: ['a'] });
    expect(first.feedback).toMatchObject({
      isCorrect: false,
      correctOptionIds: ['b'],
      explanation: 'Because.',
    });
    expect(first.feedback?.optionExplanations).toEqual({ b: 'This one' });

    await expect(
      service.saveAnswer(USER, 'attempt-1', 'q1', { optionIds: ['b'] }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('without explanations the answer can change and no feedback is returned', async () => {
    const service = createService(new FakeRepository(choiceQuestions, 'choice'));

    expect(
      (await service.saveAnswer(USER, 'attempt-1', 'q1', { optionIds: ['a'] })).feedback,
    ).toBeNull();
    await expect(
      service.saveAnswer(USER, 'attempt-1', 'q1', { optionIds: ['b'] }),
    ).resolves.toMatchObject({ saved: true });
  });

  it('refuses answers after the deadline but still grades what was saved', async () => {
    const startedAt = new Date(Date.now() - 60_000);
    const repository = new FakeRepository(choiceQuestions, 'choice', {
      timed: true,
      timeLimitSeconds: 30,
      startedAt,
    });
    repository.answers.push({
      questionId: 'q1',
      optionIds: ['b'],
      textAnswer: null,
      isCorrect: true,
      score: null,
      reviewerComment: null,
    });
    const service = createService(repository);

    await expect(
      service.saveAnswer(USER, 'attempt-1', 'q2', { optionIds: ['d', 'f'] }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect((await service.finish(USER, 'attempt-1')).attempt.correctCount).toBe(1);
  });

  it('hides attempts of other users', async () => {
    const service = createService(new FakeRepository(choiceQuestions, 'choice'));
    await expect(service.getSession('someone-else', 'attempt-1')).rejects.toThrow(
      'Attempt not found',
    );
  });
});

describe('AttemptsService (situational tests)', () => {
  it('waits for a review and hides the model answer until then', async () => {
    const repository = new FakeRepository(situationalQuestions, 'situational');
    const service = createService(repository);

    await service.saveAnswer(USER, 'attempt-1', 's1', { textAnswer: '  my answer  ' });
    const result = await service.finish(USER, 'attempt-1');

    expect(result.attempt).toMatchObject({ status: 'pending_review', percent: null, maxScore: 8 });
    expect(result.questions[0]).toMatchObject({
      textAnswer: 'my answer',
      explanation: null,
      score: null,
    });
  });

  it('a review needs a grade for every question and respects the maximum', async () => {
    const repository = new FakeRepository(situationalQuestions, 'situational', {
      status: 'pending_review',
      maxScore: 8,
    });
    const service = createService(repository);

    await expect(
      service.submitReview('admin', 'attempt-1', { grades: [{ questionId: 's1', score: 4 }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.submitReview('admin', 'attempt-1', {
        grades: [
          { questionId: 's1', score: 9 },
          { questionId: 's2', score: 0 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const detail = await service.submitReview('admin', 'attempt-1', {
      grades: [
        { questionId: 's1', score: 4, comment: ' good ' },
        { questionId: 's2', score: 1.5 },
      ],
    });
    expect(repository.reviewed?.totalScore).toBe(5.5);
    expect(detail.attempt.status).toBe('reviewed');
  });

  it('an attempt that is not waiting for a review cannot be reviewed', async () => {
    const service = createService(
      new FakeRepository(situationalQuestions, 'situational', { status: 'reviewed' }),
    );
    await expect(service.submitReview('admin', 'attempt-1', { grades: [] })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
