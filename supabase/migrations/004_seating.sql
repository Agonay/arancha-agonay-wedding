-- ============================================
-- Migration 004: Seating
-- Tables (mesas) and guest assignments (table-level)
-- ============================================

-- ============================================
-- Tables
-- Physical tables at the reception. Name is unique per wedding.
-- ============================================
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 8,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wedding_id, name)
);

-- ============================================
-- Guests: table-level assignment
-- Deleting a table unseats its guests (SET NULL)
-- ============================================
ALTER TABLE guests
  ADD COLUMN table_id UUID REFERENCES tables(id) ON DELETE SET NULL;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_tables_wedding ON tables(wedding_id);
CREATE INDEX idx_guests_table ON guests(table_id);

-- ============================================
-- Triggers: Auto-update updated_at
-- (reuses update_updated_at_column() from migration 001)
-- ============================================
CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- Same model as migration 001: authenticated admins
-- have full access; guests go through the Next.js server.
-- ============================================
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to tables"
  ON tables FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Grants: match Supabase defaults so the Data API
-- exposes the new table like the existing ones
-- (RLS above remains the security boundary).
-- ============================================
GRANT ALL ON TABLE tables TO anon, authenticated, service_role;
