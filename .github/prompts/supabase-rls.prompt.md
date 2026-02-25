# Supabase Row-Level Security (RLS) — FamFin

## Overview

This prompt defines all Row-Level Security policies for FamFin. RLS ensures every query is scoped to the user's household, preventing unauthorized data access across households.

## References

- Specification Document: `Documentation/Specification Document.md` §4.2 (Role Permissions), NFR-04 (Data Isolation)
- Database Schema: `.github/prompts/database-schema.prompt.md`

---

## Core Principle

**Every table with a `household_id` column must have RLS enabled** with policies that restrict access to rows matching the authenticated user's household.

```sql
-- Pattern: Get current user's household_id
CREATE OR REPLACE FUNCTION auth.household_id()
RETURNS UUID AS $$
  SELECT household_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Pattern: Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## RLS Migration (`supabase/migrations/00002_rls_policies.sql`)

```sql
-- ============================================
-- Enable RLS on all tables
-- ============================================
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
-- Users can only see their own household
CREATE POLICY "Users can view own household"
  ON households FOR SELECT
  USING (id = auth.household_id());

-- Only admins can update household
CREATE POLICY "Admins can update own household"
  ON households FOR UPDATE
  USING (id = auth.household_id() AND auth.user_role() = 'admin');

-- ============================================
-- USERS
-- ============================================
-- Users can see all members of their household
CREATE POLICY "Users can view household members"
  ON users FOR SELECT
  USING (household_id = auth.household_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Admins can update any user in their household (role changes)
CREATE POLICY "Admins can update household members"
  ON users FOR UPDATE
  USING (household_id = auth.household_id() AND auth.user_role() = 'admin');

-- Allow insert for new user registration (via trigger)
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

-- Any authenticated household member can create transactions
CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (household_id = auth.household_id() AND user_id = auth.uid());

-- Users can update their own transactions; admins can update any
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (
    household_id = auth.household_id()
    AND (user_id = auth.uid() OR auth.user_role() = 'admin')
  );

-- Users can delete their own transactions; admins can delete any
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

CREATE POLICY "Admins can manage overall budgets"
  ON overall_budgets FOR ALL
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

-- Any household member can add contributions
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
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- System can create notifications (via service role or triggers)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (household_id = auth.household_id());

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());
```

---

## Storage Bucket Policies

### Receipt Uploads Bucket

```sql
-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false);

-- Upload policy: authenticated users can upload to their household folder
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.household_id()::text
  );

-- Read policy: users can view receipts from their household
CREATE POLICY "Users can view household receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.household_id()::text
  );

-- Delete policy: admins can delete receipts from their household
CREATE POLICY "Admins can delete household receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.household_id()::text
    AND auth.user_role() = 'admin'
  );
```

### Upload Path Convention

Receipt files should be stored with this path structure:

```
receipts/{household_id}/{transaction_id}/{filename}
```

Example:

```
receipts/abc-123-def/tx-456-ghi/receipt.jpg
```

---

## Testing RLS Policies

### Verification Queries

Run these to verify RLS is working correctly:

```sql
-- 1. Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Test: User A should NOT see User B's household data
-- (Run as User A via Supabase client)
SELECT * FROM transactions; -- Should only return User A's household transactions
```

### E2E Security Tests

```typescript
// tests/e2e/security.spec.ts
test('contributor cannot access admin-only operations', async ({ contributorPage }) => {
  // Try to create a category (admin-only)
  const response = await contributorPage.request.post('/api/categories', {
    data: { name: 'Hack Category', type: 'expense' },
  });
  expect(response.status()).toBe(403);
});

test('user cannot see other household data', async ({ page }) => {
  // Login as user from household A
  // Try to fetch data from household B via direct API
  const response = await page.request.get('/api/transactions?household_id=other-hh-id');
  const data = await response.json();
  // Should return empty or only own household data
  expect(data.data.every((t: any) => t.household_id === ownHouseholdId)).toBe(true);
});
```

---

## Conventions

- **Always use `auth.household_id()`** helper instead of inline subqueries for consistency
- **Never bypass RLS** — use service role key only in server-side operations that explicitly need cross-household access (e.g., cron jobs, admin tooling)
- **Test every policy** — ensure both positive (can access) and negative (cannot access) cases
- **Storage paths include `household_id`** — prevents cross-household file access
- **Notifications are user-scoped** (not household-scoped) for privacy — users only see their own notifications
