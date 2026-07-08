import { createHash, randomBytes } from 'crypto';

export type ParsedRefreshToken = {
  id: string;
  secret: string;
};

export function hashRefreshTokenSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function generateRefreshTokenSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function buildRefreshToken(id: string, secret: string): string {
  return `${id}.${secret}`;
}

export function parseRefreshToken(token: string): ParsedRefreshToken | null {
  const separatorIndex = token.indexOf('.');

  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return null;
  }

  const id = token.slice(0, separatorIndex);
  const secret = token.slice(separatorIndex + 1);

  if (!id || !secret) {
    return null;
  }

  return { id, secret };
}
