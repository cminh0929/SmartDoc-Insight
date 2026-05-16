import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';

export abstract class BaseService<T> {
  constructor(
    protected readonly db: NodePgDatabase<typeof schema>,
    protected readonly table: any,
  ) {}

  async findAll() {
    try {
      return await this.db.select().from(this.table);
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to fetch records: ${error.message}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const results = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .limit(1);

      if (results.length === 0) {
        throw new NotFoundException(`Record with ID ${id} not found`);
      }

      return results[0];
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch record: ${error.message}`,
      );
    }
  }

  async create(data: any) {
    try {
      const results = (await this.db
        .insert(this.table)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()) as any[];

      return results[0];
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to create record: ${error.message}`,
      );
    }
  }

  async update(id: string, data: any) {
    try {
      const results = (await this.db
        .update(this.table)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(this.table.id, id))
        .returning()) as any[];

      if (results.length === 0) {
        throw new NotFoundException(`Record with ID ${id} not found`);
      }

      return results[0];
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to update record: ${error.message}`,
      );
    }
  }

  async remove(id: string) {
    try {
      const results = (await this.db
        .delete(this.table)
        .where(eq(this.table.id, id))
        .returning()) as any[];

      if (results.length === 0) {
        throw new NotFoundException(`Record with ID ${id} not found`);
      }

      return results[0];
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to delete record: ${error.message}`,
      );
    }
  }
}
