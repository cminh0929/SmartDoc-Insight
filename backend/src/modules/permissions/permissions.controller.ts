import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('document/:documentId')
  async getDocumentPermissions(
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const callerId = req.user.id;
    // Verify caller has admin permission on the document
    const hasAccess = await this.permissionsService.checkEffectivePermission(
      callerId,
      'document',
      documentId,
      'admin',
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have administrative access to this document',
      );
    }

    return this.permissionsService.getPermissionsByEntity(
      documentId,
      undefined,
    );
  }

  @Get('folder/:folderId')
  async getFolderPermissions(
    @Param('folderId') folderId: string,
    @Req() req: any,
  ) {
    const callerId = req.user.id;
    // Verify caller has admin permission on the folder
    const hasAccess = await this.permissionsService.checkEffectivePermission(
      callerId,
      'folder',
      folderId,
      'admin',
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have administrative access to this folder',
      );
    }

    return this.permissionsService.getPermissionsByEntity(undefined, folderId);
  }

  @Post()
  async grantPermission(
    @Body()
    dto: {
      userId: string;
      documentId?: string;
      folderId?: string;
      level: 'read' | 'write' | 'admin';
    },
    @Req() req: any,
  ) {
    const callerId = req.user.id;

    if (dto.documentId) {
      const hasAccess = await this.permissionsService.checkEffectivePermission(
        callerId,
        'document',
        dto.documentId,
        'admin',
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'You must be an admin/owner to grant permissions on this document',
        );
      }
    } else if (dto.folderId) {
      const hasAccess = await this.permissionsService.checkEffectivePermission(
        callerId,
        'folder',
        dto.folderId,
        'admin',
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'You must be an admin/owner to grant permissions on this folder',
        );
      }
    } else {
      throw new ForbiddenException('Must specify documentId or folderId');
    }

    return this.permissionsService.grantPermission(dto, callerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokePermission(@Param('id') id: string, @Req() req: any) {
    const callerId = req.user.id;
    const permission = await this.permissionsService.findOne(id);
    if (!permission) {
      return;
    }

    if (permission.documentId) {
      const hasAccess = await this.permissionsService.checkEffectivePermission(
        callerId,
        'document',
        permission.documentId,
        'admin',
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'You do not have administrative access to revoke permissions on this document',
        );
      }
    } else if (permission.folderId) {
      const hasAccess = await this.permissionsService.checkEffectivePermission(
        callerId,
        'folder',
        permission.folderId,
        'admin',
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'You do not have administrative access to revoke permissions on this folder',
        );
      }
    }

    await this.permissionsService.revokePermission(id, callerId);
  }
}
