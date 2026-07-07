import { inject, injectable } from 'inversify';

import { Prisma } from '../../generated/prisma';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';

import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { User } from './user.entity';
import { toUserPublic, UserPublic } from './user.mapper';
import { IUsersRepository } from './users.repository.interface';
import { IUserService } from './users.service.interface';

@injectable()
export class UsersService implements IUserService {
  constructor(
    @inject(TYPES.ConfigService) private configService: IConfigService,
    @inject(TYPES.UsersRepository) private usersRepository: IUsersRepository,
  ) {}

  async createUser(dto: UserRegisterDto): Promise<UserPublic | null> {
    const { name, email, password } = dto;

    const existedUser = await this.usersRepository.find(email);

    if (existedUser) {
      return null;
    }

    const salt = this.configService.get('SALT');
    const newUser = new User(email, name);
    await newUser.setPassword(password, Number(salt));

    try {
      const createdUser = await this.usersRepository.create(newUser);
      return toUserPublic(createdUser);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return null;
      }

      throw error;
    }
  }

  async validateUser(dto: UserLoginDto): Promise<boolean> {
    const { email, password } = dto;

    const existedUser = await this.usersRepository.find(email);
    if (!existedUser) {
      return false;
    }

    const newUser = new User(
      existedUser.email,
      existedUser.name,
      existedUser.password,
    );

    return await newUser.comparePassword(password);
  }

  async getUserInfo(email: string): Promise<UserPublic | null> {
    const user = await this.usersRepository.find(email);

    if (!user) {
      return null;
    }

    return toUserPublic(user);
  }
}
