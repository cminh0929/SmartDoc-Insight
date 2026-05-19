-- Migration: Create document_chunks table with native embedding similarity function
-- Requires ZERO extensions (fully compatible with default Windows PostgreSQL installations)

-- 1. Create native cosine similarity function if it doesn't exist
CREATE OR REPLACE FUNCTION cosine_similarity(a real[], b real[])
RETURNS double precision AS $$
DECLARE
  dot_product double precision := 0;
  norm_a double precision := 0;
  norm_b double precision := 0;
  i integer;
  len integer;
BEGIN
  len := array_length(a, 1);
  IF len IS NULL OR array_length(b, 1) IS NULL OR len <> array_length(b, 1) THEN
    RETURN 0;
  END IF;
  
  FOR i IN 1..len LOOP
    dot_product := dot_product + (a[i] * b[i]);
    norm_a := norm_a + (a[i] * a[i]);
    norm_b := norm_b + (b[i] * b[i]);
  END LOOP;
  
  IF norm_a = 0 OR norm_b = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN dot_product / (sqrt(norm_a) * sqrt(norm_b));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Create document_chunks table using real[] instead of vector(1536)
CREATE TABLE IF NOT EXISTS document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id   UUID REFERENCES document_versions(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  chunk_index  INTEGER NOT NULL,
  content      TEXT NOT NULL,
  embedding    real[],
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Index for tenant-scoped lookups
CREATE INDEX IF NOT EXISTS document_chunks_tenant_idx
  ON document_chunks (tenant_id, document_id);
