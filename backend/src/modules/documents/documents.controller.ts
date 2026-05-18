import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermission('document', 'write')
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      title: string;
      description?: string;
      folderId?: string;
      ownerId: string;
      tagIds?: any;
    },
    @Req() req: any,
  ) {
    let tagIdsParsed: string[] | undefined = undefined;
    if (body.tagIds) {
      try {
        if (typeof body.tagIds === 'string') {
          tagIdsParsed = JSON.parse(body.tagIds);
        } else if (Array.isArray(body.tagIds)) {
          tagIdsParsed = body.tagIds;
        }
      } catch (e) {
        // Ignore JSON parse failures and keep it undefined
      }
    }

    return this.documentsService.createDocument(
      {
        ...body,
        folderId:
          body.folderId === 'null' || !body.folderId
            ? undefined
            : body.folderId,
        tagIds: tagIdsParsed,
        tenantId: req.user.tenantId,
      },
      file,
    );
  }

  @Get()
  @RequirePermission('document', 'read')
  async findAll(@Query('folderId') folderId?: string, @Req() req?: any) {
    const parentId = folderId === 'null' || !folderId ? undefined : folderId;
    return this.documentsService.findAllWithTags(parentId, req?.user?.tenantId);
  }

  @Get(':id')
  @RequirePermission('document', 'read')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOneWithTags(id);
  }

  @Put(':id/tags')
  @RequirePermission('document', 'write')
  async updateTags(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { tagIds: string[] },
    @Req() req: any,
  ) {
    return this.documentsService.updateDocumentTags(
      id,
      body.tagIds,
      req.user.id,
    );
  }

  @Delete(':id')
  @RequirePermission('document', 'admin')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.deleteDocument(id);
  }

  @Post(':id/versions')
  @RequirePermission('document', 'write')
  @UseInterceptors(FileInterceptor('file'))
  async addVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { ownerId: string },
  ) {
    return this.documentsService.addVersion(id, file, body.ownerId);
  }
}
