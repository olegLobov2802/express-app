import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Options, rateLimit } from 'express-rate-limit';

import { IMiddleware } from './middleware.interface';

export class RateLimitMiddleware implements IMiddleware {
  private readonly limiter: RequestHandler;

  constructor(options: Partial<Options> = {}) {
    this.limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later' },
      ...options,
    });
  }

  execute(req: Request, res: Response, next: NextFunction): void {
    this.limiter(req, res, next);
  }
}
