import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '../../common/storage/storage.service';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 64,
    separators: ['\n\n', '\n', '. ', '? ', '! ', ' ', ''],
  });

  constructor(private readonly storageService: StorageService) {}

  /**
   * Extract raw text from a file and split into chunks.
   * @param fileKey - relative path stored in document_versions.file_key
   * @param mimeType - MIME type to choose the correct parser
   * @returns Array of text chunks ready for embedding
   */
  async extractAndChunk(fileKey: string, mimeType: string): Promise<string[]> {
    const filePath = this.storageService.getFilePath(fileKey);

    let rawText = '';

    try {
      if (mimeType === 'application/pdf') {
        rawText = await this.extractPdf(filePath);
      } else if (
        mimeType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        rawText = await this.extractDocx(filePath);
      } else if (mimeType.startsWith('text/')) {
        rawText = fs.readFileSync(filePath, 'utf8');
      } else {
        this.logger.warn(`Unsupported MIME type for RAG: ${mimeType}. Skipping.`);
        return [];
      }
    } catch (error: any) {
      this.logger.error(`Failed to extract text from ${fileKey}: ${error.message}`);
      return [];
    }

    if (!rawText.trim()) return [];

    const chunks = await this.splitter.splitText(rawText);
    this.logger.log(
      `Extracted ${chunks.length} chunks from ${path.basename(fileKey)} (${mimeType})`,
    );
    return chunks;
  }

  private async extractPdf(filePath: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);
    return result.text;
  }

  private async extractDocx(filePath: string): Promise<string> {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
}
