-- Migration 002: RSVP notification flag
-- Allows admin to see which RSVPs were updated since last check

ALTER TABLE rsvps
  ADD COLUMN IF NOT EXISTS admin_notified BOOLEAN NOT NULL DEFAULT false;
