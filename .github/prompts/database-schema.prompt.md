# Database Schema — FamFin

## Overview

This prompt contains the complete PostgreSQL schema for FamFin, including all 13 tables, constraints, indexes, triggers, and seed data. Execute these as Supabase migration files.

## References

- Specification Document: `Documentation/Specification Document.md` §5.2 (Table Definitions)
- Appendix A: Default Categories

---

## Migration 1: Core Schema (`supabase/migrations/00001_initial_schema.sql`)

```sql
-- ============================================
-- FamFin Database Schema
-- Migration: 00001_initial_schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. HOUSEHOLDS
-- ============================================
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  primary_currency VARCHAR(3) NOT NULL DEFAULT 'KES',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. USERS (profiles linked to auth.users)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'contributor'
    CHECK (role IN ('admin', 'contributor')),
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_household ON users(household_id);

-- ============================================
-- 3. ACCOUNTS
-- ============================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('bank', 'mobile_money', 'cash', 'credit_card', 'other')),
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_household ON accounts(household_id);

-- ============================================
-- 4. CATEGORIES (with parent-child hierarchy)
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  type VARCHAR(10) NOT NULL DEFAULT 'expense'
    CHECK (type IN ('expense', 'income', 'both')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_household ON categories(household_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ============================================
-- 5. TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type VARCHAR(10) NOT NULL
    CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  description TEXT,
  merchant VARCHAR(200),
  payment_method VARCHAR(20)
    CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'bank_transfer', 'other')),
  tags TEXT[],
  receipt_url TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_id UUID,
  split_with UUID REFERENCES users(id),
  split_ratio DECIMAL(3,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_household ON transactions(household_id);
CREATE INDEX idx_transactions_date ON transactions(household_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(household_id, category_id);
CREATE INDEX idx_transactions_account ON transactions(household_id, account_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(household_id, type);

-- ============================================
-- 6. BUDGETS (per-category monthly)
-- ============================================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (household_id, category_id, month, year)
);

CREATE INDEX idx_budgets_household_period ON budgets(household_id, year, month);

-- ============================================
-- 7. OVERALL BUDGETS (monthly cap)
-- ============================================
CREATE TABLE overall_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (household_id, month, year)
);

-- ============================================
-- 8. RECURRING TRANSACTIONS
-- ============================================
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  type VARCHAR(10) NOT NULL
    CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  frequency VARCHAR(20) NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('monthly')),
  day_of_month INT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  next_due_date DATE NOT NULL,
  description VARCHAR(200) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_household ON recurring_transactions(household_id);
CREATE INDEX idx_recurring_next_due ON recurring_transactions(next_due_date) WHERE is_active = TRUE;

-- Add FK from transactions to recurring_transactions (after table exists)
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_recurring
  FOREIGN KEY (recurring_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL;

-- ============================================
-- 9. SAVINGS GOALS
-- ============================================
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  target_date DATE NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_savings_goals_household ON savings_goals(household_id);

-- ============================================
-- 10. GOAL CONTRIBUTIONS
-- ============================================
CREATE TABLE goal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goal_contributions_goal ON goal_contributions(goal_id);

-- ============================================
-- 11. DEBTS
-- ============================================
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('mortgage', 'car_loan', 'personal_loan', 'credit_card', 'student_loan', 'other')),
  original_amount DECIMAL(15,2) NOT NULL CHECK (original_amount > 0),
  outstanding_balance DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2),
  minimum_payment DECIMAL(15,2),
  payment_day INT CHECK (payment_day BETWEEN 1 AND 31),
  start_date DATE NOT NULL,
  projected_payoff_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_debts_household ON debts(household_id);

-- ============================================
-- 12. BILL REMINDERS
-- ============================================
CREATE TABLE bill_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2),
  due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  reminder_days_before INT NOT NULL DEFAULT 3,
  notification_method VARCHAR(10) NOT NULL DEFAULT 'both'
    CHECK (notification_method IN ('in_app', 'email', 'both')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bill_reminders_household ON bill_reminders(household_id);

-- ============================================
-- 13. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL
    CHECK (type IN ('bill_reminder', 'budget_warning', 'budget_exceeded', 'goal_milestone', 'recurring_due', 'system')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_household ON notifications(household_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on transactions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'contributor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Auto-update savings_goals.current_amount on contribution insert
CREATE OR REPLACE FUNCTION update_goal_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE savings_goals
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM goal_contributions
    WHERE goal_id = NEW.goal_id
  )
  WHERE id = NEW.goal_id;

  -- Auto-complete goal if target reached
  UPDATE savings_goals
  SET is_completed = TRUE
  WHERE id = NEW.goal_id
    AND current_amount >= target_amount
    AND is_completed = FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_goal_contribution
  AFTER INSERT ON goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_current_amount();
```

---

## Seed Data (`supabase/seed.sql`)

```sql
-- ============================================
-- Seed: Default Categories (Appendix A)
-- ============================================
-- This seed runs after household creation.
-- Use a PL/pgSQL function to insert defaults for a given household.

CREATE OR REPLACE FUNCTION seed_default_categories(p_household_id UUID)
RETURNS VOID AS $$
DECLARE
  v_food_id UUID;
  v_dining_id UUID;
  v_housing_id UUID;
  v_transport_id UUID;
  v_healthcare_id UUID;
  v_children_id UUID;
  v_sports_id UUID;
  v_giving_id UUID;
  v_loans_id UUID;
BEGIN
  -- EXPENSE parent categories with sub-categories
  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (uuid_generate_v4(), p_household_id, 'Food & Groceries', 'expense', 1)
  RETURNING id INTO v_food_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Household Goods', v_food_id, 'expense', 1),
    (p_household_id, 'Fruit & Veg', v_food_id, 'expense', 2);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (uuid_generate_v4(), p_household_id, 'Dining', 'expense', 2)
  RETURNING id INTO v_dining_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Eating Out', v_dining_id, 'expense', 1);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (uuid_generate_v4(), p_household_id, 'Housing', 'expense', 3)
  RETURNING id INTO v_housing_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Rent', v_housing_id, 'expense', 1),
    (p_household_id, 'House Repairs', v_housing_id, 'expense', 2),
    (p_household_id, 'Hosting', v_housing_id, 'expense', 3);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (uuid_generate_v4(), p_household_id, 'Transport', 'expense', 4)
  RETURNING id INTO v_transport_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Fuel', v_transport_id, 'expense', 1),
    (p_household_id, 'Car Maintenance', v_transport_id, 'expense', 2);

  -- Standalone expense categories
  INSERT INTO categories (household_id, name, type, sort_order) VALUES
    (p_household_id, 'Utilities', 'expense', 5),
    (p_household_id, 'Entertainment', 'expense', 6);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (uuid_generate_v4(), p_household_id, 'Healthcare', 'expense', 7)
  RETURNING id INTO v_healthcare_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Medicine', v_healthcare_id, 'expense', 1);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (uuid_generate_v4(), p_household_id, 'Children', 'expense', 8)
  RETURNING id INTO v_children_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Child Care', v_children_id, 'expense', 1),
    (p_household_id, 'School Fees', v_children_id, 'expense', 2),
    (p_household_id, 'School Supplies', v_children_id, 'expense', 3);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (uuid_generate_v4(), p_household_id, 'Sports', 'expense', 9)
  RETURNING id INTO v_sports_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Sports Equipment', v_sports_id, 'expense', 1);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (uuid_generate_v4(), p_household_id, 'Giving', 'expense', 10)
  RETURNING id INTO v_giving_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'EBC Giving', v_giving_id, 'expense', 1);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (uuid_generate_v4(), p_household_id, 'Loans', 'expense', 11)
  RETURNING id INTO v_loans_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Qona Loan Repayment', v_loans_id, 'expense', 1),
    (p_household_id, 'Stima Loan Repayment', v_loans_id, 'expense', 2),
    (p_household_id, 'Lending', v_loans_id, 'expense', 3);

  INSERT INTO categories (household_id, name, type, sort_order) VALUES
    (p_household_id, 'Investment', 'expense', 12);

  -- INCOME categories
  INSERT INTO categories (household_id, name, type, sort_order) VALUES
    (p_household_id, 'Salary', 'income', 1),
    (p_household_id, 'Side Income', 'income', 2),
    (p_household_id, 'Other Income', 'income', 3);

  -- BOTH type
  INSERT INTO categories (household_id, name, type, sort_order) VALUES
    (p_household_id, 'Other', 'both', 99);
END;
$$ LANGUAGE plpgsql;
```

---

## Type Generation

After deploying the schema, generate TypeScript types:

```bash
pnpm exec supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

This creates a `Database` type that is used by the Supabase client for full type safety across all queries.

---

## Conventions

- All tables use UUID primary keys via `uuid_generate_v4()`
- All tables include `created_at TIMESTAMPTZ DEFAULT NOW()`
- Soft deletes use `is_active BOOLEAN` flags (not hard deletes)
- All monetary values use `DECIMAL(15,2)` — never use `FLOAT`
- Foreign keys are indexed for query performance
- The `transactions` table has composite indexes for common query patterns (date, category, account)
- Household isolation is enforced via RLS policies (see `supabase-rls.prompt.md`)
