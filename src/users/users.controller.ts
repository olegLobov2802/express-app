import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { sign, SignOptions } from 'jsonwebtoken';

import { AuthGuard } from '../common/auth.guard';
import { BaseController } from '../common/base.controller';
import { RateLimitMiddleware } from '../common/rate-limit.middleware';
import { ValidateMiddleware } from '../common/validate.middleware';
import { IConfigService } from '../config/config.service.interface';
import { HttpError } from '../errors/http-error.class';
import { ILogger } from '../logger/loger.interface';
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
    const userInfo = await this.userService.getUserInfo(req.user);
    this.ok(res, { userInfo });
  }

  async login(
    req: Request<{}, {}, UserLoginDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const result = await this.userService.validateUser(req.body);

    if (!result) {
      return next(new HttpError(401, 'error auth'));
    }

    const secret = this.configService.get('SECRET');
    const expiresIn = this.configService.get('JWT_EXPIRES_IN') || '7d';
    const jwt = await this.signJWT(req.body.email, secret, expiresIn);
    this.ok(res, {
      login: 'success',
      jwt,
    });
  }

  async register(
    req: Request<{}, {}, UserRegisterDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const result = await this.userService.createUser(req.body);

    if (!result) {
      return next(new HttpError(422, 'Registration failed'));
    }

    this.ok(res, result);
  }

  private signJWT(
    email: string,
    secret: string,
    expiresIn: string,
  ): Promise<string> {
    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: expiresIn as SignOptions['expiresIn'],
    };

    return new Promise<string>((resolve, reject) => {
      sign(
        {
          email,
          iat: Math.floor(Date.now() / 1000),
        },
        secret,
        options,
        (err, token) => {
          if (err) {
            return reject(err);
          }

          if (!token) {
            return reject(new Error('Token generation failed'));
          }

          resolve(token);
        },
      );
    });
  }
}
