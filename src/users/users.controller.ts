import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { sign } from 'jsonwebtoken';

import { BaseController } from '../common/base.controller';
import { ValidateMiddleware } from '../common/validate.middleware';
import { IConfigService } from '../config/config.service.interface';
import { HttpError } from '../errors/http-error.class';
import { ILogger } from '../logger/loger.interface';
import { TYPES } from '../types';

import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { IUserController } from './user.controller.interface';
import { IUserService } from './user.service.interface';

@injectable()
export class UserController extends BaseController implements IUserController {
  constructor(
    @inject(TYPES.Logger) private loggerService: ILogger,
    @inject(TYPES.UserService) private userService: IUserService,
    @inject(TYPES.ConfigService) private configService: IConfigService,
  ) {
    super(loggerService);

    this.bindRoutes([
      {
        path: '/login',
        cb: this.login,
        method: 'post',
        middlewares: [new ValidateMiddleware(UserLoginDto)],
      },
      {
        path: '/register',
        cb: this.register,
        method: 'post',
        middlewares: [new ValidateMiddleware(UserRegisterDto)],
      },
      {
        path: '/info',
        cb: this.info,
        method: 'get',
        middlewares: [],
      },
    ]);
  }

  info(req: Request, res: Response): void {
    this.ok(res, { email: req.user });
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
    const jwt = await this.signJWT(req.body.email, secret);
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
      return next(new HttpError(422, 'User already exists'));
    }

    this.ok(res, result);
  }

  private signJWT(email: string, secret: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      sign(
        {
          email,
          iat: Math.floor(Date.now() / 1000),
        },
        secret,
        {
          algorithm: 'HS256',
        },
        (err, token) => {
          if (err) {
            reject(err);
          }
          resolve(token);
        },
      );
    });
  }
}
