# Feature Spec: Account-Transaction Linking & Accounts Hub

## Overview

Promote **Accounts** from a settings sub-tab to a first-class page with full transaction integration. Accounts become the central hub for viewing balances, transaction history (statements), and fund flows. New transaction types (`transfer`, `adjustment`) are introduced to support inter-account transfers and audited balance corrections.

---

## 1. Navigation Changes

### Sidebar

Move "Accounts" to a top-level sidebar item positioned **after Transactions**:

```
Dashboard
Transactions
Accounts        ← NEW position (moved from Settings)
Budgets
Recurring
...
```

### Settings

Remove the "Accounts" tab from Settings entirely. The settings tabs become: Profile, Categories, Users.

---

## 2. Accounts Page (`/accounts`)

### Account Cards

Each account displays as a card showing:

- **Name** and **type badge** (Bank, M-Pesa, Cash, Credit Card, Other)
- **Current balance** (formatted as KES)
- **30-day balance sparkline** — mini line chart of daily closing balance over the last 30 days
- **Current month summary** — total income in, total expenses out for the current month

Cards are clickable → navigate to the account detail page (`/accounts/[id]`).

### Actions

- **Add Account** button → opens modal (same create form as today)
- **Edit** (pencil icon per card) → opens modal
- **Deactivate** (soft delete, same as today)

### Totals Bar

Display a summary bar above the cards:

- **Total Balance** (sum of all active account balances)
- **Total Income This Month** (across all accounts)
- **Total Expenses This Month** (across all accounts)

---

## 3. Account Detail Page (`/accounts/[id]`)

A dedicated page showing a **bank-statement-style** view for a single account.

### Header

- Account name, type, current balance
- Edit / Deactivate actions

### Statement View

- **Date range filter** (default: current month)
- **Opening balance** at the start of the selected period
- **Transaction list** in chronological order with columns:
  - Date
  - Description / Merchant
  - Category
  - Debit (expenses/transfers out)
  - Credit (income/transfers in)
  - **Running balance** (computed per row: previous balance ± transaction amount)
- **Closing balance** at the end of the selected period

### Export

- **Download CSV** — standard columnar export of the statement view
- **Download PDF** — formatted statement with account header, date range, transaction table, opening/closing balance

---

## 4. New Transaction Types

### 4a. Transfer (`type: 'transfer'`)

Moves funds between two accounts within the same household.

**Schema changes:**

- Add `to_account_id UUID REFERENCES accounts(id)` column to `transactions` table (nullable, used only for transfers)
- Add `CHECK` constraint: `type = 'transfer'` requires `to_account_id IS NOT NULL` and `to_account_id != account_id`
- Non-transfer transactions must have `to_account_id IS NULL`

**Behavior:**

- `account_id` = source account (debited)
- `to_account_id` = destination account (credited)
- No fees — exact amount moves between accounts
- No category required for transfers
- Appears in both account statements: as debit in source, credit in destination

**UI:**

- When user selects "Transfer" type in the transaction form:
  - Show "From Account" (source) and "To Account" (destination) dropdowns
  - Hide category picker (not applicable)
  - Description auto-fills with "Transfer to {destination}" / "Transfer from {source}"

**Validation:**

- Source and destination must be different accounts
- Source account must have sufficient balance (overdraft protection)
- Amount must be positive

### 4b. Adjustment (`type: 'adjustment'`)

Logs a manual balance correction as a visible transaction for audit trail.

**Behavior:**

- Created automatically when a user manually edits an account's balance
- `amount` = absolute difference between old and new balance
- Positive adjustment if new balance > old balance (credit)
- Negative adjustment if new balance < old balance (debit)
- Description auto-filled: "Balance adjustment"
- No category required

**UI:**

- User edits account balance via account edit modal
- System computes the difference and creates an adjustment transaction behind the scenes
- Adjustment transactions appear in statements with a distinct "Adjustment" badge

---

## 5. Balance Management

### Auto-Update Rules

| Action                     | Balance Effect                                                 |
| -------------------------- | -------------------------------------------------------------- |
| Create income transaction  | `account.balance += amount`                                    |
| Create expense transaction | `account.balance -= amount`                                    |
| Create transfer            | `source.balance -= amount`, `destination.balance += amount`    |
| Create adjustment          | Balance set directly; adjustment transaction records the delta |
| Update transaction         | Reverse old effect, apply new effect                           |
| Delete transaction         | Reverse the balance effect                                     |

### Manual Balance Edit

- User can still edit balance from the account edit modal
- When the new balance differs from the current balance, the system:
  1. Computes the delta (`newBalance - currentBalance`)
  2. Creates an `adjustment` transaction with that delta
  3. Updates the account balance to the new value
- This ensures every balance change has a corresponding transaction (audit trail)

### Prevent Direct Balance Manipulation

- The `PUT /api/accounts/[id]` endpoint detects balance changes and routes them through the adjustment transaction flow rather than silently updating the field

### Overdraft Protection

All expense-type deductions check that the projected balance won't go below zero before proceeding. This is enforced across all 6 code paths:

1. `POST /api/transactions` — creating transactions
2. `PUT /api/transactions/[id]` — updating transactions
3. `DELETE /api/transactions/[id]` — deleting income (would reduce balance)
4. `POST /api/recurring/[id]/confirm` — confirming recurring transactions
5. `POST /api/debts/[id]/payment` — logging debt payments
6. `POST /api/import/confirm` — batch importing transactions

Error format: `"Insufficient balance. Account has KES X but transaction requires KES Y."`

---

## 6. Reports: Account Statements

Add a new **"Account Statements"** tab to the Reports page.

### Report UI

- **Account selector** dropdown (defaults to first account)
- **Date range picker** (default: current month)
- **Statement table** matching the account detail view format:
  - Opening balance
  - Transaction list with running balance
  - Closing balance
- **Summary metrics:**
  - Total credits (income + transfers in)
  - Total debits (expenses + transfers out)
  - Net change

### API

New endpoint: `GET /api/reports/account-statement`

Query params:

- `account_id` (required)
- `start_date` (required)
- `end_date` (required)

Response:

```json
{
  "account": { "id": "...", "name": "...", "type": "..." },
  "period": { "start_date": "...", "end_date": "..." },
  "opening_balance": 50000,
  "closing_balance": 62500,
  "transactions": [
    {
      "id": "...",
      "date": "...",
      "description": "...",
      "merchant": "...",
      "category": "...",
      "type": "...",
      "debit": 0,
      "credit": 15000,
      "running_balance": 65000
    }
  ],
  "summary": {
    "total_credits": 25000,
    "total_debits": 12500,
    "net_change": 12500
  }
}
```

### Export from Reports

Same CSV and PDF export functionality as the account detail page.

---

## 7. Database Changes

### Migration: Add `to_account_id` to transactions

```sql
ALTER TABLE transactions
  ADD COLUMN to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT;

-- Allow 'transfer' and 'adjustment' types
ALTER TABLE transactions
  DROP CONSTRAINT transactions_type_check,
  ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('income', 'expense', 'transfer', 'adjustment'));

-- Transfer must have to_account_id, others must not
ALTER TABLE transactions
  ADD CONSTRAINT transactions_transfer_check
    CHECK (
      (type = 'transfer' AND to_account_id IS NOT NULL AND to_account_id != account_id)
      OR (type != 'transfer' AND to_account_id IS NULL)
    );

-- Transfers and adjustments don't require a category
ALTER TABLE transactions
  ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_category_check
    CHECK (
      type IN ('transfer', 'adjustment') OR category_id IS NOT NULL
    );

CREATE INDEX idx_transactions_to_account ON transactions(to_account_id) WHERE to_account_id IS NOT NULL;
```

### Validation Schema Updates

- Update `createTransactionSchema` to include `to_account_id` (required when type is `transfer`)
- Make `category_id` conditionally required (not needed for transfers/adjustments)
- Add `transfer` and `adjustment` to `transactionTypeEnum`

---

## 8. Affected Files

### New Files

| File                                                      | Purpose                            |
| --------------------------------------------------------- | ---------------------------------- |
| `src/app/(dashboard)/accounts/page.tsx`                   | Accounts hub page                  |
| `src/app/(dashboard)/accounts/[id]/page.tsx`              | Account detail/statement page      |
| `src/app/api/reports/account-statement/route.ts`          | Account statement API              |
| `src/components/charts/balance-sparkline.tsx`             | 30-day balance sparkline component |
| `src/app/api/accounts/[id]/sparkline/route.ts`            | Sparkline data API                 |
| `src/app/api/accounts/[id]/statement-export/route.ts`     | CSV/PDF statement export           |
| `supabase/migrations/000XX_account_transactions_link.sql` | Schema migration                   |

### Modified Files

| File                                          | Change                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/components/layout/sidebar.tsx`           | Add Accounts nav item after Transactions                                     |
| `src/app/(dashboard)/settings/layout.tsx`     | Remove Accounts tab                                                          |
| `src/app/api/accounts/[id]/route.ts`          | Balance edit → adjustment transaction flow                                   |
| `src/app/api/transactions/route.ts`           | Handle transfer type (dual balance update) + overdraft protection            |
| `src/app/api/transactions/[id]/route.ts`      | Handle transfer update/delete (reverse both accounts) + overdraft protection |
| `src/app/api/recurring/[id]/confirm/route.ts` | Overdraft protection                                                         |
| `src/app/api/debts/[id]/payment/route.ts`     | Overdraft protection                                                         |
| `src/app/api/import/confirm/route.ts`         | Overdraft protection                                                         |
| `src/lib/validations/transaction.ts`          | Add transfer/adjustment types, `to_account_id`, conditional `category_id`    |
| `src/lib/validations/account.ts`              | No change (balance still editable, but routed through adjustment)            |
| `src/components/forms/transaction-form.tsx`   | Transfer UI (from/to dropdowns), hide category for transfers                 |
| `src/app/(dashboard)/reports/page.tsx`        | Add "Account Statements" tab                                                 |
| `src/hooks/use-accounts.ts`                   | Add hooks for sparkline, statement data                                      |
| `src/lib/constants.ts`                        | Add `ACCOUNT_TYPES` display helpers if needed                                |

### Removed Files

| File                                             | Reason               |
| ------------------------------------------------ | -------------------- |
| `src/app/(dashboard)/settings/accounts/page.tsx` | Moved to `/accounts` |

---

## 9. Scope Boundaries

### Included

- Accounts promoted to top-level page with cards, sparklines, monthly summary
- Account detail page with bank-statement-style view and running balance
- Transfer transaction type (single record, dual balance update)
- Adjustment transaction type (auto-created on manual balance edit)
- Account statement report tab with export (CSV + PDF)
- Settings accounts tab removed
- Overdraft protection on all balance-deducting code paths

### Excluded

- Transfer fees (no fee support for now)
- Multi-currency accounts
- Account reconciliation workflows
- Scheduled/future-dated transfers
- Account grouping/folders
- Credit card statement cycles

---

## 10. Decisions Log

| Decision               | Choice                                              | Rationale                                                      |
| ---------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Transfer model         | Single transaction with `to_account_id`             | Simpler than dual linked transactions; one record to manage    |
| Manual balance edit    | Creates adjustment transaction                      | Ensures full audit trail — every balance change is traceable   |
| Sparkline period       | Last 30 days                                        | Covers recent trends without being too noisy                   |
| Category for transfers | Not required                                        | Transfers move money between own accounts, not income/expense  |
| Settings accounts tab  | Remove entirely                                     | Avoids duplicate UI; accounts page is the single source        |
| Export formats         | CSV + PDF                                           | PDF for formal statements, CSV for data analysis               |
| Transfer fees          | Not supported                                       | Simplicity; can be added later as a separate expense if needed |
| Overdraft protection   | Block transactions that would make balance negative | All 6 deduction paths enforce this consistently                |
