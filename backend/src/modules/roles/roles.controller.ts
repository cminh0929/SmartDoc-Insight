import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async getAllRoles(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.rolesService.findAll(tenantId);
  }

  @Post()
  async createRole(@Body() data: any, @Request() req: any) {
    // Check if user is admin, staff, or has manager permissions
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'staff' &&
      req.user.role !== 'IT Manager'
    ) {
      throw new ForbiddenException(
        'Only managers or administrators can manage roles',
      );
    }
    return this.rolesService.create({
      ...data,
      tenantId: req.user.tenantId,
    });
  }

  @Put(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'staff' &&
      req.user.role !== 'IT Manager'
    ) {
      throw new ForbiddenException(
        'Only managers or administrators can manage roles',
      );
    }
    return this.rolesService.update(id, data, req.user.tenantId);
  }

  @Delete(':id')
  async deleteRole(@Param('id') id: string, @Request() req: any) {
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'staff' &&
      req.user.role !== 'IT Manager'
    ) {
      throw new ForbiddenException(
        'Only managers or administrators can manage roles',
      );
    }
    return this.rolesService.delete(id, req.user.tenantId);
  }
}
