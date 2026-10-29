import type {
  AdminSubject,
  AdminSubjectTree,
  AdminSubtopic,
  CatalogSubtopic,
  Material,
  StudentSubject,
  StudentSubtopic,
  SubjectGrant,
  SubtopicGrant,
} from '@formula/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { sanitizeRichText } from '../../common/utils/sanitize-html.js';
import { AccessService } from '../access/access.service.js';
import { FilesService } from '../files/files.service.js';
import { NOTIFICATION_TEXTS } from '../notifications/notification-texts.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CatalogRepository } from './catalog.repository.js';
import type {
  CreateMaterialDto,
  CreateSubjectDto,
  CreateSubtopicDto,
  CreateTopicDto,
  UpdateSubjectDto,
  UpdateSubtopicDto,
  UpdateTopicDto,
} from './dto/catalog.dto.js';

@Injectable()
export class CatalogService {
  constructor(
    private readonly repository: CatalogRepository,
    private readonly access: AccessService,
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---- Admin: subjects, topics, subtopics ----

  listSubjects(): Promise<AdminSubject[]> {
    return this.repository.listSubjects();
  }

  async getSubjectTree(id: string): Promise<AdminSubjectTree> {
    const subject = await this.repository.findSubject(id);
    if (!subject) throw new NotFoundException('Subject not found');
    return { ...subject, topics: await this.repository.listTopics(id) };
  }

  async createSubject(dto: CreateSubjectDto): Promise<AdminSubject> {
    const id = await this.repository.createSubject(dto.title, dto.description ?? null);
    return this.requireSubject(id);
  }

  async updateSubject(id: string, dto: UpdateSubjectDto): Promise<AdminSubject> {
    if (!(await this.repository.updateSubject(id, dto)))
      throw new NotFoundException('Subject not found');
    return this.requireSubject(id);
  }

  async deleteSubject(id: string): Promise<void> {
    if (!(await this.repository.deleteSubject(id)))
      throw new NotFoundException('Subject not found');
  }

  async createTopic(subjectId: string, dto: CreateTopicDto): Promise<AdminSubjectTree> {
    if (!(await this.repository.createTopic(subjectId, dto.title)))
      throw new NotFoundException('Subject not found');
    return this.getSubjectTree(subjectId);
  }

  async updateTopic(id: string, dto: UpdateTopicDto): Promise<void> {
    if (!(await this.repository.updateTopic(id, dto)))
      throw new NotFoundException('Topic not found');
  }

  async deleteTopic(id: string): Promise<void> {
    if (!(await this.repository.deleteTopic(id))) throw new NotFoundException('Topic not found');
  }

  async createSubtopic(topicId: string, dto: CreateSubtopicDto): Promise<{ id: string }> {
    const id = await this.repository.createSubtopic(topicId, dto.title, dto.isFree ?? false);
    if (!id) throw new NotFoundException('Topic not found');
    return { id };
  }

  async getSubtopic(id: string): Promise<AdminSubtopic> {
    const subtopic = await this.repository.findSubtopicContext(id);
    if (!subtopic) throw new NotFoundException('Subtopic not found');

    return {
      id: subtopic.id,
      topicId: subtopic.topicId,
      title: subtopic.title,
      status: subtopic.status,
      isFree: subtopic.isFree,
      sortOrder: 0,
      materialCount: subtopic.materialCount,
      testCount: subtopic.testCount,
      descriptionHtml: subtopic.descriptionHtml,
      subjectId: subtopic.subjectId,
      subjectTitle: subtopic.subjectTitle,
      topicTitle: subtopic.topicTitle,
      materials: await this.repository.listMaterials(id),
    };
  }

  async updateSubtopic(id: string, dto: UpdateSubtopicDto): Promise<AdminSubtopic> {
    const patch = {
      ...dto,
      ...(dto.descriptionHtml !== undefined
        ? { descriptionHtml: sanitizeRichText(dto.descriptionHtml) }
        : {}),
    };
    if (!(await this.repository.updateSubtopic(id, patch)))
      throw new NotFoundException('Subtopic not found');
    return this.getSubtopic(id);
  }

  async deleteSubtopic(id: string): Promise<void> {
    if (!(await this.repository.deleteSubtopic(id)))
      throw new NotFoundException('Subtopic not found');
  }

  // ---- Admin: materials ----

  async addMaterial(subtopicId: string, dto: CreateMaterialDto): Promise<Material> {
    const material = await this.repository.createMaterial({ subtopicId, ...dto });
    if (!material) {
      throw new BadRequestException(
        'Unknown subtopic, or the file is missing or has another purpose than the material kind',
      );
    }
    return material;
  }

  async renameMaterial(id: string, title: string): Promise<void> {
    if (!(await this.repository.renameMaterial(id, title)))
      throw new NotFoundException('Material not found');
  }

  async deleteMaterial(id: string): Promise<void> {
    const fileId = await this.repository.deleteMaterial(id);
    if (!fileId) throw new NotFoundException('Material not found');
    // The uploaded video or document is useless once its material is gone.
    await this.files.deleteIfUnused(fileId);
  }

  // ---- Admin: order ----

  reorderSubjects(ids: string[]): Promise<void> {
    return this.repository.reorderSubjects(ids);
  }

  reorderTopics(subjectId: string, ids: string[]): Promise<void> {
    return this.repository.reorderTopics(subjectId, ids);
  }

  reorderSubtopics(topicId: string, ids: string[]): Promise<void> {
    return this.repository.reorderSubtopics(topicId, ids);
  }

  reorderMaterials(subtopicId: string, ids: string[]): Promise<void> {
    return this.repository.reorderMaterials(subtopicId, ids);
  }

  // ---- Admin: access grants ----

  listGrants(userId: string): Promise<SubtopicGrant[]> {
    return this.repository.listGrants(userId);
  }

  async grant(userId: string, subtopicId: string, grantedBy: string): Promise<SubtopicGrant[]> {
    const before = new Set((await this.repository.listGrants(userId)).map((g) => g.subtopicId));
    if (!(await this.repository.grant(userId, subtopicId, grantedBy))) {
      throw new NotFoundException('User or subtopic not found');
    }
    const grants = await this.repository.listGrants(userId);
    await this.notifyNewGrants(
      userId,
      grants.filter((grant) => !before.has(grant.subtopicId)),
    );
    return grants;
  }

  /** Replaces the individual subtopic grants of a student with the given set (several at once). */
  async setGrants(
    userId: string,
    subtopicIds: string[],
    grantedBy: string,
  ): Promise<SubtopicGrant[]> {
    const before = new Set((await this.repository.listGrants(userId)).map((g) => g.subtopicId));
    await this.repository.setGrants(userId, [...new Set(subtopicIds)], grantedBy);
    const grants = await this.repository.listGrants(userId);
    await this.notifyNewGrants(
      userId,
      grants.filter((grant) => !before.has(grant.subtopicId)),
    );
    return grants;
  }

  /** The student's bell: one entry for everything opened in this action. */
  private async notifyNewGrants(userId: string, added: SubtopicGrant[]): Promise<void> {
    if (added.length === 0) return;
    const [first] = added;
    await this.notifications.notify(userId, {
      type: 'access_granted',
      ...NOTIFICATION_TEXTS.accessSubtopics(added.map((grant) => grant.subtopicTitle)),
      link: added.length === 1 && first ? `/cabinet/subtopics/${first.subtopicId}` : '/cabinet',
      data: { subtopicIds: added.map((grant) => grant.subtopicId) },
    });
  }

  async revoke(userId: string, subtopicId: string): Promise<SubtopicGrant[]> {
    await this.repository.revoke(userId, subtopicId);
    return this.repository.listGrants(userId);
  }

  listSubjectGrants(userId: string): Promise<SubjectGrant[]> {
    return this.repository.listSubjectGrants(userId);
  }

  /** Opens every subtopic of a subject for the student, including the ones added later. */
  async grantSubject(
    userId: string,
    subjectId: string,
    grantedBy: string,
  ): Promise<SubjectGrant[]> {
    if (!(await this.repository.grantSubject(userId, subjectId, grantedBy))) {
      throw new NotFoundException('User or subject not found');
    }
    const subject = await this.repository.findSubject(subjectId);
    if (subject) {
      await this.notifications.notify(userId, {
        type: 'access_granted',
        ...NOTIFICATION_TEXTS.accessSubject(subject.title),
        link: `/cabinet/subjects/${subjectId}`,
        data: { subjectId },
      });
    }
    return this.repository.listSubjectGrants(userId);
  }

  async revokeSubject(userId: string, subjectId: string): Promise<SubjectGrant[]> {
    await this.repository.revokeSubject(userId, subjectId);
    return this.repository.listSubjectGrants(userId);
  }

  listAllSubtopics(): Promise<CatalogSubtopic[]> {
    return this.repository.listAllSubtopics();
  }

  // ---- Student ----

  async listStudentSubjects(userId: string): Promise<StudentSubject[]> {
    return this.buildStudentTree(userId);
  }

  async getStudentSubject(userId: string, subjectId: string): Promise<StudentSubject> {
    const [subject] = await this.buildStudentTree(userId, subjectId);
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  /** Content (description and materials) is only sent to students who have access. */
  async getStudentSubtopic(userId: string, id: string): Promise<StudentSubtopic> {
    const [subtopic, context] = await Promise.all([
      this.repository.findSubtopicContext(id),
      this.access.getContext(userId),
    ]);
    // Drafts are invisible to students; admins may open them to preview.
    const isAdmin = context?.role === 'admin';
    if (!subtopic || (!subtopic.visible && !isAdmin))
      throw new NotFoundException('Subtopic not found');

    const hasAccess = isAdmin || (await this.repository.hasAccess(userId, id));

    return {
      id: subtopic.id,
      title: subtopic.title,
      isFree: subtopic.isFree,
      hasAccess,
      subjectId: subtopic.subjectId,
      subjectTitle: subtopic.subjectTitle,
      topicTitle: subtopic.topicTitle,
      descriptionHtml: hasAccess ? subtopic.descriptionHtml : '',
      materials: hasAccess ? await this.repository.listMaterials(id) : [],
    };
  }

  /** Whether the student may open the subtopic's content and take its tests. */
  async canOpenSubtopic(userId: string, subtopicId: string): Promise<boolean> {
    const context = await this.access.getContext(userId);
    if (context?.role === 'admin') return true;
    return this.repository.hasAccess(userId, subtopicId);
  }

  private async buildStudentTree(userId: string, subjectId?: string): Promise<StudentSubject[]> {
    const context = await this.access.getContext(userId);
    const tree = await this.repository.findPublishedTree(
      userId,
      context?.role === 'admin',
      subjectId,
    );

    return tree.subjects.map((subject) => ({
      id: subject.id,
      title: subject.title,
      description: subject.description,
      hasFullAccess: subject.full_access,
      topics: tree.topics
        .filter((topic) => topic.subject_id === subject.id)
        .map((topic) => ({
          id: topic.id,
          title: topic.title,
          subtopics: tree.subtopics
            .filter((subtopic) => subtopic.topic_id === topic.id)
            .map((subtopic) => ({
              id: subtopic.id,
              title: subtopic.title,
              isFree: subtopic.is_free,
              hasAccess: subtopic.has_access,
              testCount: Number(subtopic.test_count),
            })),
        })),
    }));
  }

  private async requireSubject(id: string): Promise<AdminSubject> {
    const subject = await this.repository.findSubject(id);
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }
}
