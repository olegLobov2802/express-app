import { inject, injectable } from 'inversify';

import { PrismaService } from '../database/prisma.service';
import { TYPES } from '../types';

import {
  CreateRefreshTokenData,
  RefreshTokenRecord,
  toRefreshTokenRecord,
} from './refresh-token.mapper';
import { IRefreshTokenRepository } from './refresh-token.repository.interface';

type RefreshTokenRow = RefreshTokenRecord & {
  createdAt: Date;
};

type RefreshTokenDb = {
  create(args: { data: CreateRefreshTokenData }): Promise<RefreshTokenRow>;
  findUnique(args: { where: { id: string } }): Promise<RefreshTokenRow | null>;
  update(args: {
    where: { id: string };
    data: { revokedAt: Date; replacedBy?: string };
  }): Promise<RefreshTokenRow>;
  updateMany(args: {
    where: { userId: number; revokedAt: null };
    data: { revokedAt: Date };
  }): Promise<{ count: number }>;
};

@injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @inject(TYPES.PrismaService) private prismaService: PrismaService,
  ) {}

  async create(data: CreateRefreshTokenData): Promise<void> {
    await this.refreshTokenDb.create({ data });
  }

  async findById(id: string): Promise<RefreshTokenRecord | null> {
    const record = await this.refreshTokenDb.findUnique({
      where: { id },
    });

    return record ? toRefreshTokenRecord(record) : null;
  }

  async revoke(id: string, replacedBy?: string): Promise<void> {
    await this.refreshTokenDb.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        ...(replacedBy !== undefined && { replacedBy }),
      },
    });
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.refreshTokenDb.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private get refreshTokenDb(): RefreshTokenDb {
    return (
      this.prismaService.client as unknown as { refreshToken: RefreshTokenDb }
    ).refreshToken;
  }
}
