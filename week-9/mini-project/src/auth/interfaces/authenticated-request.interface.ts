import { Request } from 'express';
import { UserRole } from '../../users/enums/user-role.enum';

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
