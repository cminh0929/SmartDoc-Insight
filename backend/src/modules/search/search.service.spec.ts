import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';

const createIndex = jest.fn();
const index = jest.fn();

jest.mock('meilisearch', () => ({
  MeiliSearch: jest.fn().mockImplementation(() => ({
    createIndex,
    index,
  })),
}));

describe('SearchService', () => {
  let service: SearchService;
  let documentIndex: {
    updateSettings: jest.Mock;
    search: jest.Mock;
    addDocuments: jest.Mock;
    deleteDocument: jest.Mock;
  };
  let db: {
    execute: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    documentIndex = {
      updateSettings: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue({ hits: [] }),
      addDocuments: jest.fn().mockResolvedValue(undefined),
      deleteDocument: jest.fn().mockResolvedValue(undefined),
    };
    createIndex.mockResolvedValue(undefined);
    index.mockReturnValue(documentIndex);
    db = {
      execute: jest.fn().mockResolvedValue({ rows: [] }),
    };

    service = new SearchService(
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
      db as any,
    );
  });

  it('configures tenantId as a filterable Meilisearch attribute', async () => {
    await service.onModuleInit();

    expect(documentIndex.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        filterableAttributes: expect.arrayContaining(['tenantId']),
      }),
    );
  });

  it('quotes tenant UUID values in Meilisearch filters', async () => {
    await service.search('handbook', 'tenant-uuid');

    expect(documentIndex.search).toHaveBeenCalledWith('handbook', {
      filter: 'tenantId = "tenant-uuid"',
    });
  });

  it('combines existing filters with quoted tenant filters', async () => {
    await service.search('handbook', 'tenant-uuid', {
      filter: 'folderId = "folder-uuid"',
    });

    expect(documentIndex.search).toHaveBeenCalledWith('handbook', {
      filter: 'folderId = "folder-uuid" AND tenantId = "tenant-uuid"',
    });
  });

  it('falls back to PostgreSQL search when Meilisearch fails', async () => {
    documentIndex.search.mockRejectedValue(new Error('meili unavailable'));

    await service.search('handbook', 'tenant-uuid');

    expect(db.execute).toHaveBeenCalledTimes(1);
  });
});
