import { Container } from 'inversify';

import { UserModel } from '../../generated/prisma';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';

import { User } from './user.entity';
import { IUsersRepository } from './users.repository.interface';
import { UsersService } from './users.service';
import { IUserService } from './users.service.interface';

const ConfigServiceMock: IConfigService = {
  get: jest.fn(),
};

const UsersRepositoryMock: IUsersRepository = {
  find: jest.fn(),
  create: jest.fn(),
};

const container = new Container();

let configService: IConfigService;
let usersRepository: IUsersRepository;
let usersService: IUserService;

let createdUser: UserModel | null;

beforeAll(() => {
  container.bind<IUserService>(TYPES.UserService).to(UsersService);
  container
    .bind<IConfigService>(TYPES.ConfigService)
    .toConstantValue(ConfigServiceMock);
  container
    .bind<IUsersRepository>(TYPES.UsersRepository)
    .toConstantValue(UsersRepositoryMock);

  configService = container.get<IConfigService>(TYPES.ConfigService);
  usersRepository = container.get<IUsersRepository>(TYPES.UsersRepository);
  usersService = container.get<IUserService>(TYPES.UserService);
});

describe('User service', () => {
  it('create user', async () => {
    configService.get = jest.fn().mockReturnValueOnce('1');
    usersRepository.create = jest.fn().mockImplementationOnce(
      (user: User): UserModel => ({
        name: user.name,
        email: user.email,
        password: user.password,
        id: 1,
      }),
    );

    createdUser = await usersService.createUser({
      email: 'userMail@mail.com',
      name: 'UserName',
      password: 'userPassword',
    });

    expect(createdUser?.id).toEqual(1);
    expect(createdUser?.password).not.toEqual('userPassword');
  });

  it('validateUser - success', async () => {
    usersRepository.find = jest.fn().mockReturnValueOnce(createdUser);
    const result = await usersService.validateUser({
      email: 'userMail@mail.com',
      password: 'userPassword',
    });

    expect(result).toBeTruthy();
  });

  it('validateUser - wrong password', async () => {
    usersRepository.find = jest.fn().mockReturnValueOnce(createdUser);
    const result = await usersService.validateUser({
      email: 'userMail@mail.com',
      password: '2',
    });

    expect(result).toBeFalsy();
  });

  it('validateUser - wrong user', async () => {
    usersRepository.find = jest.fn().mockReturnValueOnce(null);
    const result = await usersService.validateUser({
      email: 'userMail@mail.com',
      password: '2',
    });

    expect(result).toBeFalsy();
  });
});
