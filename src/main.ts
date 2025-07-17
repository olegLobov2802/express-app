import {
  Container,
  ContainerModule,
  ContainerModuleLoadOptions,
} from 'inversify';

import { App } from './app';
import { ExeptionFilter } from './errors/exeption.filter';
import { IExeptionFilter } from './errors/exeption.filter.interface';
import { ILogger } from './logger/loger.interface';
import { LoggerService } from './logger/logger.service';
import { TYPES } from './types';
import { IUserController } from './users/user.controller.interface';
import { UserController } from './users/users.controller';

export interface IBootstrapReturn {
  app: App;
  appContainer: Container;
}

const appBindings = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<ILogger>(TYPES.ILogger).to(LoggerService);
    options.bind<IExeptionFilter>(TYPES.IExeptionFilter).to(ExeptionFilter);
    options.bind<IUserController>(TYPES.IUserController).to(UserController);
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
