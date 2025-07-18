import { ClassConstructor, plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

import { IMiddleware } from './middleware.interface';

export class ValidateMiddleware implements IMiddleware {
  constructor(private classToValidate: ClassConstructor<object>) {}

  execute(req: Request, res: Response, next: NextFunction): void {
    const instance = plainToClass(this.classToValidate, req.body);
    validate(instance).then((errors) => {
      if (errors?.length) {
        res.status(422).send(errors);
      } else {
        next();
      }
    });
  }
}
