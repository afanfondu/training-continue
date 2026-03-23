import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enums/user-role.enum';
import { OWNER_OR_ADMIN_PARAM_KEY } from '../decorators/owner-or-admin.decorator';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const paramKey = this.reflector.getAllAndOverride<string>(
      OWNER_OR_ADMIN_PARAM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!paramKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authenticated user context is missing');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const resourceOwnerId = request.params[paramKey];
    if (!resourceOwnerId || user.id !== resourceOwnerId) {
      throw new ForbiddenException('You can only access your own resource');
    }

    return true;
  }
}
