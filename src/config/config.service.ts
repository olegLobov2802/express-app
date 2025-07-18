import { config, DotenvConfigOutput, DotenvParseOutput } from 'dotenv';
import { inject, injectable } from 'inversify';

import { ILogger } from '../logger/loger.interface';
import { TYPES } from '../types';

import { IConfigService } from './config.service.interface';

@injectable()
export class ConfigService implements IConfigService {
  private config: DotenvParseOutput;

  constructor(@inject(TYPES.Logger) private loggerService: ILogger) {
    const result: DotenvConfigOutput = config();

    if (result?.error) {
      this.loggerService.error('[ConfigService]: failed to read the .env file');
    } else {
      this.loggerService.log('[ConfigService]: Configuration .env loaded');
      this.config = result.parsed;
    }
  }

  get(key: string): string {
    return this.config[key];
  }
}
