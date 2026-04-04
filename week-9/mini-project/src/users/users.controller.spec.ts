import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from './enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
    createdAt: new Date('2026-03-03T10:00:00.000Z'),
    updatedAt: new Date('2026-03-03T10:00:00.000Z'),
    deletedAt: null,
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const queryUsersDto: QueryUsersDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      const paginatedResult = {
        users: [mockUser],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockUsersService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(queryUsersDto);

      expect(mockUsersService.findAll).toHaveBeenCalledWith(queryUsersDto);
      expect(result).toEqual(paginatedResult);
    });

    it('should use default query parameters', async () => {
      mockUsersService.findAll.mockResolvedValue({
        users: [mockUser],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      await controller.findAll({});

      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(userId);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    it('should update a user as admin with role', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Jane',
        role: UserRole.ADMIN,
      };

      const req = {
        user: {
          id: userId,
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
      } as unknown as AuthenticatedRequest;

      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
        role: UserRole.ADMIN,
      };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, req, updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should strip role from updateDto when user is not admin', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Jane',
        role: UserRole.ADMIN,
      };

      const req = {
        user: {
          id: userId,
          email: 'user@example.com',
          role: UserRole.USER,
        },
      } as unknown as AuthenticatedRequest;

      const expectedDto = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, firstName: 'Jane' };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, req, updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(userId, expectedDto);
      expect(result).toEqual(updatedUser);
    });

    it('should allow non-admin to update without role', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Jane',
      };

      const req = {
        user: {
          id: userId,
          email: 'user@example.com',
          role: UserRole.USER,
        },
      } as unknown as AuthenticatedRequest;

      const updatedUser = { ...mockUser, firstName: 'Jane' };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, req, updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      mockUsersService.softDelete.mockResolvedValue(undefined);

      await controller.remove(userId);

      expect(mockUsersService.softDelete).toHaveBeenCalledWith(userId);
    });
  });
});
