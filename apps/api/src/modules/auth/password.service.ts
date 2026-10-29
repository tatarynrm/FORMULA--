import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

const KEY_LENGTH = 64;
const COST = 32_768; // N
const BLOCK_SIZE = 8; // r
const PARALLELISM = 1; // p
const MAX_MEMORY = 64 * 1024 * 1024;

function deriveKey(
  password: string,
  salt: Buffer,
  cost: number,
  blockSize: number,
  parallelism: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      { N: cost, r: blockSize, p: parallelism, maxmem: MAX_MEMORY },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/**
 * Password hashing with scrypt from node:crypto (no native dependency).
 * Stored format: `scrypt$N$r$p$salt(base64)$hash(base64)`, so parameters can be raised later
 * without breaking existing hashes.
 */
@Injectable()
export class PasswordService {
  private dummyHash: Promise<string> | null = null;

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await deriveKey(password, salt, COST, BLOCK_SIZE, PARALLELISM);
    return [
      'scrypt',
      COST,
      BLOCK_SIZE,
      PARALLELISM,
      salt.toString('base64'),
      key.toString('base64'),
    ].join('$');
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [scheme, cost, blockSize, parallelism, salt, hash] = stored.split('$');
    if (scheme !== 'scrypt' || !cost || !blockSize || !parallelism || !salt || !hash) {
      return false;
    }

    const expected = Buffer.from(hash, 'base64');
    const actual = await deriveKey(
      password,
      Buffer.from(salt, 'base64'),
      Number(cost),
      Number(blockSize),
      Number(parallelism),
    );

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  /**
   * A valid hash of a random password. Verifying against it when the account does not exist keeps
   * the response time of "unknown email" and "wrong password" the same.
   */
  getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hash(randomBytes(16).toString('hex'));
    return this.dummyHash;
  }
}
