import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: {
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
  };

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
    createdAt: new Date('2026-03-03T10:00:00.000Z'),
    updatedAt: new Date('2026-03-03T10:00:00.000Z'),
    deletedAt: null,
  };

  const mockCreateUserDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
  };

  const mockUpdateUserDto = {
    firstName: 'Jane',
    lastName: 'Smith',
  };

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    (bcrypt.hash as jest.Mock).mockClear();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({
        ...mockCreateUserDto,
        password: 'hashedPassword',
      });
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        ...mockCreateUserDto,
        password: 'hashedPassword',
      });

      const result = await service.create(mockCreateUserDto);

      expect(result).toEqual(
        expect.objectContaining({
          email: mockCreateUserDto.email,
          firstName: mockCreateUserDto.firstName,
          lastName: mockCreateUserDto.lastName,
        }),
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...mockCreateUserDto,
        password: 'hashedPassword',
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        'Email already exists',
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated users without filters', async () => {
      const users = [mockUser];
      const total = 1;
      mockRepository.findAndCount.mockResolvedValue([users, total]);

      const result = await service.findAll({});

      expect(result).toEqual({
        users,
        meta: {
          page: 1,
          limit: 20,
          total,
          totalPages: 1,
        },
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 20,
        order: { createdAt: 'DESC' },
      });
    });

    it('should apply pagination correctly', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should filter by role', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ role: UserRole.ADMIN });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: [{ role: UserRole.ADMIN }],
        skip: 0,
        take: 20,
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by search term', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ search: 'John' });

      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by role and search term combined', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ role: UserRole.USER, search: 'John' });

      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });

    it('should use safe sortBy column', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ sortBy: 'email', sortOrder: 'ASC' });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { email: 'ASC' },
        }),
      );
    });

    it('should default to createdAt when invalid sortBy provided', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ sortBy: 'invalidColumn' });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        'User with ID "nonexistent-id" not found',
      );
    });
  });

  describe('update', () => {
    it('should update user successfully without password', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        ...mockUpdateUserDto,
      });

      const result = await service.update(mockUser.id, mockUpdateUserDto);

      expect(result.firstName).toBe(mockUpdateUserDto.firstName);
      expect(result.lastName).toBe(mockUpdateUserDto.lastName);
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should update user with password hashing', async () => {
      const updateWithPassword = {
        ...mockUpdateUserDto,
        password: 'newPassword123',
      };
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        ...updateWithPassword,
        password: 'newHashedPassword',
      });

      await service.update(mockUser.id, updateWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', mockUpdateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.softDelete(mockUser.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockRepository.softDelete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove user by calling softDelete', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(mockUser.id);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
