-- ============================================
-- Migration 016: Contract documents (one contract -> many files)
--
-- A contract can now hold multiple documents (e.g. the venue booking
-- PDF and the catering PDF on the single menu contract) instead of a
-- single file_path. We backfill the old single file into a document
-- row and drop the now-redundant column.
-- ============================================

CREATE TABLE vendor_contract_documents (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES vendor_contracts(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_contract_docs_contract ON vendor_contract_documents(contract_id);

-- Backfill existing single-file contracts into the new model.
INSERT INTO vendor_contract_documents (contract_id, file_path, file_name)
SELECT id, file_path, NULL
FROM vendor_contracts
WHERE file_path IS NOT NULL;

ALTER TABLE vendor_contracts DROP COLUMN file_path;

-- ============================================
-- RLS (same model as vendors)
-- ============================================
ALTER TABLE vendor_contract_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to vendor_contract_documents"
  ON vendor_contract_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON TABLE vendor_contract_documents TO anon, authenticated, service_role;
