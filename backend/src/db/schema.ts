import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  boolean,
  pgEnum,
  index,
  customType,
} from 'drizzle-orm/pg-core';

// Custom type mapping to native real[] (compatible without pgvector extension)
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'real[]';
  },
  toDriver(value: number[]): string {
    return `{${value.join(',')}}`;
  },
  fromDriver(value: string): number[] {
    return value.replace(/[{}]/g, '').split(',').map(Number);
  },
});

// Custom type for PostgreSQL tsvector
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }),
  tenantCode: varchar('tenant_code', { length: 10 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userRoleEnum = pgEnum('user_role', ['admin', 'intern', 'staff']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  password: text('password'),
  googleId: varchar('google_id', { length: 255 }),
  provider: varchar('provider', { length: 50 }).default('local').notNull(),
  role: varchar('role', { length: 255 }).default('intern').notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  canCreateRootFolders: boolean('can_create_root_folders')
    .default(false)
    .notNull(),
  canUploadRootDocs: boolean('can_upload_root_docs').default(false).notNull(),
  canViewAuditLogs: boolean('can_view_audit_logs').default(false).notNull(),
  canManageSharing: boolean('can_manage_sharing').default(false).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: uuid('parent_id'),
  description: text('description'),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    folderId: uuid('folder_id').references(() => folders.id),
    ownerId: uuid('owner_id')
      .references(() => users.id)
      .notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    searchVector: tsvector('search_vector'), // Full-Text Search vector
    tenantId: uuid('tenant_id').references(() => tenants.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    searchIndex: index('search_index').using('gin', table.searchVector),
  }),
);

export const documentVersions = pgTable('document_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .references(() => documents.id)
    .notNull(),
  versionNumber: integer('version_number').notNull(),
  fileKey: text('file_key').notNull(), // File path/key (local or cloud)
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedById: uuid('uploaded_by_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
});

export const documentTags = pgTable('document_tags', {
  documentId: uuid('document_id')
    .references(() => documents.id)
    .notNull(),
  tagId: uuid('tag_id')
    .references(() => tags.id)
    .notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const permissionLevelEnum = pgEnum('permission_level', [
  'read',
  'write',
  'admin',
]);

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  documentId: uuid('document_id').references(() => documents.id, {
    onDelete: 'cascade',
  }),
  folderId: uuid('folder_id').references(() => folders.id, {
    onDelete: 'cascade',
  }),
  level: permissionLevelEnum('level').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RAG: Document chunks with vector embeddings
export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  versionId: uuid('version_id').references(() => documentVersions.id, {
    onDelete: 'cascade',
  }),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
