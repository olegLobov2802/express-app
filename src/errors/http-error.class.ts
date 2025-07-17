export class HttpError extends Error {
  statusCode: number;
  context?: string;

  constructor(statusCode: number, message: string, context?: string) {
    super();
    this.statusCode = statusCode;
    this.message = message;
    this.context = context;
  }
}
