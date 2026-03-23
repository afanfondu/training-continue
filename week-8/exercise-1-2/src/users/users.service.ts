import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const userExists = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (userExists) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return await this.usersRepository.save(user);
  }

  async findByEmail(email: string) {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findAll(queryUsersDto: QueryUsersDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      role,
      search,
    } = queryUsersDto;

    const allowedSortColumns = ['createdAt', 'email', 'firstName', 'lastName'];
    const safeSortBy = allowedSortColumns.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const where: FindOptionsWhere<User>[] = [];

    if (role && search) {
      where.push(
        { role, firstName: Like(`%${search}%`) },
        { role, lastName: Like(`%${search}%`) },
        { role, email: Like(`%${search}%`) },
      );
    } else if (role) {
      where.push({ role });
    } else if (search) {
      where.push(
        { firstName: Like(`%${search}%`) },
        { lastName: Like(`%${search}%`) },
        { email: Like(`%${search}%`) },
      );
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where: where.length > 0 ? where : undefined,
      skip: (page - 1) * limit,
      take: limit,
      order: { [safeSortBy]: sortOrder },
    });

    return {
      users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (updateUserDto.password)
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);

    return await this.usersRepository.save({
      ...user,
      ...updateUserDto,
    });
  }

  async softDelete(id: string) {
    const user = await this.findOne(id);
    await this.usersRepository.softDelete(user.id);
  }

  async remove(id: string) {
    await this.softDelete(id);
  }
}
