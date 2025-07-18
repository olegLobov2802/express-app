import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';

import { ILogger } from '../logger/loger.interface';
import { TYPES } from '../types';

import { IExceptionFilter } from './exception.filter.interface';
import { HttpError } from './http-error.class';

@injectable()
export class ExceptionFilter implements IExceptionFilter {
  constructor(@inject(TYPES.Logger) private logger: ILogger) {}

  catch(
    error: Error | HttpError,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    if (error instanceof HttpError) {
      this.logger.error(
        `[${error?.context || ''}]: Error ${error.statusCode} ${error.message}`,
      );
      res.status(error.statusCode).send({ error: error.message });
    } else {
      this.logger.error(`[${error.message}]`);
      res.status(500).send({ error: error.message });
    }
  }
}
