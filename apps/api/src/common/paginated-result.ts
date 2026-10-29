import type { PaginationMeta } from '@formula/shared';

/** Return this from a controller to get `{ success, data: items, meta }` in the response. */
export class PaginatedResult<T> {
  readonly meta: PaginationMeta;

  constructor(
    readonly items: T[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.meta = { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
}
