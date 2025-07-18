import { inject, injectable } from 'inversify';

import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';

import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { User } from './user.entity';
import { IUserService } from './user.service.interface';

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.ConfigService) private configeService: IConfigService,
  ) {}

  async createUser(dto: UserRegisterDto): Promise<User | null> {
    const { name, email, password } = dto;
    const salt = this.configeService.get('SALT');

    const newUser = new User(email, name);
    await newUser.setPassword(password, Number(salt));
    return null;
  }

  async validateUser(dto: UserLoginDto): Promise<boolean> {
    return true;
  }
}
