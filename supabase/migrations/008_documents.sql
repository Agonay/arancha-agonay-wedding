-- ============================================
-- Migration 008: Document vault (Documentos)
-- General wedding document library: invoices, receipts,
-- contracts, insurance… Files live in the private
-- 'documents' Storage bucket; rows may link to a vendor
-- and/or a budget item.
-- ============================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Otro',
  file_path TEXT NOT NULL,
  amount NUMERIC(12,2) CHECK (amount IS NULL OR amount >= 0),
  doc_date DATE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_documents_wedding ON documents(wedding_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_vendor ON documents(vendor_id);
CREATE INDEX idx_documents_budget_item ON documents(budget_item_id);

-- ============================================
-- Triggers: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (same model as 001-007)
-- ============================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to documents"
  ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON TABLE documents TO anon, authenticated, service_role;

-- ============================================
-- Storage: private bucket for general documents.
-- Same access model as 'contracts': logged-in admins only.
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins manage document files" ON storage.objects;
CREATE POLICY "Admins manage document files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');
