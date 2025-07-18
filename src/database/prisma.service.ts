import { inject, injectable } from 'inversify';

import { PrismaClient } from '../../generated/prisma';
import { ILogger } from '../logger/loger.interface';
import { TYPES } from '../types';

@injectable()
export class PrismaService {
  client: PrismaClient;

  constructor(@inject(TYPES.Logger) private logger: ILogger) {
    this.client = new PrismaClient();
  }

  async connect(): Promise<void> {
    try {
      this.client.$connect();
      this.logger.log('[PrismaService]: Database connected success');
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(
          `[PrismaService]: Database connected error ${err.message}`,
        );
      }
    }
  }

  async dissconnect(): Promise<void> {
    this.client.$disconnect();
  }
}
