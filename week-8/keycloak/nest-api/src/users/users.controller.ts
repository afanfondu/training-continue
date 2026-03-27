import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Resource, Scopes } from 'nest-keycloak-connect';
import { RESOURCE } from 'src/common/enums/resource.enum';
import { SCOPE } from 'src/common/enums/scope.enum';

@Controller('api/users')
@Resource(RESOURCE.USERS)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Scopes(SCOPE.WRITE)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Scopes(SCOPE.READ)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Scopes(SCOPE.READ)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Scopes(SCOPE.WRITE)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Scopes(SCOPE.DELETE)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
