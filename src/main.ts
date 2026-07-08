import {
  Container,
  ContainerModule,
  ContainerModuleLoadOptions,
} from 'inversify';

import { App } from './app';
import { AuthController } from './auth/auth.controller';
import { IAuthController } from './auth/auth.controller.interface';
import { AuthService } from './auth/auth.service';
import { IAuthService } from './auth/auth.service.interface';
import { JwtService } from './auth/jwt.service';
import { IJwtService } from './auth/jwt.service.interface';
import { RefreshTokenRepository } from './auth/refresh-token.repository';
import { IRefreshTokenRepository } from './auth/refresh-token.repository.interface';
import { ConfigService } from './config/config.service';
import { IConfigService } from './config/config.service.interface';
import { PrismaService } from './database/prisma.service';
import { ExceptionFilter } from './errors/exception.filter';
import { IExceptionFilter } from './errors/exception.filter.interface';
import { ILogger } from './logger/logger.interface';
import { LoggerService } from './logger/logger.service';
import { TYPES } from './types';
import { UserController } from './users/users.controller';
import { IUserController } from './users/users.controller.interface';
import { UsersRepository } from './users/users.repository';
import { IUsersRepository } from './users/users.repository.interface';
import { UsersService } from './users/users.service';
import { IUserService } from './users/users.service.interface';

export interface IBootstrapReturn {
  app: App;
  appContainer: Container;
}

const appBindings = new ContainerModule(
  (options: ContainerModuleLoadOptions) => {
    options.bind<ILogger>(TYPES.Logger).to(LoggerService).inSingletonScope();
    options
      .bind<IExceptionFilter>(TYPES.ExceptionFilter)
      .to(ExceptionFilter)
      .inSingletonScope();
    options
      .bind<IUserController>(TYPES.UserController)
      .to(UserController)
      .inSingletonScope();
    options
      .bind<IUserService>(TYPES.UserService)
      .to(UsersService)
      .inSingletonScope();
    options
      .bind<IConfigService>(TYPES.ConfigService)
      .to(ConfigService)
      .inSingletonScope();
    options
      .bind<PrismaService>(TYPES.PrismaService)
      .to(PrismaService)
      .inSingletonScope();
    options
      .bind<IUsersRepository>(TYPES.UsersRepository)
      .to(UsersRepository)
      .inSingletonScope();
    options
      .bind<IRefreshTokenRepository>(TYPES.RefreshTokenRepository)
      .to(RefreshTokenRepository)
      .inSingletonScope();
    options
      .bind<IJwtService>(TYPES.JwtService)
      .to(JwtService)
      .inSingletonScope();
    options
      .bind<IAuthService>(TYPES.AuthService)
      .to(AuthService)
      .inSingletonScope();
    options
      .bind<IAuthController>(TYPES.AuthController)
      .to(AuthController)
      .inSingletonScope();
    options.bind<App>(TYPES.Application).to(App);
  },
);
async function bootstrap(): Promise<IBootstrapReturn> {
  const appContainer = new Container();
  await appContainer.load(appBindings);
  const app = appContainer.get<App>(TYPES.Application);
  await app.init();
  return { app, appContainer };
}

export const boot = bootstrap();
