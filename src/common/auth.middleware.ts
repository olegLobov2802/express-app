import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import { parseUserIdFromJwtPayload } from '../auth/jwt-payload';

import { IMiddleware } from './middleware.interface';

export class AuthMiddleware implements IMiddleware {
  constructor(private secret: string) {}
  execute(req: Request, res: Response, next: NextFunction): void {
    if (req?.headers?.authorization) {
      verify(
        req.headers.authorization.split(' ')?.[1],
        this.secret,
        (err, payload) => {
          if (!err && payload) {
            const userId = parseUserIdFromJwtPayload(payload);

            if (userId !== null) {
              req.userId = userId;
            }
          }

          next();
        },
      );
    } else {
      next();
    }
  }
}
