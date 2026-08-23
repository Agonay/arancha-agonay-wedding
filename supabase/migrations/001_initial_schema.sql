-- ============================================
-- Migration 001: Initial Schema
-- Core tables for wedding, invitations, guests, RSVPs
-- ============================================

-- Enable UUID extension (must be done first, requires superuser)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Set search path so extensions.uuid_generate_v4() is available
SET search_path = public, extensions;

-- ============================================
-- Weddings
-- Single row for now, but provides clean config storage
-- ============================================
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  couple_names TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  lifecycle_state TEXT NOT NULL DEFAULT 'planning',
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Guest Groups
-- Logical groupings (Bride Family, Groom Friends, etc.)
-- ============================================
CREATE TABLE guest_groups (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wedding_id, name)
);

-- ============================================
-- Invitations
-- Each invitation has a unique secure token
-- ============================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_wedding ON invitations(wedding_id);

-- ============================================
-- Guests
-- Individual people
-- ============================================
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT,
  group_id UUID REFERENCES guest_groups(id) ON DELETE SET NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guests_wedding ON guests(wedding_id);
CREATE INDEX idx_guests_group ON guests(group_id);

-- ============================================
-- Invitation Guests (Join Table)
-- Many-to-many: one invitation can include multiple guests
-- ============================================
CREATE TABLE invitation_guests (
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (invitation_id, guest_id)
);

-- ============================================
-- RSVPs
-- One row per guest with individual preferences
-- ============================================
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  attendance TEXT,
  plus_one_name TEXT,
  dietary_requirements JSONB,
  dietary_notes TEXT,
  transport_required BOOLEAN,
  transport_notes TEXT,
  accommodation_notes TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(guest_id)
);

CREATE INDEX idx_rsvps_guest ON rsvps(guest_id);
CREATE INDEX idx_rsvps_attendance ON rsvps(attendance);

-- ============================================
-- Trigger: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weddings_updated_at
  BEFORE UPDATE ON weddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at
  BEFORE UPDATE ON rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- Only authenticated admins can access data
-- Guests access data through Next.js server (service role)
-- ============================================
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Admin policy: authenticated users (Supabase Auth) have full access
CREATE POLICY "Admins have full access to weddings"
  ON weddings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to guest_groups"
  ON guest_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to invitations"
  ON invitations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to guests"
  ON guests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to invitation_guests"
  ON invitation_guests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins have full access to rsvps"
  ON rsvps FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public: no direct access (guests go through server)
-- This is defense-in-depth. The real security boundary is the Next.js server.
