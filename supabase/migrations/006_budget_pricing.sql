-- ============================================
-- Migration 006: Budget pricing modes
-- Per-guest pricing (por comensal) with IVA support.
-- - pricing_mode='total'      → amounts entered manually (as before)
-- - pricing_mode='per_guest'  → estimated/actual are computed server-side:
--     total = unit_price × guest_count, with `units_with_iva` units taxed
--     at `iva_rate`% and the rest sin IVA.
-- ============================================

ALTER TABLE budget_items
  ADD COLUMN pricing_mode TEXT NOT NULL DEFAULT 'total'
    CHECK (pricing_mode IN ('total', 'per_guest')),
  ADD COLUMN unit_price NUMERIC(12,2)
    CHECK (unit_price IS NULL OR unit_price >= 0),
  ADD COLUMN guest_count NUMERIC(7,2)
    CHECK (guest_count IS NULL OR guest_count >= 0),
  ADD COLUMN iva_rate NUMERIC(5,2)
    CHECK (iva_rate IS NULL OR (iva_rate >= 0 AND iva_rate <= 100)),
  ADD COLUMN units_with_iva INTEGER
    CHECK (units_with_iva IS NULL OR units_with_iva >= 0);
