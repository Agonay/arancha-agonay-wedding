-- ============================================
-- Migration 010: Per-guest plus-one permission
-- The "Voy acompañado/a" checkbox in the RSVP form
-- only appears for guests with plus_one_allowed = true
-- ============================================

ALTER TABLE guests
  ADD COLUMN plus_one_allowed BOOLEAN NOT NULL DEFAULT false;

-- Preserve plus-one ability for guests who already have +1 data
UPDATE guests
SET plus_one_allowed = true
WHERE id IN (
  SELECT guest_id FROM rsvps
  WHERE plus_one_name IS NOT NULL OR plus_one_dietary_notes IS NOT NULL
);
