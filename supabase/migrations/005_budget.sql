-- ============================================
-- Migration 005: Budget
-- Categories and line items for wedding budget tracking.
-- Amounts in EUR (NUMERIC(12,2)). paid_amount covers deposits (señas).
-- ============================================

-- ============================================
-- Budget categories
-- Name is unique per wedding.
-- ============================================
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wedding_id, name)
);

-- ============================================
-- Budget items (conceptos / gastos)
-- Deleting a category keeps its items (category_id = NULL).
-- ============================================
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  vendor TEXT,
  estimated_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (estimated_amount >= 0),
  actual_amount NUMERIC(12,2) CHECK (actual_amount IS NULL OR actual_amount >= 0),
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  due_date DATE,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_budget_categories_wedding ON budget_categories(wedding_id);
CREATE INDEX idx_budget_items_wedding ON budget_items(wedding_id);
CREATE INDEX idx_budget_items_category ON budget_items(category_id);
CREATE INDEX idx_budget_items_due_date ON budget_items(due_date);

-- ============================================
-- Triggers: Auto-update updated_at
-- (reuses update_updated_at_column() from migration 001)
-- ============================================
CREATE TRIGGER update_budget_categories_updated_at
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- Same model as migrations 001-004: authenticated admins
-- have full access; guests never touch budget data.
-- ============================================
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to budget_categories"
  ON budget_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to budget_items"
  ON budget_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Grants: match Supabase defaults so the Data API
-- exposes the new tables like the existing ones
-- (RLS above remains the security boundary).
-- ============================================
GRANT ALL ON TABLE budget_categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE budget_items TO anon, authenticated, service_role;
