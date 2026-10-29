import { AUTH_COOKIES } from '@formula/shared';
import { JwtService } from '@nestjs/jwt';

/**
 * Decides whose bucket a request counts against. A signed-in student counts against their own
 * account, so a whole classroom behind one school IP does not use up a shared limit. Everyone else
 * (anonymous, or a token that is expired or forged) counts against the IP address, so the token is
 * never trusted without verifying its signature.
 */
export function createUserAwareTracker(accessSecret: string) {
  const jwt = new JwtService();

  return async (req: Record<string, unknown>): Promise<string> => {
    const cookies = req['cookies'] as Record<string, unknown> | undefined;
    const token = cookies?.[AUTH_COOKIES.ACCESS];

    if (typeof token === 'string') {
      try {
        const payload = await jwt.verifyAsync<{ sub?: unknown; type?: unknown }>(token, {
          secret: accessSecret,
        });
        if (payload.type === 'access' && typeof payload.sub === 'string') {
          return `user:${payload.sub}`;
        }
      } catch {
        // Expired or forged: fall back to the address below.
      }
    }

    return `ip:${String(req['ip'] ?? 'unknown')}`;
  };
}
