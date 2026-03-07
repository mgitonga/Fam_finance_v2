# FamFin — Playwright E2E User Stories

## Overview

Comprehensive user stories for the FamFin family finance application, organized by feature area. Each story includes acceptance criteria and Playwright test checkpoints referencing actual `data-testid` attributes.

**Test target:** `http://localhost:3000`  
**Browsers:** Chromium (desktop) + Mobile Chrome (Pixel 5)  
**Currency:** KES (Kenyan Shilling)

---

## 1. Authentication

### US-1.1: User Registration

> As a new user, I want to create an account so that my household can start tracking finances.

**Acceptance Criteria:**

- User provides full name, email, household name, and password (with confirmation)
- Password must meet complexity requirements (Zod validation)
- Successful registration shows a confirmation and redirects to login
- Duplicate email shows an error

**Test Checkpoints:**

- Navigate to `/register` → `data-testid="register-page"` visible
- Fill `data-testid="register-name"`, `data-testid="register-email"`, `data-testid="register-household"`, `data-testid="register-password"`, `data-testid="register-confirm-password"`
- Click `data-testid="register-submit"` → redirects to `/login` with success message
- Submit with mismatched passwords → `data-testid="register-error"` visible
- Submit with existing email → `data-testid="register-error"` shows appropriate message
- Click `data-testid="login-link"` → navigates to `/login`

### US-1.2: User Login

> As a registered user, I want to log in so that I can access my financial dashboard.

**Acceptance Criteria:**

- User can log in with valid email and password
- Invalid credentials show an error message
- Successful login redirects to `/dashboard`

**Test Checkpoints:**

- Navigate to `/login` → `data-testid="login-page"` visible
- Fill `data-testid="login-email"` and `data-testid="login-password"`
- Click `data-testid="login-submit"` → redirects to `/dashboard`
- Submit with wrong password → `data-testid="login-error"` visible
- Password show/hide toggle works
- Click `data-testid="forgot-password-link"` → navigates to `/forgot-password`
- Click `data-testid="register-link"` → navigates to `/register`

### US-1.3: Forgot Password

> As a user who forgot my password, I want to request a reset link so that I can regain access.

**Acceptance Criteria:**

- User can submit their email to receive a reset link
- Success message shown after submission
- Invalid email shows error

**Test Checkpoints:**

- Navigate to `/forgot-password` → `data-testid="forgot-password-page"` visible
- Fill `data-testid="forgot-email"` and click `data-testid="forgot-submit"`
- Success: `data-testid="forgot-success"` visible
- Click `data-testid="back-to-login"` → navigates to `/login`

### US-1.4: Reset Password

> As a user with a reset link, I want to set a new password.

**Acceptance Criteria:**

- User can enter and confirm a new password
- Password must meet complexity requirements
- Mismatched passwords show error
- Expired/missing session redirects to forgot-password page

**Test Checkpoints:**

- Navigate to `/reset-password` without session → redirects to `/forgot-password?error=expired`
- With valid session: `data-testid="reset-password-page"` visible
- Fill `data-testid="reset-password"` and `data-testid="reset-confirm-password"`
- Click `data-testid="reset-submit"` → success and redirect to login

### US-1.5: Logout

> As a logged-in user, I want to sign out of the application.

**Acceptance Criteria:**

- User can log out from the header user menu
- After logout, user is redirected to the login page

**Test Checkpoints:**

- Click `data-testid="user-menu"` → dropdown opens
- Click `data-testid="logout-button"` → redirects to `/login`
- Accessing `/dashboard` after logout → redirects to `/login`

---

## 2. Navigation & Layout

### US-2.1: Sidebar Navigation

> As a logged-in user, I want to navigate between sections using the sidebar.

**Acceptance Criteria:**

- Desktop sidebar shows all main navigation items
- Each link navigates to the correct page
- Active link is visually highlighted

**Test Checkpoints:**

- `data-testid="sidebar-nav"` visible on desktop viewport
- Click each nav item: Dashboard, Transactions, Budgets, Recurring, Savings, Debts, Bills, Reports, Import, Export, Settings
- Verify URL changes to the correct route for each click

### US-2.2: Mobile Navigation

> As a mobile user, I want to access the navigation menu via a hamburger button.

**Test Checkpoints:**

- Set viewport to mobile (Pixel 5)
- Sidebar hidden by default
- Click `data-testid="menu-toggle"` → sidebar opens
- Click a nav item → navigates and sidebar closes

### US-2.3: Theme Toggle

> As a user, I want to switch between light and dark mode.

**Test Checkpoints:**

- Theme toggle visible in the header
- Clicking cycles through light/dark/system modes
- Dark mode applies `dark` class to body

---

## 3. Dashboard

### US-3.1: View Dashboard Metrics

> As a user, I want to see a summary of my finances on the dashboard.

**Acceptance Criteria:**

- Dashboard shows Total Income, Total Expenses, Net Savings, and Budget Remaining
- Data updates when the month is changed

**Test Checkpoints:**

- Navigate to `/dashboard` → `data-testid="dashboard-page"` visible
- Metric cards display KES-formatted values
- Click `data-testid="month-selector"` prev/next buttons → metrics refresh

### US-3.2: Dashboard Widgets

> As a user, I want to see configurable widgets showing different financial views.

**Acceptance Criteria:**

- Widgets render: Budget vs Actual (bullet chart), Overall Budget (donut), Recent Transactions, Upcoming Bills, Savings Goals, Account Balances, Debt Overview, Income vs Expense
- Each widget displays relevant data

**Test Checkpoints:**

- `data-testid="widget-budget-vs-actual"` shows bullet chart rows
- `data-testid="widget-overall-budget"` shows donut chart with percentage
- `data-testid="widget-recent-transactions"` lists recent items
- `data-testid="widget-upcoming-bills"` shows bill reminders with urgency colors
- `data-testid="widget-savings-goals"` shows progress bars
- `data-testid="widget-account-balances"` shows all accounts
- `data-testid="widget-debt-overview"` shows debt progress bars

### US-3.3: Customize Dashboard

> As a user, I want to reorder, hide, and show dashboard widgets.

**Test Checkpoints:**

- Open customize dialog → widget list with toggles and drag handles visible
- Toggle a widget off → widget disappears from dashboard
- Toggle it back on → widget reappears
- Reorder widgets → order persists after page refresh

---

## 4. Transactions

### US-4.1: Create a Transaction

> As a user, I want to record an income or expense transaction.

**Acceptance Criteria:**

- User can create income or expense transactions with amount, date, account, category, description, merchant, payment method, and notes
- Account balance updates after the transaction is saved
- Transaction appears in the transaction list

**Test Checkpoints:**

- Click `data-testid="add-transaction-btn"` → `data-testid="transaction-form"` visible
- Set `data-testid="txn-type"` to "expense"
- Fill `data-testid="txn-amount"`, `data-testid="txn-date"`, `data-testid="txn-account"`, `data-testid="txn-category"`, `data-testid="txn-description"`
- Click `data-testid="txn-save"` → form closes, new row in `data-testid="transaction-table"`
- Verify account balance decreased (for expense) or increased (for income)

### US-4.2: Edit a Transaction

> As a user, I want to edit a transaction to correct mistakes.

**Test Checkpoints:**

- Click edit (pencil icon) on a `data-testid="transaction-row"` → form opens with pre-filled values
- Change the amount → click `data-testid="txn-save"` → row updates with new amount
- Account balance adjusts for the difference

### US-4.3: Delete a Transaction

> As a user, I want to delete a transaction I entered by mistake.

**Test Checkpoints:**

- Click delete (trash icon) on a transaction row → confirmation dialog appears
- Confirm → row removed from table
- Account balance reverted

### US-4.4: Search and Filter Transactions

> As a user, I want to find specific transactions using search and filters.

**Test Checkpoints:**

- Type in `data-testid="txn-search"` → table filters by description/merchant
- Click `data-testid="toggle-filters"` → `data-testid="filter-bar"` visible
- Filter by type (income/expense) → only matching rows shown
- Filter by account → only matching rows shown
- Filter by category → only matching rows shown
- Filter by debt → only debt-linked transactions shown
- Click "Clear Filters" → all transactions shown

### US-4.5: Paginate Transactions

> As a user, I want to navigate through pages of transactions.

**Test Checkpoints:**

- `data-testid="pagination"` shows "Page 1 of X (Y total)"
- Click next → page 2 loads, previous becomes enabled
- Click previous → back to page 1

### US-4.6: Sort Transactions

> As a user, I want to sort transactions by date or amount.

**Test Checkpoints:**

- Click "Date" column header → rows reorder (ascending/descending toggle)
- Click "Amount" column header → rows reorder by amount

### US-4.7: Create a Debt Repayment Transaction

> As a user, I want to tag a transaction as a debt repayment so the debt balance updates automatically.

**Acceptance Criteria:**

- When creating an expense, a "Debt Repayment" toggle is available
- Selecting a debt auto-fills amount (minimum payment), category (Loans), and description
- Debt outstanding balance reduces after save
- Amount cannot exceed debt outstanding balance (overpayment blocked)

**Test Checkpoints:**

- Set `data-testid="txn-type"` to "expense" → `data-testid="debt-repayment-toggle"` visible
- Check the toggle → `data-testid="txn-debt"` picker appears
- Select a debt → amount, category, description auto-fill
- Enter amount > outstanding balance → overpayment error message visible
- Enter valid amount → save → debt balance in `/debts` page reduced

---

## 5. Budgets

### US-5.1: Create a Budget

> As a user, I want to set a monthly budget for a spending category.

**Test Checkpoints:**

- Navigate to `/budgets` → `data-testid="budgets-page"` visible
- Click `data-testid="add-budget-btn"` → `data-testid="budget-form"` visible
- Select `data-testid="budget-category"` and fill `data-testid="budget-amount"`
- Click `data-testid="budget-save"` → new `data-testid="budget-row"` with progress bar
- Summary cards update (Total Budgeted)

### US-5.2: Edit a Budget

> As a user, I want to change my budget amount for a category.

**Test Checkpoints:**

- Click `data-testid="edit-budget-btn"` on a budget row → inline edit mode
- Change `data-testid="edit-budget-amount"` and click `data-testid="save-budget-edit"` → amount updates

### US-5.3: Delete a Budget

> As a user, I want to remove a budget I no longer need.

**Test Checkpoints:**

- Click `data-testid="delete-budget-btn"` → budget row removed
- Summary cards update

### US-5.4: Copy Budgets from Previous Month

> As a user, I want to copy last month's budgets to the current month.

**Test Checkpoints:**

- Click `data-testid="copy-budgets-btn"` → budgets from previous month duplicated
- Verify all categories and amounts match

### US-5.5: Set an Overall Budget Cap

> As a user, I want to set a total monthly spending cap.

**Test Checkpoints:**

- Fill `data-testid="overall-budget-amount"` and save → overall budget percentage shown in summary

### US-5.6: View Sub-Category Breakdown

> As a user, I want to see how spending breaks down within a budget category.

**Test Checkpoints:**

- Click expand on a budget row → sub-category spending details shown

---

## 6. Bills & Reminders

### US-6.1: Create a Bill Reminder

> As a user, I want to add a recurring bill reminder so I don't miss payments.

**Test Checkpoints:**

- Navigate to `/bills` → `data-testid="bills-page"` visible
- Click `data-testid="add-bill-btn"` → `data-testid="bill-form"` visible
- Fill name, amount, due day (1–31), category, remind days before, notification method
- Save → new `data-testid="bill-row"` with due date and urgency color

### US-6.2: Bill Urgency Display

> As a user, I want to see which bills are most urgent based on due date.

**Test Checkpoints:**

- Bills due ≤3 days → red urgency indicator
- Bills due ≤7 days → amber indicator
- Bills due >7 days → green indicator

### US-6.3: Delete a Bill Reminder

> As a user, I want to remove a bill reminder I no longer need.

**Test Checkpoints:**

- Click delete on a `data-testid="bill-row"` → row removed

---

## 7. Savings Goals

### US-7.1: Create a Savings Goal

> As a user, I want to set a savings target with a deadline.

**Test Checkpoints:**

- Navigate to `/savings` → `data-testid="savings-page"` visible
- Click "New Goal" → fill name, target amount (KES), target date
- Save → goal card appears with 0% progress bar

### US-7.2: Add a Contribution

> As a user, I want to record money I've put toward a savings goal.

**Test Checkpoints:**

- Click "Add" on a goal card → contribution form (amount, date, notes)
- Submit → progress bar updates, current amount increases
- Required monthly calculation updates

### US-7.3: View Contribution History

> As a user, I want to see all contributions made toward a goal.

**Test Checkpoints:**

- Click "Details" on a goal card → contribution list expands
- Each entry shows date, amount, notes

### US-7.4: Goal Completion

> As a user, I want to see a completion indicator when I reach my savings target.

**Test Checkpoints:**

- Goal with `current_amount >= target_amount` shows completion badge

---

## 8. Recurring Transactions

### US-8.1: Create a Recurring Rule

> As a user, I want to set up a monthly recurring transaction so I don't have to enter it manually each month.

**Test Checkpoints:**

- Navigate to `/recurring` → `data-testid="recurring-page"` visible
- Click `data-testid="add-recurring-btn"` → `data-testid="recurring-form"` visible
- Fill type, amount, day of month, account, category, description
- Save → new `data-testid="recurring-row"` with due badge

### US-8.2: Confirm a Recurring Transaction

> As a user, I want to confirm a due recurring transaction to create the actual transaction.

**Test Checkpoints:**

- When a recurring rule is due, `data-testid="confirm-recurring"` button visible
- Click "Confirm & Create" → actual transaction created in Transactions page
- Next due date advances to next month

### US-8.3: Skip a Recurring Transaction

> As a user, I want to skip a recurring transaction for this month.

**Test Checkpoints:**

- Click `data-testid="skip-recurring"` → due date advances without creating a transaction

---

## 9. Debt Tracking

### US-9.1: Add a Debt

> As a user, I want to track a loan or debt with its details.

**Test Checkpoints:**

- Navigate to `/debts` → `data-testid="debts-page"` visible
- Click "Add Debt" → form with name, type (mortgage/car_loan/personal_loan/credit_card/student_loan/other), original amount, outstanding balance, interest rate, monthly payment, payment day, start date
- Save → debt card appears with progress bar

### US-9.2: Log a Debt Payment from the Debt Page

> As a user, I want to log a payment directly on a debt card.

**Acceptance Criteria:**

- Payment creates a linked transaction with correct category (Loans)
- Debt outstanding balance decreases
- Overpayment is blocked

**Test Checkpoints:**

- Click "Pay" on a debt card → payment form (amount, account, date, payment method, description)
- Enter amount > outstanding balance → error shown
- Enter valid amount → save → outstanding balance decreases, progress bar updates

### US-9.3: View Debt Payment History

> As a user, I want to see all payments made toward a specific debt.

**Test Checkpoints:**

- Click history toggle on a debt card → last payments shown inline
- Click "View all payments" → navigates to `/transactions?debt_id=...`
- Transactions page shows only payments linked to that debt

### US-9.4: Debt Payoff Celebration

> As a user, I want to see a celebration when I fully pay off a debt.

**Test Checkpoints:**

- Log a payment that brings outstanding balance to 0
- Payoff celebration banner appears
- Debt card shows "Paid Off" state

### US-9.5: Edit/Delete Debt-Linked Transactions

> As a user, when I edit or delete a debt-linked transaction, I want the debt balance to auto-adjust.

**Test Checkpoints:**

- Delete a debt-linked transaction → debt outstanding balance increases by that amount
- Edit a debt-linked transaction amount → debt balance adjusts for the difference

---

## 10. Reports

### US-10.1: View Monthly Summary Report

> As a user, I want to see a financial summary for any month.

**Test Checkpoints:**

- Navigate to `/reports` → `data-testid="reports-page"` visible
- `data-testid="report-metrics"` shows Total Income, Total Expenses, Net Savings, previous month comparison with % change
- Change month via `data-testid="month-selector"` → metrics update

### US-10.2: View Category Breakdown

> As a user, I want to see spending distribution across categories.

**Test Checkpoints:**

- Select "Category Breakdown" tab → pie/doughnut chart renders with category slices

### US-10.3: View Income vs Expense Trends

> As a user, I want to see income and expense trends over several months.

**Test Checkpoints:**

- Select "Income vs Expenses" tab → bar chart renders
- Select 3/6/12 month period → chart data range changes

### US-10.4: View Budget vs Actual Report

> As a user, I want to compare my budgets against actual spending in a report.

**Test Checkpoints:**

- Select "Budget vs Actual" tab → bullet chart renders with budget targets and actual spending bars

---

## 11. Import & Export

### US-11.1: Import Transactions from CSV

> As a user, I want to import transactions from a CSV file.

**Test Checkpoints:**

- Navigate to `/import` → `data-testid="import-page"` visible
- Click `data-testid="download-template"` → CSV template file downloads
- Upload a CSV via `data-testid="csv-upload"` → `data-testid="preview-table"` shows parsed rows
- Valid rows show green status, invalid rows show red with error
- Click `data-testid="confirm-import"` → results page shows success/failed/total counts
- Imported transactions appear in the Transactions page

### US-11.2: Export Transactions as CSV

> As a user, I want to export my transactions to a CSV file.

**Test Checkpoints:**

- Navigate to `/export` → `data-testid="export-page"` visible
- Set date range (From/To)
- Click `data-testid="export-csv-btn"` → CSV file downloads

### US-11.3: Export Monthly PDF Report

> As a user, I want to generate a printable PDF report for a month.

**Test Checkpoints:**

- Select month and year
- Click `data-testid="export-pdf-btn"` → print dialog opens

---

## 12. Settings

### US-12.1: Update Profile

> As a user, I want to change my display name.

**Test Checkpoints:**

- Navigate to `/settings/profile` → `data-testid="profile-settings"` visible
- Email field is disabled (read-only)
- Change `data-testid="profile-name"` and click `data-testid="profile-save"` → success toast
- Header user menu shows updated name

### US-12.2: Manage Accounts

> As a user, I want to add, edit, and delete financial accounts.

**Test Checkpoints:**

- Navigate to `/settings/accounts` → `data-testid="accounts-settings"` visible
- Click `data-testid="add-account-btn"` → `data-testid="account-form"` visible
- Fill `data-testid="account-name"`, `data-testid="account-type"` (Bank/M-Pesa/Cash/Credit Card/Other), `data-testid="account-balance"`
- Click `data-testid="account-save"` → new `data-testid="account-row"` appears
- Edit an account → values update
- Delete an account → row removed

### US-12.3: Manage Categories

> As a user, I want to create, edit, and organize spending/income categories.

**Test Checkpoints:**

- Navigate to `/settings/categories` → `data-testid="categories-settings"` visible
- Click `data-testid="add-category-btn"` → form with name, type (expense/income/both), color, icon, sort order, parent
- Save → category appears in the tree with correct type badge
- Create a sub-category under a parent → shown nested
- Edit a category → values update
- Delete a category → removed from tree
- Export: `data-testid="export-categories-btn"` → CSV downloads
- Import: `data-testid="import-categories-btn"` → upload flow

### US-12.4: Invite Household Members

> As a user, I want to invite family members to join my household.

**Test Checkpoints:**

- Navigate to `/settings/users` → `data-testid="users-settings"` visible
- Click `data-testid="invite-user-btn"` → `data-testid="invite-form"` visible
- Fill `data-testid="invite-name"` and `data-testid="invite-email"`
- Click `data-testid="invite-submit"` → new `data-testid="user-row"` with Contributor role

### US-12.5: Change Member Roles

> As an admin, I want to change a household member's role.

**Test Checkpoints:**

- On a `data-testid="user-row"`, use `data-testid="role-select"` to change between Admin/Contributor
- Current user's row shows role badge (not editable)

---

## 13. Notifications

### US-13.1: View Notifications

> As a user, I want to see in-app notifications for important events.

**Test Checkpoints:**

- `data-testid="notification-bell"` visible in header
- `data-testid="notification-badge"` shows unread count
- Click bell → `data-testid="notification-panel"` opens with notification list

### US-13.2: Mark Notifications as Read

> As a user, I want to dismiss notifications after reading them.

**Test Checkpoints:**

- Click a notification → marks as read (badge count decreases)
- Click `data-testid="mark-all-read"` → all notifications marked read, badge disappears

### US-13.3: Notification Types

> As a user, I want to receive notifications for budget warnings, bill reminders, goal milestones, and debt payoffs.

**Test Checkpoints:**

- Exceed a budget → budget_exceeded notification appears
- Reach 80% of budget → budget_warning notification appears
- Bill due soon → bill_reminder notification appears
- Pay off a debt → debt_payoff notification appears

---

## 14. Cross-Cutting Concerns

### US-14.1: Responsive Design

> As a user, I want the application to work well on both desktop and mobile.

**Test Checkpoints:**

- Run all critical flows on mobile viewport (Pixel 5: 393×851)
- Sidebar hidden, hamburger menu works
- Forms and tables are scrollable/stacked on small screens

### US-14.2: Auth Guard

> As an unauthenticated user, I should be redirected to login when accessing protected pages.

**Test Checkpoints:**

- Access `/dashboard`, `/transactions`, `/budgets`, `/settings` without login → all redirect to `/login`
- Access `/login`, `/register` while logged in → redirect to `/dashboard`

### US-14.3: Data Isolation

> As a household member, I should only see data belonging to my household.

**Test Checkpoints:**

- Create data in Household A → log in as Household B user → data not visible
