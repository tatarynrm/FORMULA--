import type { CatalogSubtopic } from '@formula/shared';

export interface AccessTopic {
  id: string;
  title: string;
  subtopics: CatalogSubtopic[];
}

export interface AccessSubject {
  id: string;
  title: string;
  topics: AccessTopic[];
}

/** Groups the flat catalog into subject > topic > subtopics, in the order the api sorted it. */
export function buildAccessTree(subtopics: readonly CatalogSubtopic[]): AccessSubject[] {
  const subjects = new Map<string, AccessSubject>();

  for (const subtopic of subtopics) {
    let subject = subjects.get(subtopic.subjectId);
    if (!subject) {
      subject = { id: subtopic.subjectId, title: subtopic.subjectTitle, topics: [] };
      subjects.set(subtopic.subjectId, subject);
    }

    let topic = subject.topics.find((candidate) => candidate.id === subtopic.topicId);
    if (!topic) {
      topic = { id: subtopic.topicId, title: subtopic.topicTitle, subtopics: [] };
      subject.topics.push(topic);
    }
    topic.subtopics.push(subtopic);
  }

  return [...subjects.values()];
}

const normalize = (text: string) => text.trim().toLocaleLowerCase('uk');

/**
 * The part of the tree that matches `query` (case-insensitive, any of the three titles). A
 * matching subject or topic keeps all of its children; otherwise only the matching subtopics stay.
 */
export function filterAccessTree(tree: readonly AccessSubject[], query: string): AccessSubject[] {
  const needle = normalize(query);
  if (needle === '') return [...tree];

  const matches = (title: string) => normalize(title).includes(needle);

  return tree.flatMap((subject) => {
    if (matches(subject.title)) return [subject];

    const topics = subject.topics.flatMap((topic) => {
      if (matches(topic.title)) return [topic];
      const subtopics = topic.subtopics.filter((subtopic) => matches(subtopic.title));
      return subtopics.length > 0 ? [{ ...topic, subtopics }] : [];
    });
    return topics.length > 0 ? [{ ...subject, topics }] : [];
  });
}

/** `true` when both sets hold the same ids. */
export function sameIds(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  if (left.size !== right.size) return false;
  for (const id of left) if (!right.has(id)) return false;
  return true;
}
