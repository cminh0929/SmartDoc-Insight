import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { documentChunks } from '../../db/schema';
import { EmbeddingService } from './embedding.service';
import { DocumentParserService } from './document-parser.service';
import OpenAI from 'openai';

export interface AskResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    title: string;
    similarity: number;
  }>;
}

interface ChunkRow extends Record<string, unknown> {
  content: string;
  document_id: string;
  title: string;
  similarity: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly openai: OpenAI;
  private readonly topK: number;

  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly embeddingService: EmbeddingService,
    private readonly parserService: DocumentParserService,
    private readonly configService: ConfigService,
  ) {
    const apiKey =
      this.configService.get<string>('OPENAI_API_KEY') || 'placeholder';
    this.openai = new OpenAI({ apiKey });
    this.topK = this.configService.get<number>('RAG_TOP_K') ?? 5;
  }

  // ─── Indexing ────────────────────────────────────────────────────────────────

  /**
   * Parse a document file into chunks, embed them, and store in document_chunks.
   * Called asynchronously after file upload — does NOT block the upload response.
   */
  async indexDocument(
    documentId: string,
    versionId: string,
    fileKey: string,
    mimeType: string,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Indexing document ${documentId} (version ${versionId})`);

    // Delete existing chunks for this version (idempotent re-index)
    await this.db.delete(documentChunks).where(sql`version_id = ${versionId}`);

    const chunks = await this.parserService.extractAndChunk(fileKey, mimeType);
    if (chunks.length === 0) {
      this.logger.warn(
        `No text extracted from document ${documentId}. Skipping index.`,
      );
      return;
    }

    // Batch embed all chunks
    const embeddings = await this.embeddingService.embedBatch(chunks);

    // Bulk insert
    const rows = chunks.map((content, idx) => ({
      documentId,
      versionId,
      tenantId,
      chunkIndex: idx,
      content,
      embedding: embeddings[idx],
    }));

    await this.db.insert(documentChunks).values(rows);
    this.logger.log(`Indexed ${rows.length} chunks for document ${documentId}`);
  }

  // ─── Querying ─────────────────────────────────────────────────────────────────

  /**
   * Answer a natural-language question using RAG.
   * Scope is strictly limited to the calling tenant's documents.
   */
  async ask(question: string, tenantId: string): Promise<AskResponse> {
    // 1. Embed the question
    const queryEmbedding = await this.embeddingService.embedText(question);
    const embeddingLiteral = `{${queryEmbedding.join(',')}}`;

    // 2. Cosine similarity search — tenant-scoped
    const similarityThreshold =
      this.configService.get<number>('RAG_SIMILARITY_THRESHOLD') ?? 0.5;

    const rows = await this.db.execute<ChunkRow>(sql`
      SELECT
        dc.content,
        d.id   AS document_id,
        d.title,
        cosine_similarity(dc.embedding, ${embeddingLiteral}::real[]) AS similarity
      FROM document_chunks dc
      JOIN documents d ON d.id = dc.document_id
      WHERE dc.tenant_id = ${tenantId}
        AND d.is_archived = false
        AND cosine_similarity(dc.embedding, ${embeddingLiteral}::real[]) >= ${similarityThreshold}
      ORDER BY similarity DESC
      LIMIT ${this.topK}
    `);

    const hits = rows.rows;

    if (hits.length === 0) {
      return {
        answer:
          'Tôi không tìm thấy thông tin liên quan trong các tài liệu nội bộ. Vui lòng thử đặt câu hỏi theo cách khác hoặc liên hệ IT Admin.',
        sources: [],
      };
    }

    // 3. Build context block from top-K chunks
    const context = hits
      .map((h, i) => `[Nguồn ${i + 1}: ${h.title}]\n${h.content}`)
      .join('\n\n---\n\n');

    // 4. Build prompt — strict grounding, no hallucination
    const systemPrompt = `Bạn là trợ lý hỗ trợ IT nội bộ. Hãy trả lời câu hỏi của kỹ thuật viên DỰA TRÊN tài liệu được cung cấp dưới đây và KHÔNG THÊM thông tin nào khác. Nếu thông tin không đủ, hãy nói rõ.
Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng, dạng bullet point nếu có thể.`;

    const userPrompt = `Tài liệu tham khảo:\n${context}\n\nCâu hỏi: ${question}`;

    // 5. Call LLM
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const answer =
      completion.choices[0]?.message?.content ?? 'Không có câu trả lời.';

    // 6. Deduplicate sources
    const seen = new Set<string>();
    const sources = hits
      .filter((h) => {
        if (seen.has(h.document_id)) return false;
        seen.add(h.document_id);
        return true;
      })
      .map((h) => ({
        documentId: h.document_id,
        title: h.title,
        similarity: Math.round(h.similarity * 100) / 100,
      }));

    return { answer, sources };
  }
}
