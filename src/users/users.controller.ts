import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';

import { sendAuthTokens } from '../auth/auth-token-delivery';
import { IAuthService } from '../auth/auth.service.interface';
import { AuthGuard } from '../common/auth.guard';
import { BaseController } from '../common/base.controller';
import { RateLimitMiddleware } from '../common/rate-limit.middleware';
import { ValidateMiddleware } from '../common/validate.middleware';
import { IConfigService } from '../config/config.service.interface';
import { ErrorCode } from '../errors/api-error.response';
import { HttpError } from '../errors/http-error.class';
import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types';

import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { IUserController } from './users.controller.interface';
import { IUserService } from './users.service.interface';

@injectable()
export class UserController extends BaseController implements IUserController {
  constructor(
    @inject(TYPES.Logger) private loggerService: ILogger,
    @inject(TYPES.UserService) private userService: IUserService,
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
        path: '/login',
        cb: this.login,
        method: 'post',
        middlewares: [authRateLimit, new ValidateMiddleware(UserLoginDto)],
      },
      {
        path: '/register',
        cb: this.register,
        method: 'post',
        middlewares: [authRateLimit, new ValidateMiddleware(UserRegisterDto)],
      },
      {
        path: '/info',
        cb: this.info,
        method: 'get',
        middlewares: [new AuthGuard()],
      },
    ]);
  }

  async info(req: Request, res: Response): Promise<void> {
    const { userId } = req;

    if (userId === undefined) {
      return;
    }

    const userInfo = await this.userService.getUserInfo(userId);
    this.ok(res, { userInfo });
  }

  async login(
    req: Request<{}, {}, UserLoginDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const user = await this.userService.validateUser(req.body);

    if (!user) {
      return next(
        new HttpError(401, 'error auth', { code: ErrorCode.AUTH_ERROR }),
      );
    }

    const tokenPair = await this.authService.issueTokenPair(
      user.id,
      user.email,
    );
    this.ok(res, sendAuthTokens(res, tokenPair, this.configService));
  }

  async register(
    req: Request<{}, {}, UserRegisterDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const result = await this.userService.createUser(req.body);

    if (!result) {
      return next(
        new HttpError(422, 'Registration failed', {
          code: ErrorCode.REGISTRATION_FAILED,
        }),
      );
    }

    this.ok(res, result);
  }
}
