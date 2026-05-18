import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

export interface PermissionRequirement {
  entityType: 'document' | 'folder';
  level: 'read' | 'write' | 'admin';
}

export const RequirePermission = (
  entityType: 'document' | 'folder',
  level: 'read' | 'write' | 'admin',
) => SetMetadata(REQUIRE_PERMISSION_KEY, { entityType, level });
