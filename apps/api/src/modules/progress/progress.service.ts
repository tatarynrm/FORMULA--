import type { ProgressSummary, SubjectProgress } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { AccessService } from '../access/access.service.js';
import { ProgressRepository, type SubtopicProgressRow } from './progress.repository.js';

/** A subtopic counts as done when it has tests and every one of them was finished at least once. */
function isDone(row: SubtopicProgressRow): boolean {
  return row.testCount > 0 && row.finishedTests >= row.testCount;
}

@Injectable()
export class ProgressService {
  constructor(
    private readonly repository: ProgressRepository,
    private readonly access: AccessService,
  ) {}

  async getSummary(userId: string): Promise<ProgressSummary> {
    const [rows, totals] = await Promise.all([
      this.loadRows(userId),
      this.repository.findAttemptTotals(userId),
    ]);

    const open = rows.filter((row) => row.subtopicId && row.hasAccess);
    return {
      ...totals,
      subtopicsDone: open.filter(isDone).length,
      subtopicsTotal: open.length,
    };
  }

  async getSubjects(userId: string): Promise<SubjectProgress[]> {
    const rows = await this.loadRows(userId);
    const subjects = new Map<string, SubjectProgress>();

    for (const row of rows) {
      const subject =
        subjects.get(row.subjectId) ??
        ({
          subjectId: row.subjectId,
          title: row.subjectTitle,
          description: row.subjectDescription,
          topicCount: row.topicCount,
          hasFullAccess: row.hasFullAccess,
          subtopicsTotal: 0,
          subtopicsAccessible: 0,
          subtopicsDone: 0,
          percent: 0,
        } satisfies SubjectProgress);
      subjects.set(row.subjectId, subject);

      if (!row.subtopicId) continue;
      subject.subtopicsTotal += 1;
      if (row.hasAccess) {
        subject.subtopicsAccessible += 1;
        if (isDone(row)) subject.subtopicsDone += 1;
      }
    }

    return [...subjects.values()].map((subject) => ({
      ...subject,
      percent:
        subject.subtopicsAccessible === 0
          ? 0
          : Math.round((subject.subtopicsDone / subject.subtopicsAccessible) * 100),
    }));
  }

  private async loadRows(userId: string): Promise<SubtopicProgressRow[]> {
    const isAdmin = (await this.access.getContext(userId))?.role === 'admin';
    return this.repository.findSubtopicProgress(userId, isAdmin);
  }
}
