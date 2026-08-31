-- ============================================
-- Migration 012: Music System
-- Couple's curated playlist (moment categories +
-- schedule event links) + guest song proposals
-- (wedding day only, real-time DJ queue).
-- Feature flag for wedding day mode toggle.
-- ============================================

-- ============================================
-- Music Playlist (couple's curated songs)
-- ============================================
CREATE TABLE music_playlist (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  spotify_url TEXT,
  youtube_url TEXT,
  deezer_url TEXT,
  album_art_url TEXT,
  moment_category TEXT NOT NULL DEFAULT 'general'
    CHECK (moment_category IN ('ceremonia', 'cocktail', 'cena', 'primer-baile', 'fiesta', 'cierre', 'general')),
  schedule_event_id UUID REFERENCES schedule_events(id) ON DELETE SET NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_music_playlist_wedding ON music_playlist(wedding_id);
CREATE INDEX idx_music_playlist_category ON music_playlist(moment_category);
CREATE INDEX idx_music_playlist_event ON music_playlist(schedule_event_id);

-- ============================================
-- Song Proposals (guest suggestions, wedding day)
-- ============================================
CREATE TABLE song_proposals (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  spotify_url TEXT,
  youtube_url TEXT,
  deezer_url TEXT,
  album_art_url TEXT,
  moment_category TEXT NOT NULL DEFAULT 'fiesta'
    CHECK (moment_category IN ('ceremonia', 'cocktail', 'cena', 'primer-baile', 'fiesta', 'cierre', 'general')),
  guest_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'queued', 'played', 'skipped', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_song_proposals_wedding ON song_proposals(wedding_id);
CREATE INDEX idx_song_proposals_guest ON song_proposals(guest_id);
CREATE INDEX idx_song_proposals_status ON song_proposals(status);

-- ============================================
-- Feature Flags (wedding day mode toggle, etc.)
-- ============================================
CREATE TABLE feature_flags (
  key TEXT PRIMARY KEY,
  value BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial feature flags
INSERT INTO feature_flags (key, value) VALUES
  ('wedding_day_mode', false),
  ('music_proposals_open', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Triggers: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_music_playlist_updated_at
  BEFORE UPDATE ON music_playlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_song_proposals_updated_at
  BEFORE UPDATE ON song_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE music_playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- music_playlist: admins full access, anon read-only (guest display)
CREATE POLICY "Admins have full access to music_playlist"
  ON music_playlist FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon can read music_playlist"
  ON music_playlist FOR SELECT TO anon USING (true);

-- song_proposals: admins full access, anon can insert (proposal form) and read own
CREATE POLICY "Admins have full access to song_proposals"
  ON song_proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon can insert song_proposals"
  ON song_proposals FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can read song_proposals"
  ON song_proposals FOR SELECT TO anon USING (true);

-- feature_flags: admins full access, anon read-only
CREATE POLICY "Admins have full access to feature_flags"
  ON feature_flags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon can read feature_flags"
  ON feature_flags FOR SELECT TO anon USING (true);

GRANT ALL ON TABLE music_playlist TO anon, authenticated, service_role;
GRANT ALL ON TABLE song_proposals TO anon, authenticated, service_role;
GRANT ALL ON TABLE feature_flags TO anon, authenticated, service_role;

-- ============================================
-- Enable Realtime for song_proposals (DJ queue)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE song_proposals;
