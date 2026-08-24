-- ============================================
-- Migration 011: Citas (Appointments)
-- Combined agenda for vendor meetings and personal
-- appointments (pruebas del vestido, catas, trámites...).
-- reminder_*_sent_at columns drive the daily email cron
-- (/api/cron/appointment-reminders, 7d + 1d before).
-- ============================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Otro',
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'confirmada', 'realizada', 'cancelada')),
  notes TEXT,
  reminder_7d_sent_at TIMESTAMPTZ,
  reminder_1d_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_appointments_wedding ON appointments(wedding_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_vendor ON appointments(vendor_id);

-- ============================================
-- Trigger: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (same model as 001-010)
-- ============================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to appointments"
  ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON TABLE appointments TO anon, authenticated, service_role;
