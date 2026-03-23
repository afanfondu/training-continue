import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/enums/user-role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (overrides: {
    user?: unknown;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  }) => {
    const request = {
      user: overrides.user,
      params: overrides.params ?? {},
      headers: overrides.headers ?? {},
    };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({});

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if required roles array is empty', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const context = createMockContext({});

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is missing', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Insufficient permissions'),
    );
  });

  it('should throw ForbiddenException if user has insufficient role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ user: { role: UserRole.USER } });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Insufficient permissions'),
    );
  });

  it('should return true if user has sufficient role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ user: { role: UserRole.ADMIN } });

    expect(guard.canActivate(context)).toBe(true);
  });
});
