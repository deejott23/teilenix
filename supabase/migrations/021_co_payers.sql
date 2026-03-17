-- Add co_payers column to expenses for multi-payer support
-- co_payers is a JSONB array: [{participant_id: uuid, amount_cents: int}]
-- When null/empty: full amount paid by paid_by_participant_id
-- When set: each entry records how much a secondary payer contributed;
--           primary payer paid (amount_cents - sum of co_payer amounts)

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS co_payers JSONB;
