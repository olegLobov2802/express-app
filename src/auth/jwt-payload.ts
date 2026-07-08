import { JwtPayload } from 'jsonwebtoken';

export type AccessTokenPayload = {
  sub: number;
  email: string;
};

export function parseUserIdFromJwtPayload(
  payload: JwtPayload | string | undefined,
): number | null {
  if (!payload || typeof payload === 'string' || payload.sub === undefined) {
    return null;
  }

  const userId = Number(payload.sub);

  return Number.isNaN(userId) ? null : userId;
}
