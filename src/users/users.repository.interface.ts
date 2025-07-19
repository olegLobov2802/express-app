import { UserModel } from '../../generated/prisma';

import { User } from './user.entity';

export interface IUsersRepository {
  create: (user: User) => Promise<UserModel>;
  find: (email: string) => Promise<UserModel | null>;
}
