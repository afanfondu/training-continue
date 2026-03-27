import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthenticatedUser, Public, Roles } from 'nest-keycloak-connect';
import { ROLE } from './common/enums/role.enum';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('profile')
  private(@AuthenticatedUser() user) {
    return user;
  }

  @Roles({ roles: [ROLE.ADMIN] })
  @Get('admin')
  admin(): string {
    return 'admin-data';
  }
}
