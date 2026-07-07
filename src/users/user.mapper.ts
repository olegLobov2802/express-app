import { UserModel } from '../../generated/prisma';

export type UserPublic = Pick<UserModel, 'id' | 'email' | 'name'>;

export function toUserPublic(user: UserModel): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
