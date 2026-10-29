import {
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
  ERROR_CODES,
  type ErrorCode,
  type PaginationMeta,
} from '@formula/shared';

import { t } from '@/locales';

import { env } from './env';

/** Thrown for every non-success api response (and for network failures). */
export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: ErrorCode,
    readonly details?: ApiErrorResponse['error']['details'],
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip the silent session refresh on 401 (used by the auth endpoints themselves). */
  skipRefresh?: boolean;
}

// Several requests can fail with 401 at once; they must share a single refresh call,
// because the refresh token is rotated and a second call would be treated as token theft.
let refreshInFlight: Promise<boolean> | null = null;

/** Renews the session cookies once. Also used by file uploads, which do not go through `apiFetch`. */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function send(path: string, options: ApiFetchOptions): Promise<Response> {
  const { body, skipRefresh: _skipRefresh, headers, ...init } = options;

  try {
    return await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      ...init,
      // The session lives in httpOnly cookies set by the api.
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError(t.errors.network, 0, ERROR_CODES.SERVICE_UNAVAILABLE);
  }
}

async function request<T>(path: string, options: ApiFetchOptions): Promise<ApiSuccessResponse<T>> {
  let response = await send(path, options);

  if (response.status === 401 && !options.skipRefresh && (await refreshSession())) {
    response = await send(path, options);
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (payload && payload.success) {
    return payload;
  }

  const error = payload && !payload.success ? payload.error : null;
  throw new ApiClientError(
    error?.message ?? response.statusText,
    response.status,
    error?.code ?? ERROR_CODES.INTERNAL,
    error?.details,
  );
}

/**
 * Typed fetch wrapper for the Formula api. Unwraps `ApiSuccessResponse.data`, converts
 * `ApiErrorResponse` into `ApiClientError` and transparently refreshes an expired session once.
 * `path` is relative to the api base URL, e.g. `/v1/auth/login`.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  return (await request<T>(path, options)).data;
}

/** Like `apiFetch`, for paginated endpoints: returns the items together with the pagination meta. */
export async function apiFetchPage<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<{ items: T[]; meta: PaginationMeta }> {
  const payload = await request<T[]>(path, options);
  return {
    items: payload.data,
    meta: payload.meta ?? {
      page: 1,
      limit: payload.data.length,
      total: payload.data.length,
      totalPages: 1,
    },
  };
}
