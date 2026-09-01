-- ============================================
-- Migration 018: Link documents to vendor payments
-- Adds documents.payment_id so a document (e.g. an
-- invoice) can be associated with a recorded vendor
-- payment; the document's amount then comes from
-- that payment and sums into 'Importe registrado'.
-- ============================================

ALTER TABLE documents
  ADD COLUMN payment_id UUID REFERENCES vendor_payments(id) ON DELETE SET NULL;

CREATE INDEX idx_documents_payment ON documents(payment_id);
