import { inject, injectable } from 'inversify';
import { sign, SignOptions } from 'jsonwebtoken';

import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';

import { parseDurationToSeconds } from './duration';
import { AccessTokenPayload } from './jwt-payload';
import { IJwtService } from './jwt.service.interface';

@injectable()
export class JwtService implements IJwtService {
  constructor(
    @inject(TYPES.ConfigService) private configService: IConfigService,
  ) {}

  async signAccessToken(
    payload: AccessTokenPayload,
  ): Promise<{ token: string; expiresIn: number }> {
    const secret = this.configService.get('JWT_SECRET');
    const expiresIn =
      this.configService.get('JWT_ACCESS_EXPIRES_IN') ||
      this.configService.get('JWT_EXPIRES_IN') ||
      '1h';
    const expiresInSeconds = parseDurationToSeconds(expiresIn);

    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: expiresInSeconds,
    };

    const token = await new Promise<string>((resolve, reject) => {
      sign(
        {
          sub: payload.sub,
          email: payload.email,
          iat: Math.floor(Date.now() / 1000),
        },
        secret,
        options,
        (err, signedToken) => {
          if (err) {
            return reject(err);
          }

          if (!signedToken) {
            return reject(new Error('Token generation failed'));
          }

          resolve(signedToken);
        },
      );
    });

    return { token, expiresIn: expiresInSeconds };
  }
}
