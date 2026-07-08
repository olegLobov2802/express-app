import { ValidationError } from 'class-validator';

import {
  ErrorCode,
  formatValidationDetails,
  fromHttpError,
  internalServerError,
} from './api-error.response';
import { HttpError } from './http-error.class';

describe('api-error.response', () => {
  it('internalServerError hides internal details', () => {
    expect(internalServerError()).toEqual({
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
    });
  });

  it('fromHttpError uses explicit code and details', () => {
    const error = new HttpError(422, 'Registration failed', {
      code: ErrorCode.REGISTRATION_FAILED,
    });

    expect(fromHttpError(error)).toEqual({
      error: {
        code: ErrorCode.REGISTRATION_FAILED,
        message: 'Registration failed',
      },
    });
  });

  it('formatValidationDetails maps nested children', () => {
    const child = Object.assign(new ValidationError(), {
      property: 'email',
      constraints: { isEmail: 'email must be valid' },
    });
    const parent = Object.assign(new ValidationError(), {
      property: 'user',
      children: [child],
    });

    expect(formatValidationDetails([parent])).toEqual([
      {
        property: 'user',
        constraints: undefined,
        children: [
          {
            property: 'email',
            constraints: { isEmail: 'email must be valid' },
            children: undefined,
          },
        ],
      },
    ]);
  });
});
