import { AccessTokenPayload } from './jwt-payload';
import { TokenPair } from './token-pair';

export interface IJwtService {
  signAccessToken(payload: AccessTokenPayload): Promise<{
    token: string;
    expiresIn: number;
  }>;
}

export type { TokenPair };
