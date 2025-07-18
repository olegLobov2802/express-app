import {
  Container,
  ContainerModule,
  ContainerModuleLoadOptions,
} from 'inversify';

import { App } from './app';
import { ConfigService } from './config/config.service';
import { IConfigService } from './config/config.service.interface';
import { ExeptionFilter } from './errors/exeption.filter';
import { IExeptionFilter } from './errors/exeption.filter.interface';
import { ILogger } from './logger/loger.interface';
import { LoggerService } from './logger/logger.service';
import { TYPES } from './types';
import { IUserController } from './users/user.controller.interface';
import { UserService } from './users/user.service';
import { IUserService } from './users/user.service.interface';
import { UserController } from './users/users.controller';
import { PrismaService } from './database/prisma.service';

export interface IBootstrapReturn {
  app: App;
  appContainer: Container;
}

const appBindings = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<ILogger>(TYPES.Logger).to(LoggerService).inSingletonScope();
    options
      .bind<IExeptionFilter>(TYPES.ExeptionFilter)
      .to(ExeptionFilter)
      .inSingletonScope();
    options
      .bind<IUserController>(TYPES.UserController)
      .to(UserController)
      .inSingletonScope();
    options
      .bind<IUserService>(TYPES.UserService)
      .to(UserService)
      .inSingletonScope();
    options
      .bind<IConfigService>(TYPES.ConfigService)
      .to(ConfigService)
      .inSingletonScope();
    options
      .bind<PrismaService>(TYPES.PrismaService)
      .to(PrismaService)
      .inSingletonScope();
    options.bind<App>(TYPES.Application).to(App);
  },
);
function bootstrap(): IBootstrapReturn {
  const appContainer = new Container();
  appContainer.load(appBindings);
  const app = appContainer.get<App>(TYPES.Application);
  app.init();
  return { app, appContainer };
}

export const { app, appContainer } = bootstrap();
