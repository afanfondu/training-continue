import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OwnershipGuard } from './ownership.guard';
import { UserRole } from '../../users/enums/user-role.enum';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;
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
    guard = new OwnershipGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no paramKey is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({});

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('id');
    const context = createMockContext({ params: { id: '123' } });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Authenticated user context is missing'),
    );
  });

  it('should return true if user is admin (admin bypass)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('id');
    const context = createMockContext({
      user: { id: 'admin-id', role: UserRole.ADMIN },
      params: { id: '123' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user is the owner', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('id');
    const context = createMockContext({
      user: { id: '123', role: UserRole.USER },
      params: { id: '123' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is not the owner', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('id');
    const context = createMockContext({
      user: { id: '456', role: UserRole.USER },
      params: { id: '123' },
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('You can only access your own resource'),
    );
  });
});
