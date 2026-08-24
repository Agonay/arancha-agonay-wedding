-- ============================================
-- Migration 007: Vendor CRM
-- Vendors, contracts (files in private 'contracts' bucket)
-- and payment schedules (drive dashboard reminders).
-- ============================================

-- ============================================
-- Vendors
-- service_type is free text; UI offers a curated Spanish list.
-- ============================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'Otro',
  status TEXT NOT NULL DEFAULT 'candidato'
    CHECK (status IN ('candidato', 'contactado', 'contratado', 'descartado')),
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Contracts: documents stored in Supabase Storage
-- ('contracts' bucket, private). file_path is the object key.
-- Deleting a vendor cascades to its contracts.
-- ============================================
CREATE TABLE vendor_contracts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT,
  amount NUMERIC(12,2) CHECK (amount IS NULL OR amount >= 0),
  signed_at DATE,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Payment schedule per vendor (señas y plazos).
-- Unpaid rows drive the dashboard reminder banner.
-- ============================================
CREATE TABLE vendor_payments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  amount NUMERIC(12,2) CHECK (amount IS NULL OR amount >= 0),
  due_date DATE NOT NULL,
  paid_at DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Budget link: items can reference a managed vendor.
-- Legacy budget_items.vendor free text is kept as fallback display.
-- ============================================
ALTER TABLE budget_items
  ADD COLUMN vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_vendors_wedding ON vendors(wedding_id);
CREATE INDEX idx_vendors_service_type ON vendors(service_type);
CREATE INDEX idx_vendor_contracts_vendor ON vendor_contracts(vendor_id);
CREATE INDEX idx_vendor_payments_vendor ON vendor_payments(vendor_id);
CREATE INDEX idx_vendor_payments_due ON vendor_payments(due_date);
CREATE INDEX idx_budget_items_vendor ON budget_items(vendor_id);

-- ============================================
-- Triggers: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_contracts_updated_at
  BEFORE UPDATE ON vendor_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_payments_updated_at
  BEFORE UPDATE ON vendor_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (same model as 001-006)
-- ============================================
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to vendors"
  ON vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to vendor_contracts"
  ON vendor_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admins have full access to vendor_payments"
  ON vendor_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON TABLE vendors TO anon, authenticated, service_role;
GRANT ALL ON TABLE vendor_contracts TO anon, authenticated, service_role;
GRANT ALL ON TABLE vendor_payments TO anon, authenticated, service_role;

-- ============================================
-- Storage: private bucket for contract documents.
-- Admins log in with email+password (authenticated JWT),
-- so they can upload/download directly from the browser.
-- Guests are anonymous → no access.
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins manage contract files" ON storage.objects;
CREATE POLICY "Admins manage contract files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'contracts')
  WITH CHECK (bucket_id = 'contracts');
