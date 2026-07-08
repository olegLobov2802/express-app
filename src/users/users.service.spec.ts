import { Container } from 'inversify';

import { UserModel } from '../../generated/prisma';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';

import { User } from './user.entity';
import { UserPublic } from './user.mapper';
import { IUsersRepository } from './users.repository.interface';
import { UsersService } from './users.service';
import { IUserService } from './users.service.interface';

const ConfigServiceMock: IConfigService = {
  get: jest.fn(),
};

const UsersRepositoryMock: IUsersRepository = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const container = new Container();

let configService: IConfigService;
let usersRepository: IUsersRepository;
let usersService: IUserService;

let storedUser: UserModel | null;
let createdUser: UserPublic | null;

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
    usersRepository.find = jest.fn().mockResolvedValueOnce(null);
    usersRepository.create = jest
      .fn()
      .mockImplementationOnce((user: User): UserModel => {
        storedUser = {
          name: user.name,
          email: user.email,
          password: user.password,
          id: 1,
        };

        return storedUser;
      });

    createdUser = await usersService.createUser({
      email: 'userMail@mail.com',
      name: 'UserName',
      password: 'userPassword',
    });

    expect(createdUser?.id).toEqual(1);
    expect(createdUser).toEqual({
      id: 1,
      email: 'userMail@mail.com',
      name: 'UserName',
    });
    expect(createdUser).not.toHaveProperty('password');
  });

  it('create user - duplicate email', async () => {
    usersRepository.create = jest.fn();
    usersRepository.find = jest.fn().mockResolvedValueOnce(storedUser);

    const result = await usersService.createUser({
      email: 'userMail@mail.com',
      name: 'AnotherUser',
      password: 'anotherPassword',
    });

    expect(result).toBeNull();
    expect(usersRepository.create).not.toHaveBeenCalled();
  });

  it('validateUser - success', async () => {
    usersRepository.find = jest.fn().mockReturnValueOnce(storedUser);
    const result = await usersService.validateUser({
      email: 'userMail@mail.com',
      password: 'userPassword',
    });

    expect(result).toEqual({
      id: 1,
      email: 'userMail@mail.com',
      name: 'UserName',
    });
  });

  it('validateUser - wrong password', async () => {
    usersRepository.find = jest.fn().mockReturnValueOnce(storedUser);
    const result = await usersService.validateUser({
      email: 'userMail@mail.com',
      password: '2',
    });

    expect(result).toBeNull();
  });

  it('validateUser - wrong user', async () => {
    usersRepository.find = jest.fn().mockReturnValueOnce(null);
    const result = await usersService.validateUser({
      email: 'userMail@mail.com',
      password: '2',
    });

    expect(result).toBeNull();
  });

  it('getUserInfo - excludes password', async () => {
    usersRepository.findById = jest.fn().mockResolvedValueOnce(storedUser);

    const result = await usersService.getUserInfo(1);

    expect(result).toEqual({
      id: 1,
      email: 'userMail@mail.com',
      name: 'UserName',
    });
    expect(result).not.toHaveProperty('password');
  });
});
