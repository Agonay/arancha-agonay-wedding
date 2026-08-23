-- ============================================
-- Migration 003: Logistics
-- Venues, schedule/timeline, transport, accommodations
-- ============================================

-- ============================================
-- Venues
-- Physical locations (ceremony, cocktail, reception...)
-- ============================================
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'otro', -- ceremonia | coctel | banquete | otro
  address TEXT,
  maps_url TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Schedule Events
-- Day-of timeline. DATE + TIME (no timestamptz) to
-- avoid timezone ambiguity between input and display.
-- ============================================
CREATE TABLE schedule_events (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  icon TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true, -- visible on guest invitation page
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Transport Options
-- Buses/shuttles offered to guests
-- ============================================
CREATE TABLE transport_options (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'ida', -- ida | vuelta | ida_vuelta
  origin TEXT,
  destination TEXT,
  departure_time TIME,
  return_time TIME,
  capacity INTEGER,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Accommodations
-- Hotel blocks for guests
-- ============================================
CREATE TABLE accommodations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  hotel_name TEXT NOT NULL,
  address TEXT,
  booking_code TEXT,
  phone TEXT,
  price_note TEXT,
  check_in DATE,
  check_out DATE,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RSVPs: link a guest to an assigned transport option
-- ============================================
ALTER TABLE rsvps
  ADD COLUMN transport_option_id UUID REFERENCES transport_options(id) ON DELETE SET NULL;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_venues_wedding ON venues(wedding_id);
CREATE INDEX idx_schedule_events_wedding ON schedule_events(wedding_id);
CREATE INDEX idx_schedule_events_venue ON schedule_events(venue_id);
CREATE INDEX idx_transport_options_wedding ON transport_options(wedding_id);
CREATE INDEX idx_accommodations_wedding ON accommodations(wedding_id);
CREATE INDEX idx_rsvps_transport_option ON rsvps(transport_option_id);

-- ============================================
-- Triggers: Auto-update updated_at
-- (reuses update_updated_at_column() from migration 001)
-- ============================================
CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_events_updated_at
  BEFORE UPDATE ON schedule_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transport_options_updated_at
  BEFORE UPDATE ON transport_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accommodations_updated_at
  BEFORE UPDATE ON accommodations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- Same model as migration 001: authenticated admins
-- have full access; guests go through the Next.js server.
-- ============================================
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to venues"
  ON venues FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to schedule_events"
  ON schedule_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to transport_options"
  ON transport_options FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to accommodations"
  ON accommodations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Grants: match Supabase defaults so the Data API
-- exposes the new tables like the existing ones
-- (RLS above remains the security boundary).
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE venues TO anon, authenticated, service_role;
GRANT ALL ON TABLE schedule_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE transport_options TO anon, authenticated, service_role;
GRANT ALL ON TABLE accommodations TO anon, authenticated, service_role;
