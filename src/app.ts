import { Server } from 'http';

import express from 'express';
import { inject, injectable } from 'inversify';

import { IExeptionFilter } from './errors/exeption.filter.interface';
import { ILogger } from './logger/loger.interface';
import { TYPES } from './types';
import { IUserController } from './users/user.controller.interface';

@injectable()
export class App {
  app: express.Express;
  server: Server;
  port: number;

  constructor(
    @inject(TYPES.ILogger) private logger: ILogger,
    @inject(TYPES.IUserController) private userController: IUserController,
    @inject(TYPES.IExeptionFilter) private exeptionFilter: IExeptionFilter,
  ) {
    this.app = express();
    this.port = 8000;
  }

  useMiddleware(): void {
    this.app.use(express.json());
  }

  useRoutes(): void {
    this.app.use('/users', this.userController.router);
  }

  useExeptionFilters(): void {
    this.app.use(this.exeptionFilter.catch.bind(this.exeptionFilter));
  }

  public async init(): Promise<void> {
    this.useMiddleware();
    this.useRoutes();
    this.useExeptionFilters();
    this.server = this.app.listen(this.port);
    this.logger.log(`Server Run to http://localhost:${this.port}`);
  }
}
