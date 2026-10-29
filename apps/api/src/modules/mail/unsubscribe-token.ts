import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Proof that an unsubscribe link was made by us for this very person. Signed with a key derived
 * from the server secret, so nothing is stored and the link never expires (an old email must
 * keep working).
 */
function sign(secret: string, userId: string): string {
  return createHmac('sha256', secret).update(`email-unsubscribe:${userId}`).digest('base64url');
}

export function createUnsubscribeToken(secret: string, userId: string): string {
  return sign(secret, userId);
}

export function isValidUnsubscribeToken(secret: string, userId: string, token: string): boolean {
  const expected = Buffer.from(sign(secret, userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
