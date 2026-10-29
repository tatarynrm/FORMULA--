import { AUTH_COOKIES } from '@formula/shared';
import { JwtService } from '@nestjs/jwt';

import { createUserAwareTracker } from './user-tracker.js';

const SECRET = 's'.repeat(40);
const jwt = new JwtService();
const track = createUserAwareTracker(SECRET);

const request = (token: string | undefined, ip = '10.0.0.1') => ({
  ip,
  cookies: token ? { [AUTH_COOKIES.ACCESS]: token } : {},
});

describe('createUserAwareTracker', () => {
  it('counts a signed-in user by account, not by address', async () => {
    const token = await jwt.signAsync(
      { sub: 'user-1', type: 'access' },
      { secret: SECRET, expiresIn: 60 },
    );

    expect(await track(request(token, '10.0.0.1'))).toBe('user:user-1');
    expect(await track(request(token, '10.0.0.2'))).toBe('user:user-1');
  });

  it('counts anonymous requests by address', async () => {
    expect(await track(request(undefined))).toBe('ip:10.0.0.1');
  });

  it('does not trust a forged, expired or wrong-type token', async () => {
    const forged = await jwt.signAsync(
      { sub: 'victim', type: 'access' },
      { secret: 'x'.repeat(40), expiresIn: 60 },
    );
    const expired = await jwt.signAsync(
      { sub: 'user-1', type: 'access' },
      { secret: SECRET, expiresIn: -10 },
    );
    const refresh = await jwt.signAsync(
      { sub: 'user-1', type: 'refresh' },
      { secret: SECRET, expiresIn: 60 },
    );

    expect(await track(request(forged))).toBe('ip:10.0.0.1');
    expect(await track(request(expired))).toBe('ip:10.0.0.1');
    expect(await track(request(refresh))).toBe('ip:10.0.0.1');
    expect(await track(request('not-a-jwt'))).toBe('ip:10.0.0.1');
  });
});
