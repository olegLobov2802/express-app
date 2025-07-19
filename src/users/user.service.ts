import { inject, injectable } from 'inversify';

import { UserModel } from '../../generated/prisma';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';

import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { User } from './user.entity';
import { IUserService } from './user.service.interface';
import { IUsersRepository } from './users.repository.interface';

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.ConfigService) private configService: IConfigService,
    @inject(TYPES.UsersRepository) private usersRepository: IUsersRepository,
  ) {}

  async createUser(dto: UserRegisterDto): Promise<UserModel | null> {
    const { name, email, password } = dto;
    const salt = this.configService.get('SALT');

    const newUser = new User(email, name);
    await newUser.setPassword(password, Number(salt));

    const existedUser = await this.usersRepository.find(email);

    if (existedUser) {
      return null;
    }

    return await this.usersRepository.create(newUser);
  }

  async validateUser(dto: UserLoginDto): Promise<boolean> {
    return true;
  }
}
