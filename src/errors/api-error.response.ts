import { ValidationError } from 'class-validator';

import { HttpError } from './http-error.class';

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  AUTH_ERROR: 'AUTH_ERROR',
  REGISTRATION_FAILED: 'REGISTRATION_FAILED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function formatValidationDetails(errors: ValidationError[]): Array<{
  property: string;
  constraints?: Record<string, string>;
  children?: ReturnType<typeof formatValidationDetails>;
}> {
  return errors.map((error) => ({
    property: error.property,
    constraints: error.constraints,
    children: error.children?.length
      ? formatValidationDetails(error.children)
      : undefined,
  }));
}

export function internalServerError(): ApiErrorResponse {
  return {
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    },
  };
}

function defaultCodeForStatus(statusCode: number): string {
  if (statusCode === 401) {
    return ErrorCode.UNAUTHORIZED;
  }

  if (statusCode === 422) {
    return 'UNPROCESSABLE_ENTITY';
  }

  return `HTTP_${statusCode}`;
}

export function fromHttpError(error: HttpError): ApiErrorResponse {
  return {
    error: {
      code: error.code ?? defaultCodeForStatus(error.statusCode),
      message: error.message,
      ...(error.details !== undefined && { details: error.details }),
    },
  };
}
