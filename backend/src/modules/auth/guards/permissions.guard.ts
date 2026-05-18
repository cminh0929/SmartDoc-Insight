import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_PERMISSION_KEY,
  PermissionRequirement,
} from '../decorators/require-permission.decorator';
import { PermissionsService } from '../../permissions/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Admin has superuser status
    if (user.role === 'admin' || user.role === 'IT Manager') {
      return true;
    }

    const { entityType, level } = requirement;

    // Resolve entityId from request parameters, body, or query string
    const entityId =
      request.params?.id ||
      request.params?.documentId ||
      request.params?.folderId ||
      request.body?.id ||
      request.body?.documentId ||
      request.body?.folderId ||
      request.query?.folderId ||
      request.query?.documentId;

    if (!entityId) {
      // If we are creating a folder, check write permission on parentId if provided
      if (entityType === 'folder' && level === 'write') {
        const parentId = request.body?.parentId;
        if (!parentId) {
          // Creating a root folder. Allow Admin, Staff, and IT Manager, deny Intern.
          return (
            user.role === 'admin' ||
            user.role === 'staff' ||
            user.role === 'IT Manager'
          );
        }
        // Creating a child folder, check write permission on parent folder
        return this.permissionsService.checkEffectivePermission(
          user.id,
          'folder',
          parentId,
          'write',
        );
      }

      // If we are uploading a document, check write permission on folderId if provided
      if (entityType === 'document' && level === 'write') {
        const folderId = request.body?.folderId;
        if (!folderId) {
          // Uploading to root. Allow Admin, Staff, and IT Manager, deny Intern.
          return (
            user.role === 'admin' ||
            user.role === 'staff' ||
            user.role === 'IT Manager'
          );
        }
        // Uploading to a folder, check write permission on target folder
        return this.permissionsService.checkEffectivePermission(
          user.id,
          'folder',
          folderId,
          'write',
        );
      }

      return true;
    }

    return this.permissionsService.checkEffectivePermission(
      user.id,
      entityType,
      entityId,
      level,
    );
  }
}
