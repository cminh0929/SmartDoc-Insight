import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from '../../db/database.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';

@Global()
@Module({
  imports: [DatabaseModule, AuditLogsModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
