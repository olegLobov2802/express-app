import { TokenPair } from './token-pair';

export interface IAuthService {
  issueTokenPair(userId: number, email: string): Promise<TokenPair>;
  refresh(refreshToken: string): Promise<TokenPair>;
  revoke(refreshToken: string): Promise<void>;
  revokeAllForUser(userId: number): Promise<void>;
}
