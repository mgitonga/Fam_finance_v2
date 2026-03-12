-- Migration: Savings Goals as Pots
-- Extends goal_contributions with account linkage and deposit/withdrawal direction.
-- Updates the trigger to handle withdrawals (subtract from current_amount).

-- 1. Add account_id and type columns to goal_contributions
ALTER TABLE goal_contributions
  ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  ADD COLUMN type TEXT NOT NULL DEFAULT 'deposit'
    CHECK (type IN ('deposit', 'withdrawal'));

-- 2. Index for efficient lookups
CREATE INDEX idx_goal_contributions_account ON goal_contributions(account_id)
  WHERE account_id IS NOT NULL;

-- 3. Update trigger function to handle withdrawals
CREATE OR REPLACE FUNCTION update_goal_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE savings_goals
  SET current_amount = (
    SELECT COALESCE(SUM(
      CASE WHEN gc.type = 'deposit' THEN gc.amount ELSE -gc.amount END
    ), 0)
    FROM goal_contributions gc
    WHERE gc.goal_id = NEW.goal_id
  )
  WHERE id = NEW.goal_id;

  -- Auto-complete goal if target reached
  UPDATE savings_goals
  SET is_completed = TRUE
  WHERE id = NEW.goal_id
    AND current_amount >= target_amount
    AND is_completed = FALSE;

  -- Re-open goal if withdrawn below target
  UPDATE savings_goals
  SET is_completed = FALSE
  WHERE id = NEW.goal_id
    AND current_amount < target_amount
    AND is_completed = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
