import { CookieOptions, Response } from 'express';

import { IConfigService } from '../config/config.service.interface';

import { parseDurationToSeconds } from './duration';
import { TokenPair } from './token-pair';

export const AUTH_REFRESH_TOKEN_COOKIE = 'refreshToken';

export type AccessTokenResponse = {
  accessToken: string;
  expiresIn: number;
};

export function sendAuthTokens(
  res: Response,
  tokenPair: TokenPair,
  configService: IConfigService,
): AccessTokenResponse {
  setRefreshTokenCookie(res, tokenPair.refreshToken, configService);

  return {
    accessToken: tokenPair.accessToken,
    expiresIn: tokenPair.expiresIn,
  };
}

export function clearRefreshTokenCookie(
  res: Response,
  configService: IConfigService,
): void {
  res.clearCookie(
    AUTH_REFRESH_TOKEN_COOKIE,
    createBaseCookieOptions(configService),
  );
}

function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  configService: IConfigService,
): void {
  res.cookie(AUTH_REFRESH_TOKEN_COOKIE, refreshToken, {
    ...createBaseCookieOptions(configService),
    maxAge: getRefreshTokenMaxAgeSeconds(configService) * 1000,
  });
}

function createBaseCookieOptions(configService: IConfigService): CookieOptions {
  return {
    httpOnly: true,
    path: '/auth',
    sameSite: 'strict',
    secure: shouldUseSecureCookies(configService),
  };
}

function shouldUseSecureCookies(configService: IConfigService): boolean {
  const explicitValue = configService.get('AUTH_COOKIE_SECURE');

  if (explicitValue) {
    return explicitValue === 'true';
  }

  return configService.get('NODE_ENV') === 'production';
}

function getRefreshTokenMaxAgeSeconds(configService: IConfigService): number {
  const refreshExpiresIn =
    configService.get('JWT_REFRESH_EXPIRES_IN') ||
    configService.get('JWT_EXPIRES_IN') ||
    '7d';

  return parseDurationToSeconds(refreshExpiresIn);
}
