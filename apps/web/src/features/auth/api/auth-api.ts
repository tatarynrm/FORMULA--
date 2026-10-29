import type { AuthSession, ChangePasswordInput, LoginInput, RegisterInput } from '@formula/shared';

import { apiFetch } from '@/lib/api-client';

// The auth endpoints must not trigger the silent refresh themselves (a 401 there is a real answer).
export const authApi = {
  login: (input: LoginInput) =>
    apiFetch<AuthSession>('/auth/login', { method: 'POST', body: input, skipRefresh: true }),

  register: (input: RegisterInput) =>
    apiFetch<AuthSession>('/auth/register', { method: 'POST', body: input, skipRefresh: true }),

  logout: () => apiFetch<null>('/auth/logout', { method: 'POST', skipRefresh: true }),

  /** Ends every other session and keeps this device signed in (the api sets fresh cookies). */
  changePassword: (input: ChangePasswordInput) =>
    apiFetch<AuthSession>('/auth/password', { method: 'PUT', body: input }),

  /** The signed-in user. A 401 first tries to refresh the session, then fails for real. */
  me: () => apiFetch<AuthSession>('/auth/me'),
};
