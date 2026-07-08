import {
  CreateRefreshTokenData,
  RefreshTokenRecord,
} from './refresh-token.mapper';

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<void>;
  findById(id: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string, replacedBy?: string): Promise<void>;
  revokeAllForUser(userId: number): Promise<void>;
}
