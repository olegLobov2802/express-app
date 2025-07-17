import { injectable } from 'inversify';
import { Logger } from 'tslog';

import { ILogger } from './loger.interface';

@injectable()
export class LoggerService implements ILogger {
  logger: Logger<unknown>;

  constructor() {
    this.logger = new Logger();
  }

  log(...args: unknown[]): void {
    this.logger.info(...args);
  }

  error(...args: unknown[]): void {
    this.logger.error(...args);
  }

  warn(...args: unknown[]): void {
    this.logger.warn(...args);
  }
}
