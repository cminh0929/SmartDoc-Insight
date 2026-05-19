import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openai: OpenAI;
  private readonly model = 'text-embedding-3-small';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set — RAG embeddings will be disabled.');
    }
    this.openai = new OpenAI({ apiKey: apiKey || 'placeholder' });
  }

  /**
   * Embed a single text string into a 1536-dimension vector.
   */
  async embedText(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text.slice(0, 8192), // max token safety
    });
    return response.data[0].embedding;
  }

  /**
   * Batch embed multiple texts (more efficient for indexing).
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: texts.map((t) => t.slice(0, 8192)),
    });
    return response.data.map((d) => d.embedding);
  }
}
