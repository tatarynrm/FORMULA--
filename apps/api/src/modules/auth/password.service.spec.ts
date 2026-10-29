import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await service.hash('correct horse battery staple');

    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await service.verify('correct horse battery staple', hash)).toBe(true);
    expect(await service.verify('wrong password', hash)).toBe(false);
  });

  it('salts every hash', async () => {
    const [first, second] = await Promise.all([
      service.hash('same-password'),
      service.hash('same-password'),
    ]);

    expect(first).not.toBe(second);
  });

  it('rejects malformed stored hashes', async () => {
    expect(await service.verify('anything', 'not-a-hash')).toBe(false);
    expect(await service.verify('anything', '')).toBe(false);
  });
});
