-- ============================================
-- Migration 015: Link budget items <-> supplier contracts & payments
-- 1) vendor_contracts.budget_item_id : marks a contract as auto-synced
--    from a budget line (its amount is derived from the budget formula).
-- 2) vendor_payments.budget_item_id  : attaches a payment to a specific
--    budget line so the budget item's "Pagado" can be derived precisely
--    (no double counting when one vendor has several budget lines).
-- Both are ON DELETE SET NULL so unlinking/deleting a budget line never
-- destroys supplier data.
-- ============================================

ALTER TABLE vendor_contracts
  ADD COLUMN budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL;

ALTER TABLE vendor_payments
  ADD COLUMN budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL;

CREATE INDEX idx_vendor_contracts_budget_item ON vendor_contracts(budget_item_id);
CREATE INDEX idx_vendor_payments_budget_item ON vendor_payments(budget_item_id);
