import { IsEmail, IsString } from 'class-validator';

export class UserLoginDto {
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;

  @IsString({ message: 'The password is not indicated' })
  password: string;
}
