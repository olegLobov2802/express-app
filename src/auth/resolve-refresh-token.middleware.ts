import { NextFunction, Request, Response } from 'express';

import { IMiddleware } from '../common/middleware.interface';

import { AUTH_REFRESH_TOKEN_COOKIE } from './auth-token-delivery';

export const AUTH_REFRESH_TOKEN_HEADER = 'x-refresh-token';

export class ResolveRefreshTokenMiddleware implements IMiddleware {
  execute(req: Request, res: Response, next: NextFunction): void {
    const body = (req.body ?? {}) as Record<string, unknown>;

    if (typeof body.refreshToken === 'string' && body.refreshToken.length > 0) {
      next();

      return;
    }

    const headerToken = req.headers[AUTH_REFRESH_TOKEN_HEADER];
    const fromHeader =
      typeof headerToken === 'string' ? headerToken : undefined;

    const cookies = req.cookies as Record<string, unknown> | undefined;
    const cookieToken = cookies?.[AUTH_REFRESH_TOKEN_COOKIE];
    const fromCookie =
      typeof cookieToken === 'string' ? cookieToken : undefined;

    const refreshToken = fromHeader || fromCookie;

    if (refreshToken) {
      req.body = {
        ...body,
        refreshToken,
      };
    }

    next();
  }
}
