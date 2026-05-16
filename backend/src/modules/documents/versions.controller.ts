import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { VersionsService } from './versions.service';

@Controller('documents/:documentId/versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get()
  async findAll(@Param('documentId', ParseUUIDPipe) documentId: string) {
    return this.versionsService.findByDocument(documentId);
  }
}
