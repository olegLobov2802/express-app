import { NextFunction, Request, Response } from 'express';

import { ErrorCode } from '../errors/api-error.response';
import { HttpError } from '../errors/http-error.class';

import { IMiddleware } from './middleware.interface';

export class AuthGuard implements IMiddleware {
  execute(req: Request, res: Response, next: NextFunction): void {
    if (req.userId) {
      return next();
    }

    next(
      new HttpError(401, 'The user is not authorized', {
        code: ErrorCode.UNAUTHORIZED,
      }),
    );
  }
}
