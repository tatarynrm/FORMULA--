import { AUTH_COOKIES } from '@formula/shared';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/cabinet', '/admin', '/onboarding'];
const GUEST_ONLY_PATHS = ['/login', '/register'];

function matchesSection(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Reads the role claim from the access token WITHOUT verifying the signature.
 * It is only a hint to redirect students away early; every admin api route still verifies the
 * token and the role, so a forged cookie gains nothing.
 */
function readRoleHint(request: NextRequest): string | null {
  const token = request.cookies.get(AUTH_COOKIES.ACCESS)?.value;
  const payload = token?.split('.')[1];
  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const role: unknown = (JSON.parse(json) as { role?: unknown }).role;
    return typeof role === 'string' ? role : null;
  } catch {
    return null;
  }
}

/**
 * Optimistic gate: only checks that a refresh cookie exists, so signed-out visitors never see the
 * cabinet shell, and bounces students away from /admin. Real authorization happens in the api.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(AUTH_COOKIES.REFRESH);

  if (!hasSession && PROTECTED_PREFIXES.some((prefix) => matchesSection(pathname, prefix))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && matchesSection(pathname, '/admin')) {
    const role = readRoleHint(request);
    // No access cookie (expired) means unknown role: the client-side AdminGuard decides after the refresh.
    if (role !== null && role !== 'admin') {
      return NextResponse.redirect(new URL('/cabinet', request.url));
    }
  }

  if (hasSession && GUEST_ONLY_PATHS.includes(pathname)) {
    const role = readRoleHint(request);
    return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/cabinet', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cabinet/:path*', '/admin/:path*', '/onboarding', '/login', '/register'],
};
