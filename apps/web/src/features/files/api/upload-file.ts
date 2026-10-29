import { ERROR_CODES, type ErrorCode, type FilePurpose, type UploadedFile } from '@formula/shared';

import { ApiClientError, refreshSession } from '@/lib/api-client';
import { env } from '@/lib/env';
import { t } from '@/locales';

interface UploadOptions {
  file: File;
  purpose: FilePurpose;
  /** 0-100, called while the bytes are sent (videos can be large). */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

interface Envelope {
  success: boolean;
  data?: UploadedFile;
  error?: { message?: string; code?: ErrorCode };
}

function send({
  file,
  purpose,
  onProgress,
  signal,
}: UploadOptions): Promise<{ status: number; body: Envelope | null }> {
  return new Promise((resolve, reject) => {
    // `fetch` cannot report upload progress, so XMLHttpRequest is used here.
    const request = new XMLHttpRequest();
    request.open('POST', `${env.NEXT_PUBLIC_API_URL}/uploads?purpose=${purpose}`);
    request.withCredentials = true;
    request.responseType = 'json';

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      resolve({ status: request.status, body: request.response as Envelope | null });
    request.onerror = () =>
      reject(new ApiClientError(t.errors.network, 0, ERROR_CODES.SERVICE_UNAVAILABLE));
    request.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
    signal?.addEventListener('abort', () => request.abort(), { once: true });

    const form = new FormData();
    form.append('file', file);
    request.send(form);
  });
}

/**
 * Uploads one file to the api (`POST /uploads?purpose=...`) with progress. An expired session is
 * renewed once and the upload retried, like in `apiFetch`.
 */
export async function uploadFile(options: UploadOptions): Promise<UploadedFile> {
  let result = await send(options);

  if (result.status === 401 && (await refreshSession())) {
    result = await send(options);
  }

  const { status, body } = result;
  if (body?.success && body.data) return body.data;

  throw new ApiClientError(
    body?.error?.message ?? t.errors.genericDescription,
    status,
    body?.error?.code ?? ERROR_CODES.INTERNAL,
  );
}
