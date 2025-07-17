import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';

import { BaseController } from '../common/base.controller';
import { HttpError } from '../errors/http-error.class';
import { ILogger } from '../logger/loger.interface';
import { TYPES } from '../types';

import { IUserController } from './user.controller.interface';

@injectable()
export class UserController extends BaseController implements IUserController {
  constructor(@inject(TYPES.ILogger) private loggerService: ILogger) {
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
      },
    ]);
  }

  login(req: Request, res: Response, next: NextFunction): void {
    // this.ok(res, 'login');
    next(new HttpError(401, 'error auth'));
  }

  register(req: Request, res: Response): void {
    this.ok(res, 'register');
  }
}
