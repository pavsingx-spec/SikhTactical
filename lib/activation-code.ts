import { createHash, randomBytes } from 'node:crypto';

export function normaliseActivationCode(value: string) {
  return value.trim().replace(/[\s-]/g, '').toUpperCase();
}

export function hashActivationCode(value: string) {
  return createHash('sha256').update(normaliseActivationCode(value)).digest('hex');
}

export function createActivationCode() {
  const plain = randomBytes(9).toString('hex').toUpperCase();
  return `${plain.slice(0, 6)}-${plain.slice(6, 12)}-${plain.slice(12, 18)}`;
}
