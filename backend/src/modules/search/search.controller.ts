import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') query: string,
    @Query('folderId') folderId?: string,
    @Req() req?: any,
  ) {
    const filters: any = {};

    if (folderId) {
      filters.filter = `folderId = ${folderId}`;
    }

    const tenantId = req?.user?.tenantId;
    return this.searchService.search(query, tenantId, filters);
  }
}
