import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';

import { BaseController } from '../common/base.controller';
import { RateLimitMiddleware } from '../common/rate-limit.middleware';
import { ValidateMiddleware } from '../common/validate.middleware';
import { IConfigService } from '../config/config.service.interface';
import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types';

import { clearRefreshTokenCookie, sendAuthTokens } from './auth-token-delivery';
import { IAuthController } from './auth.controller.interface';
import { IAuthService } from './auth.service.interface';
import { RefreshDto } from './dto/refresh.dto';
import { ResolveRefreshTokenMiddleware } from './resolve-refresh-token.middleware';

@injectable()
export class AuthController extends BaseController implements IAuthController {
  constructor(
    @inject(TYPES.Logger) private loggerService: ILogger,
    @inject(TYPES.AuthService) private authService: IAuthService,
    @inject(TYPES.ConfigService) private configService: IConfigService,
  ) {
    super(loggerService);

    const authRateLimit = new RateLimitMiddleware({
      windowMs:
        Number(this.configService.get('RATE_LIMIT_WINDOW_MS')) ||
        15 * 60 * 1000,
      limit: Number(this.configService.get('RATE_LIMIT_MAX')) || 10,
    });

    this.bindRoutes([
      {
        path: '/refresh',
        cb: this.refresh,
        method: 'post',
        middlewares: [
          authRateLimit,
          new ResolveRefreshTokenMiddleware(),
          new ValidateMiddleware(RefreshDto),
        ],
      },
      {
        path: '/logout',
        cb: this.logout,
        method: 'post',
        middlewares: [
          authRateLimit,
          new ResolveRefreshTokenMiddleware(),
          new ValidateMiddleware(RefreshDto),
        ],
      },
    ]);
  }

  async refresh(
    req: Request<{}, {}, RefreshDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tokenPair = await this.authService.refresh(req.body.refreshToken);
      this.ok(res, sendAuthTokens(res, tokenPair, this.configService));
    } catch (error) {
      next(error);
    }
  }

  async logout(
    req: Request<{}, {}, RefreshDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await this.authService.revoke(req.body.refreshToken);
      clearRefreshTokenCookie(res, this.configService);
      this.ok(res, { logout: 'success' });
    } catch (error) {
      next(error);
    }
  }
}
