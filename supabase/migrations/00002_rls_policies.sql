-- ============================================
-- FamFin RLS Policies
-- Migration: 00002_rls_policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE overall_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper functions
-- ============================================
CREATE OR REPLACE FUNCTION auth.household_id()
RETURNS UUID AS $$
  SELECT household_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- HOUSEHOLDS
-- ============================================
CREATE POLICY "Users can view own household"
  ON households FOR SELECT
  USING (id = auth.household_id());

CREATE POLICY "Admins can update own household"
  ON households FOR UPDATE
  USING (id = auth.household_id() AND auth.user_role() = 'admin');

-- ============================================
-- USERS
-- ============================================
CREATE POLICY "Users can view household members"
  ON users FOR SELECT
  USING (household_id = auth.household_id());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can update household members"
  ON users FOR UPDATE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Allow user profile creation"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================
-- ACCOUNTS
-- ============================================
CREATE POLICY "Users can view household accounts"
  ON accounts FOR SELECT
  USING (household_id = auth.household_id());

CREATE POLICY "Admins can create accounts"
  ON accounts FOR INSERT
  WITH CHECK (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can update accounts"
  ON accounts FOR UPDATE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can delete accounts"
  ON accounts FOR DELETE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

-- ============================================
-- CATEGORIES
-- ============================================
CREATE POLICY "Users can view household categories"
  ON categories FOR SELECT
  USING (household_id = auth.household_id());

CREATE POLICY "Admins can create categories"
  ON categories FOR INSERT
  WITH CHECK (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE POLICY "Users can view household transactions"
  ON transactions FOR SELECT
  USING (household_id = auth.household_id());

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (household_id = auth.household_id() AND user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (
    household_id = auth.household_id()
    AND (user_id = auth.uid() OR auth.user_role() = 'admin')
  );

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (
    household_id = auth.household_id()
    AND (user_id = auth.uid() OR auth.user_role() = 'admin')
  );

-- ============================================
-- BUDGETS
-- ============================================
CREATE POLICY "Users can view household budgets"
  ON budgets FOR SELECT
  USING (household_id = auth.household_id());

CREATE POLICY "Admins can create budgets"
  ON budgets FOR INSERT
  WITH CHECK (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can update budgets"
  ON budgets FOR UPDATE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can delete budgets"
  ON budgets FOR DELETE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

-- ============================================
-- OVERALL BUDGETS
-- ============================================
CREATE POLICY "Users can view overall budgets"
  ON overall_budgets FOR SELECT
  USING (household_id = auth.household_id());

CREATE POLICY "Admins can create overall budgets"
  ON overall_budgets FOR INSERT
  WITH CHECK (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can update overall budgets"
  ON overall_budgets FOR UPDATE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can delete overall budgets"
  ON overall_budgets FOR DELETE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

-- ============================================
-- RECURRING TRANSACTIONS
-- ============================================
CREATE POLICY "Users can view recurring transactions"
  ON recurring_transactions FOR SELECT
  USING (household_id = auth.household_id());

CREATE POLICY "Admins can create recurring transactions"
  ON recurring_transactions FOR INSERT
  WITH CHECK (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can update recurring transactions"
  ON recurring_transactions FOR UPDATE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can delete recurring transactions"
  ON recurring_transactions FOR DELETE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

-- ============================================
-- SAVINGS GOALS
-- ============================================
CREATE POLICY "Users can view savings goals"
  ON savings_goals FOR SELECT
  USING (household_id = auth.household_id());

CREATE POLICY "Admins can create savings goals"
  ON savings_goals FOR INSERT
  WITH CHECK (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can update savings goals"
  ON savings_goals FOR UPDATE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can delete savings goals"
  ON savings_goals FOR DELETE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

-- ============================================
-- GOAL CONTRIBUTIONS
-- ============================================
CREATE POLICY "Users can view goal contributions"
  ON goal_contributions FOR SELECT
  USING (
    goal_id IN (
      SELECT id FROM savings_goals WHERE household_id = auth.household_id()
    )
  );

CREATE POLICY "Users can add contributions"
  ON goal_contributions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND goal_id IN (
      SELECT id FROM savings_goals WHERE household_id = auth.household_id()
    )
  );

-- ============================================
-- DEBTS
-- ============================================
CREATE POLICY "Users can view household debts"
  ON debts FOR SELECT
  USING (household_id = auth.household_id());

CREATE POLICY "Admins can create debts"
  ON debts FOR INSERT
  WITH CHECK (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can update debts"
  ON debts FOR UPDATE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can delete debts"
  ON debts FOR DELETE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

-- ============================================
-- BILL REMINDERS
-- ============================================
CREATE POLICY "Users can view bill reminders"
  ON bill_reminders FOR SELECT
  USING (household_id = auth.household_id());

CREATE POLICY "Admins can create bill reminders"
  ON bill_reminders FOR INSERT
  WITH CHECK (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can update bill reminders"
  ON bill_reminders FOR UPDATE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

CREATE POLICY "Admins can delete bill reminders"
  ON bill_reminders FOR DELETE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (household_id = auth.household_id());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKET: Receipts
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view household receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins can delete household receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
    AND auth.user_role() = 'admin'
  );
