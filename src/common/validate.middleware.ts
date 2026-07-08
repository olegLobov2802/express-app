import { ClassConstructor, plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

import {
  ErrorCode,
  formatValidationDetails,
} from '../errors/api-error.response';
import { HttpError } from '../errors/http-error.class';

import { IMiddleware } from './middleware.interface';

export class ValidateMiddleware implements IMiddleware {
  constructor(private classToValidate: ClassConstructor<object>) {}

  execute(req: Request, res: Response, next: NextFunction): void {
    const instance = plainToClass(this.classToValidate, req.body);
    validate(instance).then((errors) => {
      if (errors?.length) {
        return next(
          new HttpError(422, 'Validation failed', {
            code: ErrorCode.VALIDATION_ERROR,
            details: formatValidationDetails(errors),
          }),
        );
      }

      next();
    });
  }
}
