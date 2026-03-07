# Feature Spec: Debt Repayment — Transaction Linking

**Status:** Draft  
**Author:** GitHub Copilot  
**Date:** 2026-03-07  
**Version:** 1.0

---

## 1. Overview

### Problem

The current debt feature is isolated from transactions. When a user logs a debt payment from the Debts page, the system attempts to create a transaction but **always fails** because it passes `debt.name` (a string) as `category_id` (which requires a UUID). As a result:

- Debt payments are not tracked as transactions
- No audit trail of payments per debt
- No way to tag a regular transaction as a debt repayment
- Dashboard fetches debt metrics but never displays them

### Solution

Link debt repayments to transactions bidirectionally:

1. **From the Transaction Form** — toggle "Debt Repayment" to select a debt, auto-filling fields
2. **From the Debt Page** — "Log Payment" now properly creates a linked transaction
3. **Database** — add `debt_id` FK on `transactions` table
4. **Dashboard** — new debt summary widget
5. **Notifications** — payment reminders before due date + payoff celebrations

### Out of Scope (Deferred)

- Recurring transaction integration for auto-generating debt payments
- Debt-specific reports (existing Loans category reporting suffices)
- Mobile app implementation (Phase 2 — see §10)

---

## 2. User Stories

| ID   | Story                                                                                                              | Acceptance Criteria                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| DS-1 | As a user, I want to create a transaction and tag it as a debt repayment so the debt balance updates automatically | Transaction form has "Debt Repayment" toggle; selecting a debt auto-fills amount, category, description; saving reduces debt balance |
| DS-2 | As a user, I want to log a payment from the debt card so a proper transaction is created                           | Debt page payment form creates a valid linked transaction with correct category_id; debt balance updates                             |
| DS-3 | As a user, I want to see payment history for each debt                                                             | Debt card shows recent payments; link navigates to transactions page filtered by debt                                                |
| DS-4 | As a user, I want the system to prevent overpayment                                                                | Payment amount cannot exceed outstanding balance; validation error shown                                                             |
| DS-5 | As a user, I want editing/deleting a debt payment transaction to auto-adjust the debt balance                      | Deleting a debt-linked transaction restores the amount to the debt; editing adjusts the difference                                   |
| DS-6 | As a user, I want to see my debts on the dashboard                                                                 | New "Debt Overview" widget showing total debt, monthly payments, and active debt list with progress                                  |
| DS-7 | As a user, I want payment reminders before due dates                                                               | Notification sent `reminder_days_before` (default 3) days before `payment_day`                                                       |
| DS-8 | As a user, I want to be congratulated when I pay off a debt                                                        | Notification + visual celebration when debt balance reaches 0                                                                        |

---

## 3. Database Changes

### 3.1 Migration: Add `debt_id` to `transactions`

Add a new migration file (e.g., `00008_debt_transaction_link.sql`):

- **Add column:** `debt_id UUID REFERENCES debts(id) ON DELETE SET NULL` to `transactions` table
- **Add index:** `CREATE INDEX idx_transactions_debt ON transactions(debt_id) WHERE debt_id IS NOT NULL`
- **Add notification type:** `ALTER TABLE notifications DROP CONSTRAINT ...; ADD CHECK (type IN ('bill_reminder', 'budget_warning', 'budget_exceeded', 'goal_milestone', 'recurring_due', 'system', 'debt_reminder', 'debt_payoff'))`
- **Add `reminder_days_before`** column to `debts` table: `INT NOT NULL DEFAULT 3`

### 3.2 RLS Considerations

- No new RLS policies needed — `debt_id` is a nullable FK on `transactions`, which already has household-scoped RLS
- The existing `transactions` INSERT/SELECT/UPDATE/DELETE policies apply unchanged

---

## 4. API Changes

### 4.1 `POST /api/transactions` — Update

**Changes:**

- Accept optional `debt_id` in request body
- If `debt_id` is provided:
  - Validate the debt exists, belongs to the same household, and `is_active = true`
  - Validate `amount ≤ debt.outstanding_balance` (block overpayment)
  - Force `type = 'expense'`
  - Insert transaction with `debt_id`
  - Update `debts` table: `outstanding_balance -= amount`
  - Recalculate `projected_payoff_date`
  - If `outstanding_balance` reaches 0: set `is_active = false`, create payoff notification for all household members
- Wrap debt balance update + transaction insert in a single operation (use Supabase RPC or sequential with error rollback)

### 4.2 `PUT /api/transactions/[id]` — Update

**Changes:**

- If the transaction being edited has a `debt_id`:
  - Reverse old amount: `outstanding_balance += old_amount`
  - Apply new amount: `outstanding_balance -= new_amount`
  - Re-validate: new amount must not exceed the (restored) outstanding balance
  - Recalculate `projected_payoff_date`
  - If balance reaches 0 after edit: deactivate debt + payoff notification
  - If balance was 0 (debt was inactive) and edit increases it: reactivate debt (`is_active = true`)
- If `debt_id` is being removed (user un-tags the transaction): restore amount to debt balance
- If `debt_id` is being added: apply amount reduction to debt balance

### 4.3 `DELETE /api/transactions/[id]` — Update

**Changes:**

- If deleted transaction has a `debt_id`:
  - Restore amount to debt: `outstanding_balance += amount`
  - If debt was `is_active = false` (was paid off), reactivate it: `is_active = true`
  - Recalculate `projected_payoff_date`

### 4.4 `POST /api/debts/[id]/payment` — Fix & Rewrite

**Bug fix:** Replace `category_id: debt.name` with proper category lookup.

**New behavior:**

- Look up the "Loans" parent category for the household, then find or use a sub-category (e.g., "Loan Repayment" or create a generic one)
- Accept optional `category_id` from client (overridable) — if not provided, use the auto-resolved Loans sub-category
- Accept optional `date`, `description`, `payment_method` from client (with sensible defaults)
- Insert the transaction with `debt_id = params.id`
- Existing balance update logic remains
- Invalidate both `['transactions']` and `['debts']` and `['accounts']` caches
- On payoff: create notification for all household members

### 4.5 `GET /api/debts/[id]/payments` — New Endpoint

**Purpose:** Fetch payment history for a specific debt.

**Response:**

```json
{
  "payments": [
    {
      "id": "txn-uuid",
      "amount": 500.0,
      "date": "2026-03-01",
      "description": "Car Loan payment",
      "account": { "id": "...", "name": "Checking" },
      "category": { "id": "...", "name": "Loan Repayment" },
      "created_at": "..."
    }
  ],
  "totalPaid": 3500.0,
  "paymentCount": 7
}
```

**Implementation:** Query `transactions` where `debt_id = params.id`, ordered by `date DESC`, join accounts and categories.

### 4.6 `GET /api/debts` — Update

**Changes:**

- Include `reminder_days_before` in response
- Optionally include `recent_payments` (last 3 transactions for each debt) — or keep this as a separate call per DS-3

### 4.7 Notification Creation

**New helper functions in `src/lib/notifications.ts`:**

- `createDebtReminderNotification(householdId, debtName, amount, daysUntil)` — fans out to all household members, type `'debt_reminder'`, `action_url: '/debts'`
- `createDebtPayoffNotification(householdId, debtName)` — fans out to all household members, type `'debt_payoff'`, `action_url: '/debts'`

**Reminder trigger:** The debt reminder logic should follow the same pattern as bill reminders. A check runs (either via API call or cron) comparing `payment_day` and `reminder_days_before` against the current date. For the web app, this can be triggered on dashboard load (similar to how bill reminders work today).

---

## 5. Validation Schema Changes

### 5.1 `src/lib/validations/transaction.ts`

- Add `debt_id: z.string().uuid().nullable().optional()` to `createTransactionSchema`
- Add same to `updateTransactionSchema`

### 5.2 `src/lib/validations/savings-debt.ts`

- Extend `logDebtPaymentSchema` with optional fields:
  - `category_id: z.string().uuid().optional()`
  - `date: z.string().optional()` (defaults to today)
  - `description: z.string().optional()`
  - `payment_method: z.enum([...]).optional()` (defaults to `'bank_transfer'`)

### 5.3 `src/types/database.ts`

- Add `debt_id: string | null` to the `transactions` Row type
- Add `reminder_days_before: number` to the `debts` Row type
- Add `'debt_reminder' | 'debt_payoff'` to notification type unions

---

## 6. UI Changes

### 6.1 Transaction Form (`src/components/forms/transaction-form.tsx`)

**New elements (shown when `type === 'expense'`):**

1. **"Debt Repayment" toggle** — a checkbox/switch below the type selector
2. **Debt picker dropdown** — shown when toggle is on; lists active debts from `useDebts()` with name and outstanding balance
3. **Auto-fill behavior** when a debt is selected:
   - `amount` → debt's `minimum_payment` (if set), user can override
   - `category_id` → looked-up Loans sub-category UUID, user can override
   - `description` → `"${debt.name} payment"`, user can override
4. **Overpayment validation** — if `amount > debt.outstanding_balance`, show inline error: "Amount exceeds outstanding balance of $X"
5. **Visual indicator** — when a debt is selected, show a small badge/info box: "Linked to: Car Loan ($4,500 remaining)"

**Edit mode:**

- If loading a transaction that has `debt_id`, pre-select the toggle and debt
- Allow changing or removing the debt link
- Same overpayment validation applies (accounting for the current transaction's amount being "returned" first)

### 6.2 Debts Page (`src/app/(dashboard)/debts/page.tsx`)

**Enhanced payment form:**

- Add optional `category_id` picker (auto-selected to Loans sub-category, overridable)
- Add `date` picker (defaults to today)
- Add `description` field (auto-filled with `"${debt.name} payment"`)
- Add `payment_method` dropdown (defaults to `bank_transfer`)
- Overpayment validation: max amount = outstanding balance

**Payment history section per debt card:**

- Show last 3 payments inline (date, amount, description)
- "View all payments" link → navigates to `/transactions?debt_id={id}` (pre-filtered)
- Show `totalPaid` and `paymentCount` summary

**Payoff celebration:**

- When a payment brings balance to 0, show a success toast/animation (e.g., confetti or a congratulatory banner)
- Debt card visual changes: greyed out or marked with a "Paid Off" badge

### 6.3 Transactions Page (`src/app/(dashboard)/transactions/page.tsx`)

**New filter:**

- Add a "Debt" filter dropdown in the filter bar, listing active debts
- Support `?debt_id=` query param for deep-linking from debt page
- Debt-linked transactions show a small badge/icon in the table (e.g., a link icon or "Debt: Car Loan" tag)

### 6.4 Dashboard Widget (`src/components/dashboard/debt-overview.tsx`) — New

**Widget registration** in `src/lib/dashboard-widgets.ts`:

- `id: 'debt-overview'`
- `label: 'Debt Overview'`
- `description: 'Track your debts and repayment progress'`
- `defaultOrder: 10` (after existing widgets)
- `defaultEnabled: true`
- `fullWidth: false` (half-width)

**Widget content:**

- Total Outstanding Debt (sum of all active debts)
- Total Monthly Payments (sum of minimum_payment)
- List of active debts (max 5) with: name, outstanding balance, progress bar (% paid), next payment date
- "View all" link to `/debts`

**Widget renderer update** in `src/components/dashboard/widget-renderer.tsx`:

- Add `'debt-overview'` case in `renderWidget()` switch
- Add `totalDebt` and `totalMonthlyDebt` to `metrics` type (they're already returned by the API but not in the TypeScript type)

---

## 7. Hook Changes

### 7.1 `src/hooks/use-debts.ts`

- **Add `useUpdateDebt()`** — currently missing despite PUT route existing
- **Update `useLogDebtPayment()`** — also invalidate `['transactions']` query key
- **Add `useDebtPayments(debtId)`** — fetches `GET /api/debts/{id}/payments`

### 7.2 `src/hooks/use-transactions.ts`

- **Update `useTransactions(filters)`** — add `debt_id` to the filters type
- **Update `useCreateTransaction()`** — also invalidate `['debts']` when `debt_id` is present in the payload
- **Update `useUpdateTransaction()`** — also invalidate `['debts']`
- **Update `useDeleteTransaction()`** — also invalidate `['debts']`

---

## 8. Implementation Steps

1. **Database migration** — `00008_debt_transaction_link.sql`: add `debt_id` column, index, notification type constraint update, `reminder_days_before` column on debts
2. **Type updates** — Update `src/types/database.ts` with new fields
3. **Validation updates** — Update schemas in `transaction.ts` and `savings-debt.ts`
4. **Fix debt payment API** — Rewrite `POST /api/debts/[id]/payment` with proper category lookup and transaction creation
5. **New endpoint** — Create `GET /api/debts/[id]/payments`
6. **Update transaction APIs** — Add debt linking logic to POST, PUT, DELETE transaction routes
7. **Update transaction filters** — Add `debt_id` filter support to GET transactions
8. **Notification helpers** — Add `createDebtReminderNotification()` and `createDebtPayoffNotification()` to `src/lib/notifications.ts`
9. **Hook updates** — Update `use-debts.ts` and `use-transactions.ts`
10. **Transaction form** — Add debt repayment toggle, debt picker, auto-fill, overpayment validation
11. **Debts page** — Enhance payment form, add payment history, payoff celebration
12. **Transactions page** — Add debt filter, debt badge on linked transactions
13. **Dashboard widget** — Create `debt-overview` component, register widget, update renderer
14. **Debt reminders** — Implement reminder check logic (on dashboard load or dedicated endpoint)
15. **Testing** — Unit tests for validation, integration tests for APIs, E2E tests for flows

---

## 9. Verification

- **Unit tests:** Validation schemas accept/reject correct inputs; `calculatePayoffDate()` handles edge cases; overpayment validation works
- **Integration tests:** POST transaction with `debt_id` reduces debt balance; DELETE transaction with `debt_id` restores balance; PUT transaction adjusts delta correctly; debt payment API creates valid transaction; payoff sets `is_active = false`
- **E2E tests:** Full flow — create debt → log payment from transaction form → verify debt balance updated → view payment history → delete payment → verify balance restored; Full flow from debt page; Dashboard widget renders with active debts
- **Manual checks:** Overpayment blocked; auto-fill works on debt selection; notifications appear for reminders and payoff; debt filter on transactions page works with deep-link

---

## 10. Mobile App Plan Update

Update `Documentation/Mobile App Plan.md` and `Documentation/Mobile App Sprint Plan.md`:

- **Phase 2 scope** now includes the full debt-transaction linking feature:
  - Transaction form with debt repayment toggle and debt picker
  - Debt page with enhanced payment form and payment history
  - Debt dashboard widget
  - Payment reminder push notifications (native)
  - Payoff celebration with haptic feedback
- **Shared package (`@famfin/shared`)** will include:
  - Debt validation schemas (already planned)
  - Debt-transaction linking types
  - `calculatePayoffDate()` utility
- **API compatibility:** All API changes in this spec are consumed via REST, so mobile uses the same endpoints

---

## 11. Decisions Log

| Decision                           | Chosen                                            | Alternative Considered                      |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| Entry flow                         | Both directions (transaction form + debt page)    | Transaction form only; Debt page only       |
| Transaction type for debt payments | Always `expense`                                  | Let user choose                             |
| Overpayment                        | Block (amount ≤ outstanding balance)              | Allow with warning; Allow fully             |
| Partial payments                   | Any positive amount allowed                       | Warn below minimum; Enforce minimum         |
| Edit/delete linked transactions    | Auto-adjust debt balance                          | Lock transactions; Manual correction        |
| Category assignment                | Auto-assign Loans sub-category, user can override | Locked to Loans; User chooses freely        |
| Permissions                        | All household members can do everything           | Members pay only, admins manage; Admin only |
| Dashboard                          | New debt overview widget                          | Metric cards only; Both; None               |
| Notifications                      | Both reminders and payoff celebrations            | Reminders only; Payoff only; None           |
| Recurring integration              | Deferred (manual payments only for now)           | Integrate immediately                       |
| Reports                            | No changes (Loans category reporting sufficient)  | Dedicated debt report                       |
| Bug fix (category_id)              | Fixed as part of this feature                     | Separate fix                                |
