export type RefreshTokenRecord = {
  id: string;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
};

export type CreateRefreshTokenData = Pick<
  RefreshTokenRecord,
  'id' | 'userId' | 'tokenHash' | 'expiresAt'
>;

type RefreshTokenSource = RefreshTokenRecord & {
  createdAt?: Date;
};

export function toRefreshTokenRecord(
  token: RefreshTokenSource,
): RefreshTokenRecord {
  const { id, userId, tokenHash, expiresAt, revokedAt, replacedBy } = token;

  return {
    id,
    userId,
    tokenHash,
    expiresAt,
    revokedAt,
    replacedBy,
  };
}
