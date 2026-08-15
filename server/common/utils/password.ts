import { pbkdf2, randomBytes } from 'crypto';
import { promisify } from 'util';

export const ITERATIONS = 10000;
export const KEY_LEN = 64;
export const DIGEST = 'sha256';
export const PASSWORD_PREFIX = 'SALTED_SHA256';

const pbkdf2Async = promisify(pbkdf2);
const randomBytesAsync = promisify(randomBytes);

export async function hashPassword(password: string): Promise<string> {
  const salt = (await randomBytesAsync(16)).toString('hex');
  const hash = (
    await pbkdf2Async(password, salt, ITERATIONS, KEY_LEN, DIGEST)
  ).toString('hex');
  return `${PASSWORD_PREFIX}$${salt}$${hash}`;
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const parts = passwordHash.split('$');
  if (parts.length !== 3 || parts[0] !== PASSWORD_PREFIX) return false;
  const salt = parts[1]!;
  const expectedHash = parts[2]!;
  const hash = (
    await pbkdf2Async(password, salt, ITERATIONS, KEY_LEN, DIGEST)
  ).toString('hex');
  return hash === expectedHash;
}
