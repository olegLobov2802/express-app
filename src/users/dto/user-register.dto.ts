import { IsEmail, IsString } from 'class-validator';

export class UserRegisterDto {
  @IsEmail({}, { message: 'Email is not valid' })
  email: string;

  @IsString({ message: 'The password is not indicated' })
  password: string;

  @IsString({ message: 'The name is not indicated' })
  name: string;
}
