-- ============================================
-- Migration: 00008_debt_transaction_link
-- Link debt repayments to transactions
-- ============================================

-- 1. Add debt_id FK to transactions table
ALTER TABLE transactions
  ADD COLUMN debt_id UUID REFERENCES debts(id) ON DELETE SET NULL;

-- 2. Index for efficient lookup of payments by debt
CREATE INDEX idx_transactions_debt ON transactions(debt_id) WHERE debt_id IS NOT NULL;

-- 3. Add reminder_days_before to debts table
ALTER TABLE debts
  ADD COLUMN reminder_days_before INT NOT NULL DEFAULT 3;

-- 4. Expand notification type constraint to include debt_reminder and debt_payoff
-- First drop the existing check constraint on the type column
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'bill_reminder',
    'budget_warning',
    'budget_exceeded',
    'goal_milestone',
    'recurring_due',
    'system',
    'debt_reminder',
    'debt_payoff'
  ));
