-- Migration: Enable pgvector and create document_chunks table
-- Run this ONCE on the database before starting the RAG module.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id   UUID REFERENCES document_versions(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  chunk_index  INTEGER NOT NULL,
  content      TEXT NOT NULL,
  embedding    vector(1536),
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- 4. Index for tenant-scoped lookups
CREATE INDEX IF NOT EXISTS document_chunks_tenant_idx
  ON document_chunks (tenant_id, document_id);
