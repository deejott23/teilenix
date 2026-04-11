-- Composite indexes for frequently joined/filtered columns
-- expense_splits: lookups by expense (when loading splits for an expense) + participant
create index if not exists idx_expense_splits_expense_participant
  on expense_splits (expense_id, participant_id);

-- packlist_checks: lookups by item + participant (checked state per person)
create index if not exists idx_packlist_checks_item_participant
  on packlist_checks (item_id, participant_id);

-- packlist_claims: lookups by item + participant (claim state per person)
create index if not exists idx_packlist_claims_item_participant
  on packlist_claims (item_id, participant_id);
