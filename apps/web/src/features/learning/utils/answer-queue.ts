import type { SaveAnswerInput } from '../api/attempts-api';

export type SaveStatus = 'saving' | 'saved' | 'error';

interface QueueEntry {
  /** The newest value that was not sent yet. Older unsent values are dropped: the last write wins. */
  pending: SaveAnswerInput | null;
  running: boolean;
  /** The value that could not be saved, kept so that "retry" can send it again. */
  failed: SaveAnswerInput | null;
  /** Debounce timer of a written answer. */
  timer: ReturnType<typeof setTimeout> | null;
}

export interface AnswerQueueOptions {
  /** Sends one answer. Rejects with the api error when it is not accepted. */
  send: (questionId: string, payload: SaveAnswerInput) => Promise<void>;
  onStatus: (questionId: string, status: SaveStatus) => void;
  /** Tells whether an error means "the attempt is closed": its time is over or it was finished elsewhere. */
  isClosedError: (error: unknown) => boolean;
  /** Tells whether an error means the student may not take this test any more (access withdrawn). */
  isRefusedError: (error: unknown) => boolean;
}

/**
 * Sends the answers that can change until the end (exam mode and written answers) to the api.
 * Requests of one question never overlap, so a slow older request cannot overwrite a newer answer: while
 * one is in flight only the newest value waits. `flush` resolves once everything has been sent.
 */
export class AnswerQueue {
  private readonly entries = new Map<string, QueueEntry>();
  private waiters: Array<() => void> = [];
  private closedHandler: () => void = () => undefined;
  private refusedHandler: () => void = () => undefined;

  constructor(private readonly options: AnswerQueueOptions) {}

  /** What to do when the api reports that the attempt is closed (time is over, or it was finished elsewhere). */
  setClosedHandler = (handler: () => void): void => {
    this.closedHandler = handler;
  };

  /** What to do when the api refuses the answer because access to the test was withdrawn. */
  setRefusedHandler = (handler: () => void): void => {
    this.refusedHandler = handler;
  };

  /** Saves `payload` for a question, at once or after `delayMs` of silence (for text that is being typed). */
  enqueue = (questionId: string, payload: SaveAnswerInput, delayMs = 0): void => {
    const entry = this.entryOf(questionId);
    entry.pending = payload;
    entry.failed = null;
    if (entry.timer !== null) clearTimeout(entry.timer);
    entry.timer = null;

    if (delayMs > 0) {
      entry.timer = setTimeout(() => {
        entry.timer = null;
        void this.run(questionId);
      }, delayMs);
      return;
    }
    void this.run(questionId);
  };

  /** Sends the value that failed once more. */
  retry = (questionId: string): void => {
    const entry = this.entries.get(questionId);
    if (!entry?.failed) return;
    entry.pending = entry.failed;
    entry.failed = null;
    void this.run(questionId);
  };

  /** Sends everything that is waiting. Resolves with the ids of questions that still could not be saved. */
  flush = async (): Promise<string[]> => {
    for (const [questionId, entry] of this.entries) {
      if (entry.timer !== null) {
        clearTimeout(entry.timer);
        entry.timer = null;
      }
      if (entry.pending && !entry.running) void this.run(questionId);
    }

    while ([...this.entries.values()].some((entry) => entry.running)) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }

    return [...this.entries]
      .filter(([, entry]) => entry.failed !== null)
      .map(([questionId]) => questionId);
  };

  private entryOf(questionId: string): QueueEntry {
    let entry = this.entries.get(questionId);
    if (!entry) {
      entry = { pending: null, running: false, failed: null, timer: null };
      this.entries.set(questionId, entry);
    }
    return entry;
  }

  private async run(questionId: string): Promise<void> {
    const entry = this.entries.get(questionId);
    if (!entry || entry.running) return;

    entry.running = true;
    this.options.onStatus(questionId, 'saving');

    try {
      while (entry.pending) {
        const payload = entry.pending;
        entry.pending = null;

        try {
          await this.options.send(questionId, payload);
          entry.failed = null;
        } catch (error) {
          // The answer changed while this request was in flight: the newer value replaces it.
          if (entry.pending) continue;

          this.options.onStatus(questionId, 'error');
          if (this.options.isClosedError(error)) {
            this.closedHandler();
          } else if (this.options.isRefusedError(error)) {
            this.refusedHandler();
          } else {
            entry.failed = payload;
          }
          return;
        }
      }
      this.options.onStatus(questionId, 'saved');
    } finally {
      entry.running = false;
      const waiters = this.waiters;
      this.waiters = [];
      for (const wake of waiters) wake();
    }
  }
}
