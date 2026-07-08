import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserPublic } from './user.mapper';

export interface IUserService {
  createUser(dto: UserRegisterDto): Promise<UserPublic | null>;
  validateUser(dto: UserLoginDto): Promise<UserPublic | null>;
  getUserInfo(userId: number): Promise<UserPublic | null>;
}
