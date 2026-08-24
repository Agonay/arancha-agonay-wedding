-- ============================================
-- Migration 009: RSVP plus-one fields
-- Structured +1 companion: name already existed
-- (plus_one_name); adds its own dietary notes.
-- Drops transport_notes (replaced by admin-side
-- transport assignment in /admin/transport).
-- ============================================

ALTER TABLE rsvps ADD COLUMN plus_one_dietary_notes TEXT;

ALTER TABLE rsvps DROP COLUMN transport_notes;
