import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../../db/schema';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: MeiliSearch;
  private documentIndex: Index;

  constructor(
    private configService: ConfigService,
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    const host =
      this.configService.get<string>('MEILISEARCH_HOST') ||
      'http://localhost:7700';
    const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY');

    this.client = new MeiliSearch({
      host,
      apiKey,
    });
  }

  private escapeFilterValue(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  async onModuleInit() {
    // Initialize index settings
    try {
      // Ensure the index exists with an explicit primary key
      try {
        await this.client.createIndex('documents', { primaryKey: 'id' });
      } catch (e: any) {
        // If the index already exists, that is expected. Otherwise, rethrow.
        if (e.code !== 'index_already_exists') {
          throw e;
        }
      }

      this.documentIndex = this.client.index('documents');
      await this.documentIndex.updateSettings({
        searchableAttributes: ['title', 'description'],
        filterableAttributes: ['folderId', 'ownerId', 'isArchived', 'tenantId'],
        sortableAttributes: ['createdAt', 'updatedAt'],
      });
    } catch (error: any) {
      console.error('Failed to initialize Meilisearch index:', error.message);
    }
  }

  async addOrUpdateDocument(document: any) {
    try {
      await this.client.index('documents').addDocuments([document]);
    } catch (error: any) {
      console.warn(`Meilisearch sync failed (non-blocking): ${error.message}`);
    }
  }

  async deleteDocument(id: string) {
    try {
      await this.client.index('documents').deleteDocument(id);
    } catch (error: any) {
      console.warn(
        `Meilisearch delete failed (non-blocking): ${error.message}`,
      );
    }
  }

  async search(query: string, tenantId?: string, filters?: any) {
    try {
      const meiliFilters = {
        ...filters,
      };
      if (tenantId) {
        const tenantFilter = `tenantId = "${this.escapeFilterValue(tenantId)}"`;
        meiliFilters.filter = filters?.filter
          ? `${filters.filter} AND ${tenantFilter}`
          : tenantFilter;
      }
      const result = await this.client
        .index('documents')
        .search(query, meiliFilters);
      return result.hits;
    } catch (error: any) {
      console.warn(
        `Meilisearch search failed, falling back to PostgreSQL Full-Text Search: ${error.message}`,
      );

      try {
        const rows = await this.db.execute(sql`
          SELECT 
            d.id, 
            d.title, 
            d.description, 
            d.folder_id AS "folderId", 
            d.owner_id AS "ownerId", 
            d.is_archived AS "isArchived",
            d.created_at AS "createdAt", 
            d.updated_at AS "updatedAt"
          FROM documents d
          WHERE (
            d.title ILIKE ${'%' + query + '%'}
            OR d.description ILIKE ${'%' + query + '%'}
            OR (d.search_vector @@ plainto_tsquery('simple', ${query}))
          )
          AND (${tenantId ? sql`d.tenant_id = ${tenantId}` : sql`1=1`})
          AND d.is_archived = false
          LIMIT 50
        `);
        return rows.rows;
      } catch (dbError: any) {
        console.error(`PostgreSQL fallback search failed: ${dbError.message}`);
        return [];
      }
    }
  }
}
