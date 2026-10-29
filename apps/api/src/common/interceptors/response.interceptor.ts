import type { ApiSuccessResponse, PaginationMeta } from '@formula/shared';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, map } from 'rxjs';

import { PaginatedResult } from '../paginated-result.js';

/** Wraps every successful response into the shared `ApiSuccessResponse` envelope. */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<unknown>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<unknown>> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof PaginatedResult) {
          const meta: PaginationMeta = data.meta;
          return { success: true as const, data: data.items, meta };
        }
        return { success: true as const, data: data ?? null };
      }),
    );
  }
}
