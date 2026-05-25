import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let permissionsService: {
    checkEffectivePermission: jest.Mock;
  };

  const createContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    permissionsService = {
      checkEffectivePermission: jest.fn(),
    };
    guard = new PermissionsGuard(reflector, permissionsService as any);
  });

  it('allows requests without permission metadata', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
  });

  it('denies requests without an authenticated user', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      entityType: 'document',
      level: 'read',
    });

    await expect(guard.canActivate(createContext({}))).resolves.toBe(false);
  });

  it('delegates entity requests to PermissionsService instead of bypassing admins', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      entityType: 'document',
      level: 'read',
    });
    permissionsService.checkEffectivePermission.mockResolvedValue(false);

    const result = await guard.canActivate(
      createContext({
        user: { id: 'admin-user', role: 'admin' },
        params: { id: 'doc-in-other-tenant' },
      }),
    );

    expect(result).toBe(false);
    expect(permissionsService.checkEffectivePermission).toHaveBeenCalledWith(
      'admin-user',
      'document',
      'doc-in-other-tenant',
      'read',
    );
  });

  it('checks parent folder permission when creating a child folder', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      entityType: 'folder',
      level: 'write',
    });
    permissionsService.checkEffectivePermission.mockResolvedValue(true);

    const result = await guard.canActivate(
      createContext({
        user: { id: 'user1', role: 'staff' },
        body: { parentId: 'folder1' },
        params: {},
      }),
    );

    expect(result).toBe(true);
    expect(permissionsService.checkEffectivePermission).toHaveBeenCalledWith(
      'user1',
      'folder',
      'folder1',
      'write',
    );
  });

  it('denies interns creating root folders', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      entityType: 'folder',
      level: 'write',
    });

    await expect(
      guard.canActivate(
        createContext({
          user: { id: 'intern1', role: 'intern' },
          body: {},
          params: {},
        }),
      ),
    ).resolves.toBe(false);
  });

  it('checks target folder permission when uploading into a folder', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      entityType: 'document',
      level: 'write',
    });
    permissionsService.checkEffectivePermission.mockResolvedValue(true);

    const result = await guard.canActivate(
      createContext({
        user: { id: 'user1', role: 'staff' },
        body: { folderId: 'folder1' },
        params: {},
      }),
    );

    expect(result).toBe(true);
    expect(permissionsService.checkEffectivePermission).toHaveBeenCalledWith(
      'user1',
      'folder',
      'folder1',
      'write',
    );
  });
});
