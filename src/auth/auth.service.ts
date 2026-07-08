import { randomUUID } from 'crypto';

import { inject, injectable } from 'inversify';

import { IConfigService } from '../config/config.service.interface';
import { ErrorCode } from '../errors/api-error.response';
import { HttpError } from '../errors/http-error.class';
import { TYPES } from '../types';
import { IUsersRepository } from '../users/users.repository.interface';

import { IAuthService } from './auth.service.interface';
import { addDurationToDate } from './duration';
import { IJwtService } from './jwt.service.interface';
import {
  buildRefreshToken,
  generateRefreshTokenSecret,
  hashRefreshTokenSecret,
  parseRefreshToken,
  ParsedRefreshToken,
} from './refresh-token';
import { RefreshTokenRecord } from './refresh-token.mapper';
import { IRefreshTokenRepository } from './refresh-token.repository.interface';
import { TokenPair } from './token-pair';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.ConfigService) private configService: IConfigService,
    @inject(TYPES.JwtService) private jwtService: IJwtService,
    @inject(TYPES.RefreshTokenRepository)
    private refreshTokenRepository: IRefreshTokenRepository,
    @inject(TYPES.UsersRepository) private usersRepository: IUsersRepository,
  ) {}

  async issueTokenPair(userId: number, email: string): Promise<TokenPair> {
    const { token: accessToken, expiresIn } =
      await this.jwtService.signAccessToken({ sub: userId, email });
    const refreshToken = await this.createRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const { record } = await this.loadActiveRefreshToken(refreshToken);

    const user = await this.usersRepository.findById(record.userId);

    if (!user) {
      this.unauthorized();
    }

    const newRefresh = await this.createRefreshTokenRecord(record.userId);
    await this.refreshTokenRepository.revoke(record.id, newRefresh.id);

    const { token: accessToken, expiresIn } =
      await this.jwtService.signAccessToken({
        sub: user.id,
        email: user.email,
      });

    return {
      accessToken,
      refreshToken: newRefresh.token,
      expiresIn,
    };
  }

  async revoke(refreshToken: string): Promise<void> {
    const parsed = parseRefreshToken(refreshToken);

    if (!parsed) {
      return;
    }

    const record = await this.refreshTokenRepository.findById(parsed.id);

    if (!record || record.revokedAt) {
      return;
    }

    if (!this.isTokenSecretValid(parsed, record)) {
      return;
    }

    await this.refreshTokenRepository.revoke(record.id);
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(userId);
  }

  private async loadActiveRefreshToken(
    refreshToken: string,
  ): Promise<{ parsed: ParsedRefreshToken; record: RefreshTokenRecord }> {
    const parsed = parseRefreshToken(refreshToken);

    if (!parsed) {
      this.unauthorized();
    }

    const record = await this.refreshTokenRepository.findById(parsed.id);

    if (!record) {
      this.unauthorized();
    }

    if (record.revokedAt) {
      await this.refreshTokenRepository.revokeAllForUser(record.userId);
      this.unauthorized();
    }

    if (record.expiresAt <= new Date()) {
      this.unauthorized('Refresh token expired');
    }

    if (!this.isTokenSecretValid(parsed, record)) {
      this.unauthorized();
    }

    return { parsed, record };
  }

  private isTokenSecretValid(
    parsed: ParsedRefreshToken,
    record: RefreshTokenRecord,
  ): boolean {
    return hashRefreshTokenSecret(parsed.secret) === record.tokenHash;
  }

  private unauthorized(message = 'Invalid refresh token'): never {
    throw new HttpError(401, message, {
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  private async createRefreshToken(userId: number): Promise<string> {
    const record = await this.createRefreshTokenRecord(userId);
    return record.token;
  }

  private async createRefreshTokenRecord(
    userId: number,
  ): Promise<{ id: string; token: string }> {
    const id = randomUUID();
    const secret = generateRefreshTokenSecret();
    const tokenHash = hashRefreshTokenSecret(secret);
    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = addDurationToDate(expiresIn);

    await this.refreshTokenRepository.create({
      id,
      userId,
      tokenHash,
      expiresAt,
    });

    return {
      id,
      token: buildRefreshToken(id, secret),
    };
  }
}
