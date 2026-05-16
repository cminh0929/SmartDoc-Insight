import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      title: string;
      description?: string;
      folderId?: string;
      ownerId: string;
    },
  ) {
    return this.documentsService.createDocument(body, file);
  }

  @Get()
  async findAll(@Query('folderId') folderId?: string) {
    if (folderId) {
      return this.documentsService.findByFolder(folderId);
    }
    return this.documentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.deleteDocument(id);
  }

  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file'))
  async addVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { ownerId: string },
  ) {
    return this.documentsService.addVersion(id, file, body.ownerId);
  }
}
