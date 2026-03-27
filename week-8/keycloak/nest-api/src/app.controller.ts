import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthenticatedUser, Public, Roles } from 'nest-keycloak-connect';
import { ROLES } from './common/enums/roles.enum';

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

  @Roles({ roles: [ROLES.ADMIN] })
  @Get('admin')
  admin(): string {
    return 'admin-data';
  }
}
