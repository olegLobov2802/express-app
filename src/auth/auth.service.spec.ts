import { Container } from 'inversify';

import { UserModel } from '../../generated/prisma';
import { IConfigService } from '../config/config.service.interface';
import { HttpError } from '../errors/http-error.class';
import { TYPES } from '../types';
import { IUsersRepository } from '../users/users.repository.interface';

import { AuthService } from './auth.service';
import { IAuthService } from './auth.service.interface';
import { IJwtService } from './jwt.service.interface';
import {
  buildRefreshToken,
  hashRefreshTokenSecret,
  parseRefreshToken,
} from './refresh-token';
import { RefreshTokenRecord } from './refresh-token.mapper';
import { IRefreshTokenRepository } from './refresh-token.repository.interface';

const ConfigServiceMock: IConfigService = {
  get: jest.fn(),
};

const JwtServiceMock: IJwtService = {
  signAccessToken: jest.fn(),
};

const RefreshTokenRepositoryMock: IRefreshTokenRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  revoke: jest.fn(),
  revokeAllForUser: jest.fn(),
};

const UsersRepositoryMock: IUsersRepository = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const container = new Container();

let configService: IConfigService;
let jwtService: IJwtService;
let refreshTokenRepository: IRefreshTokenRepository;
let usersRepository: IUsersRepository;
let authService: IAuthService;

const testUser: UserModel = {
  id: 1,
  email: 'user@mail.com',
  name: 'User',
  password: 'hash',
};

function createRefreshTokenRecord(
  overrides: Partial<RefreshTokenRecord> = {},
): RefreshTokenRecord {
  return {
    id: 'token-id-1',
    userId: 1,
    tokenHash: hashRefreshTokenSecret('secret-part'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    replacedBy: null,
    ...overrides,
  };
}

beforeAll(() => {
  container.bind<IAuthService>(TYPES.AuthService).to(AuthService);
  container
    .bind<IConfigService>(TYPES.ConfigService)
    .toConstantValue(ConfigServiceMock);
  container.bind<IJwtService>(TYPES.JwtService).toConstantValue(JwtServiceMock);
  container
    .bind<IRefreshTokenRepository>(TYPES.RefreshTokenRepository)
    .toConstantValue(RefreshTokenRepositoryMock);
  container
    .bind<IUsersRepository>(TYPES.UsersRepository)
    .toConstantValue(UsersRepositoryMock);

  configService = container.get<IConfigService>(TYPES.ConfigService);
  jwtService = container.get<IJwtService>(TYPES.JwtService);
  refreshTokenRepository = container.get<IRefreshTokenRepository>(
    TYPES.RefreshTokenRepository,
  );
  usersRepository = container.get<IUsersRepository>(TYPES.UsersRepository);
  authService = container.get<IAuthService>(TYPES.AuthService);
});

beforeEach(() => {
  jest.clearAllMocks();
  configService.get = jest.fn((key: string) => {
    if (key === 'JWT_REFRESH_EXPIRES_IN') {
      return '7d';
    }

    return undefined;
  });
  jwtService.signAccessToken = jest.fn().mockResolvedValue({
    token: 'access-token',
    expiresIn: 3600,
  });
});

describe('AuthService', () => {
  it('issueTokenPair returns access and refresh tokens', async () => {
    refreshTokenRepository.create = jest.fn().mockResolvedValue(undefined);

    const result = await authService.issueTokenPair(1, 'user@mail.com');

    expect(result.accessToken).toBe('access-token');
    expect(result.expiresIn).toBe(3600);
    expect(result.refreshToken).toContain('.');
    expect(refreshTokenRepository.create).toHaveBeenCalledTimes(1);
    expect(jwtService.signAccessToken).toHaveBeenCalledWith({
      sub: 1,
      email: 'user@mail.com',
    });
  });

  it('refresh rotates tokens', async () => {
    const oldRecord = createRefreshTokenRecord();
    const refreshToken = buildRefreshToken(oldRecord.id, 'secret-part');

    refreshTokenRepository.findById = jest
      .fn()
      .mockResolvedValueOnce(oldRecord);
    usersRepository.findById = jest.fn().mockResolvedValueOnce(testUser);
    refreshTokenRepository.create = jest.fn().mockResolvedValue(undefined);
    refreshTokenRepository.revoke = jest.fn().mockResolvedValue(undefined);
    jwtService.signAccessToken = jest.fn().mockResolvedValue({
      token: 'new-access-token',
      expiresIn: 3600,
    });

    const result = await authService.refresh(refreshToken);

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith(
      oldRecord.id,
      expect.any(String),
    );
  });

  it('refresh rejects reused token and revokes all user sessions', async () => {
    const revokedRecord = createRefreshTokenRecord({
      revokedAt: new Date(),
    });
    const refreshToken = buildRefreshToken(revokedRecord.id, 'secret-part');

    refreshTokenRepository.findById = jest
      .fn()
      .mockResolvedValueOnce(revokedRecord);
    refreshTokenRepository.revokeAllForUser = jest
      .fn()
      .mockResolvedValue(undefined);

    await expect(authService.refresh(refreshToken)).rejects.toBeInstanceOf(
      HttpError,
    );
    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(1);
  });

  it('refresh rejects invalid token format', async () => {
    await expect(authService.refresh('invalid-token')).rejects.toBeInstanceOf(
      HttpError,
    );
  });

  it('revoke invalidates active refresh token', async () => {
    const record = createRefreshTokenRecord();
    const refreshToken = buildRefreshToken(record.id, 'secret-part');

    refreshTokenRepository.findById = jest.fn().mockResolvedValueOnce(record);
    refreshTokenRepository.revoke = jest.fn().mockResolvedValue(undefined);

    await authService.revoke(refreshToken);

    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith(record.id);
  });

  it('revoke ignores unknown token', async () => {
    refreshTokenRepository.findById = jest.fn().mockResolvedValueOnce(null);

    const parsed = parseRefreshToken('missing-id.secret');
    expect(parsed).not.toBeNull();

    await authService.revoke('missing-id.secret');

    expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
  });
});
