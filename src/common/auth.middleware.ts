import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import { parseUserIdFromJwtPayload } from '../auth/jwt-payload';

import { IMiddleware } from './middleware.interface';

export class AuthMiddleware implements IMiddleware {
  constructor(private secret: string) {}
  execute(req: Request, res: Response, next: NextFunction): void {
    const token = this.getToken(req);

    if (token) {
      verify(token, this.secret, (err, payload) => {
        if (!err && payload) {
          const userId = parseUserIdFromJwtPayload(payload);

          if (userId !== null) {
            req.userId = userId;
          }
        }

        next();
      });
    } else {
      next();
    }
  }

  private getToken(req: Request): string | undefined {
    const authorization = req.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      return authorization.split(' ')[1];
    }

    return undefined;
  }
}
