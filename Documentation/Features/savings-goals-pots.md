# Feature Spec: Savings Goals as Pots

## Overview

Transform Savings Goals into **pot-style containers** that hold real funds. Users transfer money from accounts into goal pots, ring-fencing it from their available balance. Withdrawals move funds back to an account. Goals freeze deposits once the target is reached but still allow withdrawals. Every fund movement creates a transaction record for full audit trail.

---

## 1. Core Concept

A savings goal acts like a virtual pot:

- **Deposit** (fund): debit an account → credit the pot → `current_amount` increases
- **Withdraw** (unfund): debit the pot → credit an account → `current_amount` decreases
- Funds in a pot are **excluded from the source account's balance** (ring-fenced)
- Every deposit/withdrawal creates a `transaction` record on the linked account

---

## 2. Database Changes

### Migration: Extend `goal_contributions`

```sql
-- Add account linkage and direction to goal_contributions
ALTER TABLE goal_contributions
  ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  ADD COLUMN type TEXT NOT NULL DEFAULT 'deposit'
    CHECK (type IN ('deposit', 'withdrawal'));

-- Index for efficient lookups
CREATE INDEX idx_goal_contributions_account ON goal_contributions(account_id)
  WHERE account_id IS NOT NULL;
```

### No changes to `savings_goals` table

The existing `current_amount` and `is_completed` fields are sufficient. Database triggers already update `current_amount` on contribution insert.

**Trigger update needed**: The existing trigger that sums contributions must account for withdrawals (subtract withdrawal amounts from the total). Update the trigger to:

```sql
current_amount = SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END)
```

---

## 3. Contribution API Changes

### `POST /api/savings/[id]/contributions` — Fund or Withdraw

**New request body:**

```json
{
  "amount": 5000,
  "date": "2026-03-12",
  "account_id": "uuid-of-source-account",
  "type": "deposit",
  "notes": "March savings"
}
```

**Fields:**

| Field        | Type                      | Required | Notes                      |
| ------------ | ------------------------- | -------- | -------------------------- |
| `amount`     | number                    | Yes      | Must be positive           |
| `date`       | string                    | Yes      | ISO date                   |
| `account_id` | UUID                      | Yes      | Source/destination account |
| `type`       | `deposit` \| `withdrawal` | Yes      | Direction of fund movement |
| `notes`      | string                    | No       | Optional memo              |

### Deposit Flow

1. Validate input with updated `addContributionSchema`
2. Verify goal exists and belongs to household
3. **Check goal is not completed** — if `is_completed = true`, reject with: `"Goal has reached its target. No more deposits allowed."`
4. Verify account exists and belongs to household
5. **Overdraft protection** — if `account.balance < amount`, reject with: `"Insufficient balance. Account has KES X but deposit requires KES Y."`
6. Insert `goal_contribution` (type: `deposit`, account_id)
7. Update account balance: `balance -= amount`
8. Update goal: `current_amount += amount`
9. If `current_amount >= target_amount`, set `is_completed = true`
10. Check milestone notifications (25/50/75/100%)
11. Create `transaction` record on the account (type: `expense`, description: `"Savings: {goal_name}"`)

### Withdrawal Flow

1. Validate input
2. Verify goal exists and belongs to household
3. **Pot overdraft protection** — if `goal.current_amount < amount`, reject with: `"Insufficient goal balance. Goal has KES X but withdrawal requires KES Y."`
4. Verify account exists and belongs to household
5. Insert `goal_contribution` (type: `withdrawal`, account_id)
6. Update account balance: `balance += amount`
7. Update goal: `current_amount -= amount`
8. If `current_amount < target_amount` and `is_completed = true`, set `is_completed = false` (re-open goal)
9. Create `transaction` record on the account (type: `income`, description: `"Savings withdrawal: {goal_name}"`)

---

## 4. Validation Schema Updates

### `addContributionSchema` (in `src/lib/validations/savings-debt.ts`)

```typescript
export const addContributionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  account_id: z.string().uuid('Please select an account'),
  type: z.enum(['deposit', 'withdrawal']),
  notes: z.string().max(500).nullable().optional(),
});
```

---

## 5. TypeScript Type Updates

### `goal_contributions` table in `src/types/database.ts`

Add to Row, Insert, Update:

- `account_id: string` (Row), `account_id: string` (Insert), `account_id?: string` (Update)
- `type: string` (Row), `type?: string` (Insert — defaults to `'deposit'`), `type?: string` (Update)

Add relationship:

```typescript
{
  foreignKeyName: 'goal_contributions_account_id_fkey';
  columns: ['account_id'];
  isOneToOne: false;
  referencedRelation: 'accounts';
  referencedColumns: ['id'];
}
```

---

## 6. UI Changes

### Savings Page (`src/app/(dashboard)/savings/page.tsx`)

#### Goal Card Updates

- Show `current_amount` as **"Pot Balance"**
- Show linked account transactions history (deposits & withdrawals) instead of just contributions
- Display a **"Target Reached!"** badge when `is_completed = true`
- When target reached: hide the "Add Funds" button, show only "Withdraw"

#### Contribution Form → Fund/Withdraw Form

Replace the current inline contribution form with:

- **Type toggle**: Deposit / Withdraw (two buttons or tabs)
- **Account selector**: dropdown of active accounts (same as transaction form)
- **Amount**: number input
  - For deposits: show account's available balance as helper text
  - For withdrawals: show goal's current pot balance as helper text
- **Date**: date picker (defaults to today)
- **Notes**: optional text field

#### Contribution History

Update to show:

- Direction indicator: ↑ Deposit (green) / ↓ Withdrawal (red)
- Account name for each movement
- Amount with sign (+/-)

---

## 7. Hooks Updates

### `src/hooks/use-savings.ts`

Update `useAddContribution()` to:

- Accept `account_id` and `type` in its payload
- Invalidate `['accounts']` query key on success (account balance changed)

---

## 8. Balance Rules

| Action                         | Account Effect      | Goal Effect                                        |
| ------------------------------ | ------------------- | -------------------------------------------------- |
| Deposit to goal                | `balance -= amount` | `current_amount += amount`                         |
| Withdraw from goal             | `balance += amount` | `current_amount -= amount`                         |
| Goal reaches target            | —                   | `is_completed = true`, deposits frozen             |
| Withdrawal from completed goal | `balance += amount` | `current_amount -= amount`, `is_completed = false` |

### Overdraft Protection (2 points)

1. **Account overdraft**: Deposit blocked if `account.balance < amount`
2. **Goal overdraft**: Withdrawal blocked if `goal.current_amount < amount`

---

## 9. Transaction Audit Trail

Every fund movement creates a transaction record:

| Movement             | Transaction Type | Description Template                |
| -------------------- | ---------------- | ----------------------------------- |
| Deposit to goal      | `expense`        | `"Savings: {goal_name}"`            |
| Withdrawal from goal | `income`         | `"Savings withdrawal: {goal_name}"` |

These transactions:

- Appear in account statements
- Use `category_id = NULL` (like transfers/adjustments — no category needed)
- Are linked via description (no FK to goals in transactions table — keep it simple)

---

## 10. Affected Files

### Modified Files

| File                                              | Change                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/lib/validations/savings-debt.ts`             | Update `addContributionSchema` with `account_id`, `type`               |
| `src/types/database.ts`                           | Add `account_id`, `type` to `goal_contributions` types                 |
| `src/app/api/savings/[id]/contributions/route.ts` | Deposit/withdrawal flows with balance updates, overdraft, transactions |
| `src/app/(dashboard)/savings/page.tsx`            | Fund/withdraw UI, account selector, direction indicators               |
| `src/hooks/use-savings.ts`                        | Update mutation payload, invalidate accounts                           |
| `supabase/migrations/`                            | New migration for `goal_contributions` schema changes                  |

### No New Files Required

All changes fit within existing file structure.

---

## 11. Scope Boundaries

### Included

- Deposits from accounts into goal pots (with overdraft protection)
- Withdrawals from goal pots back to accounts
- Transaction audit trail for every fund movement
- Goal freezes deposits when target reached
- Withdrawals re-open a completed goal
- Account balance reflects ring-fenced funds

### Excluded

- Automatic/scheduled deposits (future feature)
- Interest accrual on goal pots
- Goal-to-goal transfers
- Partial goal locking (all-or-nothing target)
- Goal categories or tags
- Multiple currency support

---

## 12. Decisions Log

| Decision                         | Choice                             | Rationale                                                          |
| -------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| Fund source                      | Deduct from chosen account         | Real money movement, not just tracking                             |
| Withdrawal destination           | Credit chosen account              | Reverse of deposit; maintains balance integrity                    |
| Completed goal                   | Freeze deposits, allow withdrawals | User may need emergency access to funds                            |
| Withdrawal re-opens goal         | Yes, set `is_completed = false`    | Keeps state consistent with actual pot balance                     |
| Audit trail                      | Create transaction records         | Appears in statements; consistent with transfer/adjustment pattern |
| Transaction type for deposits    | `expense`                          | Money leaves the account                                           |
| Transaction type for withdrawals | `income`                           | Money enters the account                                           |
| Category for goal transactions   | `NULL`                             | Like transfers — no income/expense category needed                 |
| Overdraft on both sides          | Yes                                | Consistent with existing overdraft enforcement                     |
| Goal contributions table         | Extend with `account_id` + `type`  | Keeps existing history intact; simpler than dual tables            |
