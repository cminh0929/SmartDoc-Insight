import {
  Controller,
  Get,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('my-workspace')
  async getMyWorkspace(@Request() req: any) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new NotFoundException('User does not belong to any workspace');
    }

    const tenant = await this.tenantsService.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Workspace not found');
    }

    const employees = await this.tenantsService.getEmployees(tenantId);

    return {
      workspace: tenant,
      employees,
    };
  }
}
