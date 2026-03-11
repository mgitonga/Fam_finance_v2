-- Migration: Account-Transaction Linking
-- Adds transfer and adjustment transaction types, to_account_id for transfers,
-- and relaxes category_id requirement for transfers/adjustments.

-- 1. Add to_account_id column for transfer destination
ALTER TABLE transactions
  ADD COLUMN to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT;

-- 2. Allow 'transfer' and 'adjustment' types
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('income', 'expense', 'transfer', 'adjustment'));

-- 3. Transfer must have to_account_id, others must not
ALTER TABLE transactions
  ADD CONSTRAINT transactions_transfer_check
    CHECK (
      (type = 'transfer' AND to_account_id IS NOT NULL AND to_account_id != account_id)
      OR (type != 'transfer' AND to_account_id IS NULL)
    );

-- 4. Make category_id nullable (transfers and adjustments don't need a category)
ALTER TABLE transactions
  ALTER COLUMN category_id DROP NOT NULL;

-- 5. Ensure income/expense still require a category
ALTER TABLE transactions
  ADD CONSTRAINT transactions_category_check
    CHECK (
      type IN ('transfer', 'adjustment') OR category_id IS NOT NULL
    );

-- 6. Index for efficient lookups on to_account_id
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id) WHERE to_account_id IS NOT NULL;
