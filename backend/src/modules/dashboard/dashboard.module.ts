import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DatabaseModule } from '../../db/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
