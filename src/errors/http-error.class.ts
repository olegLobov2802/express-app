export class HttpError extends Error {
  statusCode: number;
  context?: string;
  code?: string;
  details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    options?: {
      context?: string;
      code?: string;
      details?: unknown;
    },
  ) {
    super(message);
    this.statusCode = statusCode;
    this.context = options?.context;
    this.code = options?.code;
    this.details = options?.details;
  }
}
