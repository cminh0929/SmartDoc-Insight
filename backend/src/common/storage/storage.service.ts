import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface IStorageService {
  uploadFile(
    file: Buffer,
    originalName: string,
    folder?: string,
  ): Promise<string>;
  deleteFile(fileKey: string): Promise<void>;
  getFilePath(fileKey: string): string;
}

@Injectable()
export class StorageService implements IStorageService {
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir =
      this.configService.get<string>('UPLOAD_DIR') || './uploads';
  }

  /**
   * Uploads a file to local storage
   * @returns The relative path/key of the stored file
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    folder: string = 'documents',
  ): Promise<string> {
    try {
      const ext = path.extname(originalName);
      const fileName = `${uuidv4()}${ext}`;
      const relativePath = path.join(folder, fileName);
      const fullPath = path.join(this.uploadDir, relativePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Write file
      await fs.writeFile(fullPath, file);

      return relativePath;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  /**
   * Deletes a file from local storage
   */
  async deleteFile(fileKey: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadDir, fileKey);
      await fs.unlink(fullPath);
    } catch (error: any) {
      // If file doesn't exist, we don't need to throw
      if (error.code !== 'ENOENT') {
        throw new InternalServerErrorException(
          `Failed to delete file: ${error.message}`,
        );
      }
    }
  }

  /**
   * Returns the absolute path of a file
   */
  getFilePath(fileKey: string): string {
    return path.join(this.uploadDir, fileKey);
  }
}
