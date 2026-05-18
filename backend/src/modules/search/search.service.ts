import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: MeiliSearch;
  private documentIndex: Index;

  constructor(private configService: ConfigService) {
    const host =
      this.configService.get<string>('MEILISEARCH_HOST') ||
      'http://localhost:7700';
    const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY');

    this.client = new MeiliSearch({
      host,
      apiKey,
    });
  }

  async onModuleInit() {
    // Initialize index settings
    try {
      this.documentIndex = this.client.index('documents');
      await this.documentIndex.updateSettings({
        searchableAttributes: ['title', 'description'],
        filterableAttributes: ['folderId', 'ownerId', 'isArchived'],
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
      throw new InternalServerErrorException(
        `Failed to sync to Meilisearch: ${error.message}`,
      );
    }
  }

  async deleteDocument(id: string) {
    try {
      await this.client.index('documents').deleteDocument(id);
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to delete from Meilisearch: ${error.message}`,
      );
    }
  }

  async search(query: string, filters?: any) {
    try {
      const result = await this.client.index('documents').search(query, filters);
      return result.hits;
    } catch (error: any) {
      throw new InternalServerErrorException(`Search failed: ${error.message}`);
    }
  }
}
