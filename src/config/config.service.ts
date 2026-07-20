import { config, DotenvConfigOutput, DotenvParseOutput } from 'dotenv';
import { inject, injectable } from 'inversify';

import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types';

import { IConfigService } from './config.service.interface';
import { validateConfig } from './config.validator';

@injectable()
export class ConfigService implements IConfigService {
  private config: DotenvParseOutput;

  constructor(@inject(TYPES.Logger) private loggerService: ILogger) {
    const result: DotenvConfigOutput = config();

    if (
      result.error &&
      (result.error as NodeJS.ErrnoException).code !== 'ENOENT'
    ) {
      this.loggerService.error('[ConfigService]: failed to read the .env file');
      throw new Error('[ConfigService]: failed to read the .env file');
    }

    this.config = {
      ...(result.parsed ?? {}),
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          (entry): entry is [string, string] => entry[1] !== undefined,
        ),
      ),
    };
    validateConfig(this.config);
    this.loggerService.log('[ConfigService]: Configuration loaded');
  }

  get(key: string): string {
    return this.config[key];
  }
}
