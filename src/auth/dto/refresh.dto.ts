import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @IsString({ message: 'Refresh token is required' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
