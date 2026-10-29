import type { AccessService } from '../access/access.service.js';
import type { ProgressRepository, SubtopicProgressRow } from './progress.repository.js';
import { ProgressService } from './progress.service.js';

function row(overrides: Partial<SubtopicProgressRow>): SubtopicProgressRow {
  return {
    subjectId: 'subject-1',
    subjectTitle: 'Biochemistry',
    subjectDescription: null,
    topicCount: 2,
    hasFullAccess: false,
    subtopicId: 'subtopic-1',
    hasAccess: true,
    testCount: 2,
    finishedTests: 2,
    ...overrides,
  };
}

function createService(rows: SubtopicProgressRow[]) {
  const repository = {
    findSubtopicProgress: async () => rows,
    findAttemptTotals: async () => ({ testsPassed: 4, averagePercent: 80, mistakes: 3 }),
  } as unknown as ProgressRepository;
  const access = {
    getContext: async () => ({ role: 'student', adminLevel: null, permissions: [] }),
  } as unknown as AccessService;
  return new ProgressService(repository, access);
}

describe('ProgressService', () => {
  it('counts a subtopic as done only when every test was finished', async () => {
    const service = createService([
      row({ subtopicId: 'a', testCount: 2, finishedTests: 2 }),
      row({ subtopicId: 'b', testCount: 2, finishedTests: 1 }),
      row({ subtopicId: 'c', testCount: 0, finishedTests: 0 }),
    ]);

    const summary = await service.getSummary('user');
    expect(summary).toMatchObject({
      subtopicsTotal: 3,
      subtopicsDone: 1,
      testsPassed: 4,
      averagePercent: 80,
      mistakes: 3,
    });
  });

  it('ignores locked subtopics in the totals', async () => {
    const service = createService([
      row({ subtopicId: 'a' }),
      row({ subtopicId: 'locked', hasAccess: false, finishedTests: 0 }),
    ]);

    expect(await service.getSummary('user')).toMatchObject({ subtopicsTotal: 1, subtopicsDone: 1 });

    const [course] = await service.getSubjects('user');
    expect(course).toMatchObject({
      subtopicsTotal: 2,
      subtopicsAccessible: 1,
      subtopicsDone: 1,
      percent: 100,
    });
  });

  it('lists a subject without subtopics with zero progress', async () => {
    const service = createService([
      row({ subtopicId: null, hasAccess: false, testCount: 0, finishedTests: 0 }),
    ]);

    const [course] = await service.getSubjects('user');
    expect(course).toMatchObject({
      subtopicsTotal: 0,
      subtopicsAccessible: 0,
      percent: 0,
      topicCount: 2,
    });
  });

  it('rounds the percent of a course', async () => {
    const service = createService([
      row({ subtopicId: 'a' }),
      row({ subtopicId: 'b', finishedTests: 0 }),
      row({ subtopicId: 'c', finishedTests: 0 }),
    ]);

    const [course] = await service.getSubjects('user');
    expect(course?.percent).toBe(33);
  });
});
