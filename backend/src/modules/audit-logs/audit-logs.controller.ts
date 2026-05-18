import { Controller, Get, Query, UseGuards, Res, Req } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Req() req?: any,
  ) {
    return this.auditLogsService.findAllLogs(
      req.user.tenantId,
      limit || 100,
      offset || 0,
    );
  }

  @Get('export')
  async export(@Req() req: any, @Res() res: Response) {
    const csv = await this.auditLogsService.exportLogs(req.user.tenantId);
    res.header('Content-Type', 'text/csv');
    res.attachment('audit-logs.csv');
    return res.send(csv);
  }
}
