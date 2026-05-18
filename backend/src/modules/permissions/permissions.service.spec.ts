import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockDb: any;
  let mockAuditLogsService: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    mockAuditLogsService = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mockDb,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkEffectivePermission', () => {
    it('should return true for admin user role', async () => {
      mockDb.limit = jest
        .fn()
        .mockResolvedValue([{ id: 'user1', role: 'admin' }]);
      const result = await service.checkEffectivePermission(
        'user1',
        'document',
        'doc1',
        'admin',
      );
      expect(result).toBe(true);
    });

    it('should return true if user is the document owner', async () => {
      mockDb.limit = jest
        .fn()
        .mockResolvedValueOnce([{ id: 'user1', role: 'staff' }])
        .mockResolvedValueOnce([{ id: 'doc1', ownerId: 'user1' }]);

      const result = await service.checkEffectivePermission(
        'user1',
        'document',
        'doc1',
        'admin',
      );
      expect(result).toBe(true);
    });

    it('should return true if explicit document permission matches required level', async () => {
      mockDb.limit = jest
        .fn()
        .mockResolvedValueOnce([{ id: 'user1', role: 'staff' }]) // user fetch
        .mockResolvedValueOnce([
          { id: 'doc1', ownerId: 'other-user', folderId: 'folder1' },
        ]) // doc fetch
        .mockResolvedValueOnce([{ id: 'perm1', level: 'write' }]); // explicit permission fetch

      const result = await service.checkEffectivePermission(
        'user1',
        'document',
        'doc1',
        'write',
      );
      expect(result).toBe(true);
    });

    it('should return false if explicit document permission is lower than required level', async () => {
      mockDb.limit = jest
        .fn()
        .mockResolvedValueOnce([{ id: 'user1', role: 'staff' }]) // user fetch
        .mockResolvedValueOnce([
          { id: 'doc1', ownerId: 'other-user', folderId: 'folder1' },
        ]) // doc fetch
        .mockResolvedValueOnce([{ id: 'perm1', level: 'read' }]); // explicit permission fetch

      const result = await service.checkEffectivePermission(
        'user1',
        'document',
        'doc1',
        'write',
      );
      expect(result).toBe(false);
    });

    it('should return inherited permission from folder if no explicit document permission exists', async () => {
      mockDb.limit = jest
        .fn()
        .mockResolvedValueOnce([{ id: 'user1', role: 'staff' }]) // user fetch
        .mockResolvedValueOnce([
          { id: 'doc1', ownerId: 'other-user', folderId: 'folder1' },
        ]) // doc fetch
        .mockResolvedValueOnce([]) // explicit document permission check (none)
        .mockResolvedValueOnce([{ id: 'perm2', level: 'write' }]); // explicit folder permission check

      const result = await service.checkEffectivePermission(
        'user1',
        'document',
        'doc1',
        'write',
      );
      expect(result).toBe(true);
    });
  });
});
