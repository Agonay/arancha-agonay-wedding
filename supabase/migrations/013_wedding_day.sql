-- ============================================
-- Migration 013: Wedding Day Mode
-- Guest check-in tracking + incident logging
-- for wedding-day operations dashboard.
-- ============================================

-- ============================================
-- Guest check-in timestamp
-- ============================================
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

CREATE INDEX idx_guests_checked_in ON guests(checked_in_at);

-- ============================================
-- Incidents (coordinator log)
-- ============================================
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_wedding ON incidents(wedding_id);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_resolved ON incidents(resolved_at);

-- ============================================
-- Triggers: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to incidents"
  ON incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon cannot access incidents"
  ON incidents FOR SELECT TO anon USING (false);

GRANT ALL ON TABLE incidents TO authenticated, service_role;
GRANT SELECT ON TABLE incidents TO anon;

-- ============================================
-- Enable Realtime for incidents
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;

-- Enable Realtime for guests (live check-in updates)
ALTER PUBLICATION supabase_realtime ADD TABLE guests;
