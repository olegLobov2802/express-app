import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';

import { BaseController } from '../common/base.controller';
import { ValidateMiddleware } from '../common/validate.middleware';
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
    @inject(TYPES.ILogger) private loggerService: ILogger,
    @inject(TYPES.IUserService) private userService: IUserService,
  ) {
    super(loggerService);

    this.bindRoutes([
      {
        path: '/login',
        cb: this.login,
        method: 'get',
      },
      {
        path: '/register',
        cb: this.register,
        method: 'post',
        middlewares: [new ValidateMiddleware(UserRegisterDto)],
      },
    ]);
  }

  login(
    req: Request<{}, {}, UserLoginDto>,
    res: Response,
    next: NextFunction,
  ): void {
    // this.ok(res, 'login');
    next(new HttpError(401, 'error auth'));
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

    this.ok(res, { email: result.email });
  }
}
