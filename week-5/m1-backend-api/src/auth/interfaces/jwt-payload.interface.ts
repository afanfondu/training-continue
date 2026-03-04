import { UserRole } from '../../users/enums/user-role.enum';

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: UserRole;
}
