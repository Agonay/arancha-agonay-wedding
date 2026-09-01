-- ============================================
-- Migration 017: Link documents to contracts
-- Adds documents.contract_id so a document in the
-- vault (Documentos) can be associated with a
-- specific vendor contract when applicable.
-- Contract documents uploaded via the vendor page
-- (vendor_contract_documents) are surfaced on the
-- Documentos page at read time.
-- ============================================

ALTER TABLE documents
  ADD COLUMN contract_id UUID REFERENCES vendor_contracts(id) ON DELETE SET NULL;

CREATE INDEX idx_documents_contract ON documents(contract_id);
