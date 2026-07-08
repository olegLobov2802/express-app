import { Server } from 'http';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { inject, injectable } from 'inversify';

import { IAuthController } from './auth/auth.controller.interface';
import { AuthMiddleware } from './common/auth.middleware';
import { IConfigService } from './config/config.service.interface';
import { PrismaService } from './database/prisma.service';
import { IExceptionFilter } from './errors/exception.filter.interface';
import { ILogger } from './logger/logger.interface';
import { TYPES } from './types';
import { IUserController } from './users/users.controller.interface';

@injectable()
export class App {
  app: express.Express;
  server: Server;
  port: number;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.UserController) private userController: IUserController,
    @inject(TYPES.AuthController) private authController: IAuthController,
    @inject(TYPES.ExceptionFilter) private exceptionFilter: IExceptionFilter,
    @inject(TYPES.ConfigService) private configService: IConfigService,
    @inject(TYPES.PrismaService) private prismaService: PrismaService,
  ) {
    this.app = express();
    this.port = 8000;
  }

  useMiddleware(): void {
    this.app.use(helmet());
    this.useCors();
    this.app.use(express.json());
    const authMiddleware = new AuthMiddleware(
      this.configService.get('JWT_SECRET'),
    );
    this.app.use(authMiddleware.execute.bind(authMiddleware));
  }

  private useCors(): void {
    const corsOrigin = this.configService.get('CORS_ORIGIN');

    if (!corsOrigin) {
      return;
    }

    const origins = corsOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    this.app.use(
      cors({
        origin: origins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }),
    );
  }

  useRoutes(): void {
    this.app.use('/users', this.userController.router);
    this.app.use('/users', this.authController.router);
  }

  useExceptionFilters(): void {
    this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
  }

  public async init(): Promise<void> {
    this.useMiddleware();
    this.useRoutes();
    this.useExceptionFilters();
    await this.prismaService.connect();
    this.server = this.app.listen(this.port);
    this.logger.log(`Server Run to http://localhost:${this.port}`);
  }

  public close(): void {
    this.server.close();
  }
}
