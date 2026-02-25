# FamFin — Implementation Plan v1.0

**Family Budget & Finance Tracking Application**

---

| Field                   | Value                                      |
| ----------------------- | ------------------------------------------ |
| Document Version        | 1.0                                        |
| Date                    | February 24, 2026                          |
| Status                  | DRAFT — Awaiting Approval                  |
| Specification Reference | Specification Document v1.0 (Feb 20, 2026) |
| Target Launch           | May 2026 (MVP)                             |
| Sprint Cadence          | 1-week sprints (12 sprints)                |
| Timeline                | Feb 24 – May 18, 2026                      |

---

## Table of Contents

1. [Technical Decisions](#1-technical-decisions)
2. [Project Structure](#2-project-structure)
3. [CI/CD Pipeline](#3-cicd-pipeline)
4. [Testing Strategy](#4-testing-strategy)
5. [Sprint Breakdown](#5-sprint-breakdown)
6. [Milestones & Verification](#6-milestones--verification)
7. [Prompt Files](#7-prompt-files)

---

## 1. Technical Decisions

| Decision       | Choice                                                                     |
| -------------- | -------------------------------------------------------------------------- |
| Router         | Next.js App Router                                                         |
| Testing        | Vitest + React Testing Library + Playwright                                |
| CI/CD          | GitHub Actions (lint → type-check → unit tests → E2E) + Vercel auto-deploy |
| Branching      | Trunk-based with feature branches, PRs to `main`                           |
| Code quality   | ESLint + Prettier + Husky pre-commit + lint-staged                         |
| Server state   | TanStack Query + React Context for UI state                                |
| Forms          | React Hook Form + Zod validation                                           |
| Sprint cadence | 1-week sprints (12 sprints)                                                |

---

## 2. Project Structure

```
Family-Finance/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint, type-check, unit tests on PRs
│   │   ├── e2e.yml                   # Playwright E2E on PRs to main
│   │   └── deploy-preview.yml        # (Optional) Custom preview deploy triggers
│   └── prompts/
│       ├── project-setup.prompt.md
│       ├── database-schema.prompt.md
│       ├── api-route.prompt.md
│       ├── ui-component.prompt.md
│       ├── testing.prompt.md
│       ├── ci-cd-pipeline.prompt.md
│       ├── supabase-rls.prompt.md
│       └── feature-sprint.prompt.md
├── Documentation/
│   ├── Specification Document.md
│   └── Implementation Plan.md
├── supabase/
│   ├── migrations/                   # Numbered SQL migration files
│   ├── seed.sql                      # Default categories, test data
│   └── config.toml
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── (auth)/                   # Auth route group (login, register, etc.)
│   │   ├── (dashboard)/              # Protected route group
│   │   ├── api/                      # API route handlers
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── forms/                    # Form components
│   │   ├── charts/                   # Recharts wrappers
│   │   ├── dashboard/                # Dashboard widgets
│   │   └── layout/                   # Header, Sidebar, Footer
│   ├── hooks/                        # Custom React hooks
│   ├── lib/
│   │   ├── supabase/                 # Supabase client (server/client)
│   │   ├── validations/              # Zod schemas
│   │   ├── utils.ts                  # Utility functions
│   │   └── constants.ts
│   ├── types/                        # TypeScript type definitions
│   └── providers/                    # React Context providers
├── tests/
│   ├── unit/                         # Vitest unit tests
│   ├── integration/                  # Vitest integration tests (API routes)
│   └── e2e/                          # Playwright E2E tests
├── public/                           # Static assets, PWA manifest
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── package.json
├── .eslintrc.json
├── .prettierrc
├── .husky/
└── .gitignore
```

---

## 3. CI/CD Pipeline

### 3.1 GitHub Actions — `ci.yml` (runs on all PRs)

1. Checkout → Install dependencies (pnpm)
2. Run `prettier --check`
3. Run `eslint`
4. Run `tsc --noEmit` (type-check)
5. Run `vitest run` (unit + integration tests)
6. Upload coverage report

### 3.2 GitHub Actions — `e2e.yml` (runs on PRs to main)

1. Checkout → Install dependencies
2. Build Next.js app
3. Start local server + Supabase local (via Docker)
4. Run `playwright test` against local server
5. Upload Playwright report artifact

### 3.3 Vercel Integration

- PR branches → auto-deploy to preview URLs
- Merges to `main` → auto-deploy to production
- Environment variables configured in Vercel dashboard

### 3.4 Branching Strategy

- **Trunk-based** with short-lived feature branches
- Branch naming: `feature/sprint-X-description`, `fix/description`, `chore/description`
- All branches merge to `main` via Pull Requests
- PRs require: CI checks passing + code review

---

## 4. Testing Strategy

### 4.1 Test Layers

| Layer             | Tool                  | Coverage Target                          | Run When            |
| ----------------- | --------------------- | ---------------------------------------- | ------------------- |
| Unit tests        | Vitest + RTL          | Components, hooks, utils, Zod schemas    | Every PR (CI)       |
| Integration tests | Vitest                | API routes, database queries, auth flows | Every PR (CI)       |
| E2E / Functional  | Playwright            | Critical user journeys, cross-page flows | PRs to main         |
| Accessibility     | axe-core + Playwright | WCAG 2.1 AA compliance                   | Sprint 11 + ongoing |
| Performance       | Lighthouse CI         | Core Web Vitals thresholds               | Pre-release         |

### 4.2 Estimated Test Counts

| Sprint    | Unit/Integration | E2E        | Running Total |
| --------- | ---------------- | ---------- | ------------- |
| Sprint 0  | 5-8              | 0          | ~8            |
| Sprint 1  | 10-13            | 2-3        | ~22           |
| Sprint 2  | 16-20            | 3-4        | ~44           |
| Sprint 3  | 18-22            | 3-4        | ~68           |
| Sprint 4  | 18-22            | 4-5        | ~93           |
| Sprint 5  | 18-22            | 3-4        | ~118          |
| Sprint 6  | 18-22            | 3-4        | ~143          |
| Sprint 7  | 18-22            | 3-4        | ~168          |
| Sprint 8  | 14-18            | 3-4        | ~188          |
| Sprint 9  | 14-18            | 3-4        | ~208          |
| Sprint 10 | 12-16            | 3-4        | ~228          |
| Sprint 11 | 5-10             | 15-20      | ~260          |
| **Total** | **~160-200**     | **~45-60** | **~260**      |

---

## 5. Sprint Breakdown

### Sprint 0 — Foundation & DevOps (Feb 24 – Mar 2)

**Goal:** Fully scaffolded project with CI/CD, database schema deployed, and design system ready.

| #    | Task                             | Details                                                             | Spec Ref   |
| ---- | -------------------------------- | ------------------------------------------------------------------- | ---------- |
| 0.1  | Initialize Next.js 14+ project   | `create-next-app` with TypeScript, App Router, Tailwind, ESLint     | §3.1       |
| 0.2  | Install & configure dependencies | shadcn/ui, Recharts, TanStack Query, React Hook Form, Zod, next-pwa | §3.1       |
| 0.3  | Configure code quality tooling   | ESLint + Prettier + Husky + lint-staged pre-commit hooks            | —          |
| 0.4  | Set up Supabase project          | Create Supabase project, configure local dev with `supabase init`   | §3.1       |
| 0.5  | Create database schema           | All 13 tables from Spec §5.2, write migration SQL files             | §5.2       |
| 0.6  | Write seed data                  | Default categories (Appendix A), test household, test users         | Appendix A |
| 0.7  | Configure Supabase RLS policies  | Row-level security on every table scoped to `household_id`          | NFR-04     |
| 0.8  | Set up Supabase client utils     | Server-side and client-side Supabase clients for App Router         | §3.1       |
| 0.9  | Set up GitHub Actions CI         | Workflow: lint → type-check → vitest unit tests on every PR         | §12.3      |
| 0.10 | Set up Playwright config         | Base Playwright config with Supabase test setup/teardown            | —          |
| 0.11 | Connect Vercel deployment        | Link repo to Vercel, configure env vars, verify preview deploys     | §12.1      |
| 0.12 | Create app layout shell          | Root layout, header, sidebar, responsive shell (mobile hamburger)   | §8.2       |
| 0.13 | Set up TypeScript types          | Generate Supabase types from schema (`supabase gen types`)          | —          |
| 0.14 | Write initial tests              | Smoke tests: app renders, layout components render                  | —          |

**Definition of Done:**

- Project runs locally at `localhost:3000`
- Database schema deployed to Supabase (dev)
- CI pipeline passes (lint + type-check + smoke tests)
- Vercel preview deploy working on PR creation

**Tests:** 5-8 unit tests (component renders, utility functions)

---

### Sprint 1 — Authentication (Mar 2 – Mar 9)

**Goal:** Complete auth flow: register, login, logout, password reset, household creation.

| #   | Task                      | Details                                                              | Spec Ref     |
| --- | ------------------------- | -------------------------------------------------------------------- | ------------ |
| 1.1 | Auth pages UI             | Login, Register, Forgot Password pages with React Hook Form + Zod    | §8.1         |
| 1.2 | Supabase Auth integration | Email/password sign-up, sign-in, sign-out, password reset            | FR-01.1–01.3 |
| 1.3 | Auth middleware           | Next.js middleware to protect routes, redirect unauthenticated users | §4.1         |
| 1.4 | Household auto-creation   | On first registration, create household + assign Admin role          | FR-01.6      |
| 1.5 | User profile table sync   | Supabase trigger: on `auth.users` insert → create `users` row        | §5.2.1       |
| 1.6 | Session management        | JWT persistence, auth state provider using React Context             | §4.1         |
| 1.7 | Password validation       | Min 8 chars, 1 number, 1 special char (Zod schema)                   | §4.1         |
| 1.8 | Protected route layout    | `(dashboard)` route group with auth check                            | §8.1         |

**Definition of Done:**

- User can register → auto-creates household → redirected to dashboard
- User can login/logout with persistent session
- Password reset email sends and works
- Unauthenticated access redirects to login

**Tests:**

- Unit: Zod validation schemas (password rules, email format) — 6-8 tests
- Integration: Auth API routes (register, login, logout) — 4-5 tests
- E2E: Full registration → login → redirect flow — 2-3 Playwright tests

---

### Sprint 2 — Accounts, Categories & Settings (Mar 9 – Mar 16)

**Goal:** Account CRUD, category CRUD with sub-categories, settings pages.

| #   | Task                            | Details                                                                   | Spec Ref     |
| --- | ------------------------------- | ------------------------------------------------------------------------- | ------------ |
| 2.1 | Account CRUD API routes         | GET/POST/PUT/DELETE `/api/accounts` with Admin role check                 | §9.2         |
| 2.2 | Account management UI           | List, create, edit, deactivate accounts (bank, M-Pesa, cash, credit card) | FR-02.1–02.2 |
| 2.3 | Category CRUD API routes        | GET/POST/PUT/DELETE `/api/categories` with parent-child support           | §9.3         |
| 2.4 | Category management UI          | Hierarchical category list, create/edit with icon & color picker          | FR-03.2–03.6 |
| 2.5 | Pre-populate default categories | Seed script runs on household creation (Appendix A categories)            | FR-03.1      |
| 2.6 | Settings layout                 | Settings page with tabs: Profile, Categories, Accounts, Users             | §8.1         |
| 2.7 | Profile settings                | Update name, avatar                                                       | FR-01.7      |
| 2.8 | User invite flow                | Admin invites user by email, assign Contributor role                      | FR-01.4      |
| 2.9 | Role management                 | Admin can change user roles                                               | FR-01.5      |

**Definition of Done:**

- Admin can CRUD accounts and categories
- Default categories populated on household creation
- User invite flow sends email and creates Contributor account
- Settings pages functional with all tabs

**Tests:**

- Unit: Category hierarchy logic, account type validation — 8-10 tests
- Integration: Account & Category API routes (CRUD + role-based access) — 8-10 tests
- E2E: Create account → appears in list, create category with sub-category — 3-4 Playwright tests

---

### Sprint 3 — Transactions Core (Mar 16 – Mar 23)

**Goal:** Transaction CRUD with full form, list view, pagination, sorting.

| #   | Task                    | Details                                                                                              | Spec Ref          |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------- | ----------------- |
| 3.1 | Transaction API routes  | GET (paginated, 20/page), POST, PUT, DELETE with own/Admin permission                                | §9.4              |
| 3.2 | Transaction list page   | Table with pagination, sortable by date/amount/category                                              | FR-04.9, FR-04.10 |
| 3.3 | Transaction form        | Full form: date, amount, type, category, account, description, merchant, payment method, tags, notes | FR-04.1           |
| 3.4 | Form validation         | Zod schema: amount > 0, required fields, valid enums                                                 | FR-04.12          |
| 3.5 | Account balance updates | Auto-update account balance on transaction create/edit/delete                                        | FR-02.4           |
| 3.6 | Split expense support   | Optional `split_with` user + `split_ratio` field                                                     | FR-04.11          |
| 3.7 | Transaction detail view | View full transaction details with edit/delete actions                                               | —                 |
| 3.8 | TanStack Query setup    | Query hooks for transactions with cache invalidation                                                 | —                 |

**Definition of Done:**

- Users can add/edit/delete transactions via full form
- Transaction list paginates at 20/page with sorting
- Account balances auto-update on transaction changes
- Admin can edit/delete any transaction; Contributor only their own

**Tests:**

- Unit: Transaction Zod schemas, balance calculation logic — 10-12 tests
- Integration: Transaction CRUD API, pagination, permission checks — 8-10 tests
- E2E: Add transaction → appears in list, edit transaction, delete transaction — 3-4 Playwright tests

---

### Sprint 4 — Transactions Advanced + Import (Mar 23 – Mar 30)

**Goal:** Filtering, search, receipt upload, CSV import with preview.

| #   | Task                          | Details                                                                   | Spec Ref         |
| --- | ----------------------------- | ------------------------------------------------------------------------- | ---------------- |
| 4.1 | Transaction filtering         | Filter by date range, category, account, type, user, payment method, tags | FR-04.7          |
| 4.2 | Transaction search            | Search by description or merchant text                                    | FR-04.8          |
| 4.3 | Receipt upload                | Upload JPG/PNG/PDF (max 5MB) to Supabase Storage                          | FR-04.5          |
| 4.4 | Receipt viewer                | Display receipt images on transaction detail                              | FR-04.6          |
| 4.5 | CSV template download         | Downloadable template matching Appendix B format                          | FR-12.2          |
| 4.6 | CSV import: upload & preview  | Parse CSV, validate, show preview table                                   | FR-12.3, FR-12.4 |
| 4.7 | CSV import: confirm & execute | Batch insert with success/error reporting                                 | FR-12.5          |
| 4.8 | Supabase Storage policies     | Storage bucket RLS for household-scoped receipt access                    | NFR-04           |

**Definition of Done:**

- All transaction filters work independently and in combination
- Text search finds transactions by description/merchant
- Receipt images upload, persist, and display correctly
- CSV import: template download → upload → preview → confirm → transactions created
- File validation rejects oversized or wrong-type files

**Tests:**

- Unit: CSV parser, file validation (type, size), filter query builder — 10-12 tests
- Integration: Filter/search API params, receipt upload API, import API — 8-10 tests
- E2E: Filter transactions, upload receipt, CSV import flow — 4-5 Playwright tests

---

### Sprint 5 — Budget Management (Mar 30 – Apr 6)

**Goal:** Per-category budgets, overall budget, progress tracking, color-coded alerts.

| #   | Task                        | Details                                                        | Spec Ref         |
| --- | --------------------------- | -------------------------------------------------------------- | ---------------- |
| 5.1 | Budget API routes           | CRUD for category budgets + overall budget, copy-to-next-month | §9.5             |
| 5.2 | Budget management page      | Set/edit monthly budgets per category, set overall cap         | FR-05.1, FR-05.2 |
| 5.3 | Budget auto-copy            | Default new month's budgets from previous month                | FR-05.3          |
| 5.4 | Budget progress calculation | Server-side: spent vs. limit per category for a given month    | FR-05.5          |
| 5.5 | Progress bar UI component   | Color-coded: green (<70%), amber (70-90%), red (>90%)          | FR-05.6          |
| 5.6 | Budget alert notifications  | In-app notification at 80% and 100% threshold                  | FR-05.7, FR-05.8 |
| 5.7 | Overall budget alert        | Overall spending threshold notifications                       | FR-05.9          |
| 5.8 | Email notifications setup   | Configure Resend for budget alert emails                       | FR-05.10         |

**Definition of Done:**

- Admin can set per-category and overall monthly budgets
- Budgets auto-copy from previous month when none exist
- Progress bars render with correct color coding
- Budget threshold notifications fire at 80% and 100% (in-app + email)

**Tests:**

- Unit: Budget calculation logic, threshold detection, color mapping — 10-12 tests
- Integration: Budget API CRUD, budget-copy logic, notification triggers — 8-10 tests
- E2E: Set budget → see progress bar, trigger budget warning — 3-4 Playwright tests

---

### Sprint 6 — Recurring Transactions & Bill Reminders (Apr 6 – Apr 13)

**Goal:** Recurring rules, confirm/skip flow, bill reminders with notifications.

| #    | Task                             | Details                                                | Spec Ref         |
| ---- | -------------------------------- | ------------------------------------------------------ | ---------------- |
| 6.1  | Recurring transaction API        | CRUD for recurring rules, confirm & skip endpoints     | §9.6             |
| 6.2  | Recurring management page        | List rules, create/edit/deactivate                     | FR-06.1, FR-06.2 |
| 6.3  | Recurring reminder notifications | In-app + email when transaction is due                 | FR-06.3          |
| 6.4  | Confirm/skip flow                | Pre-filled transaction form on confirm, skip for month | FR-06.4, FR-06.5 |
| 6.5  | Upcoming recurring list          | Show upcoming recurring transactions                   | FR-06.6          |
| 6.6  | Bill reminder API                | CRUD for bill reminders                                | §9.9             |
| 6.7  | Bill reminder page               | List, create, edit, deactivate reminders               | FR-09.1, FR-09.2 |
| 6.8  | Bill reminder notifications      | In-app + email X days before due date                  | FR-09.3, FR-09.4 |
| 6.9  | Notification center UI           | Bell icon with badge, dropdown panel, mark read        | FR-13            |
| 6.10 | Notifications API                | List, mark-read, mark-all-read endpoints               | §9.12            |

**Definition of Done:**

- Admin can create/edit/deactivate recurring rules
- Confirm creates pre-filled transaction; skip dismisses for the month
- Bill reminders send notifications X days before due date
- Notification center shows all notification types with unread badge

**Tests:**

- Unit: Due date calculation, reminder scheduling logic — 8-10 tests
- Integration: Recurring CRUD + confirm/skip, bill reminder CRUD, notification API — 10-12 tests
- E2E: Create recurring rule → confirm → transaction created, bill reminder notification — 3-4 Playwright tests

---

### Sprint 7 — Savings Goals & Debt Tracking (Apr 13 – Apr 20)

**Goal:** Savings goals with contributions, debt tracking with payoff projection.

| #    | Task                         | Details                                                             | Spec Ref         |
| ---- | ---------------------------- | ------------------------------------------------------------------- | ---------------- |
| 7.1  | Savings goals API            | CRUD goals, add contribution, list contributions                    | §9.7             |
| 7.2  | Savings goals page           | List goals with progress bars, create/edit forms                    | FR-07.1, FR-07.2 |
| 7.3  | Goal detail view             | Contribution history, required monthly amount calculation           | FR-07.5          |
| 7.4  | Goal milestone notifications | Notifications at 25%, 50%, 75%, 100% milestones                     | FR-07.8          |
| 7.5  | Auto-complete goal           | Mark completed when current ≥ target                                | FR-07.7          |
| 7.6  | Debt tracking API            | CRUD debts, log payment endpoint                                    | §9.8             |
| 7.7  | Debt management page         | List debts, create/edit, payment logging form                       | FR-08.1, FR-08.2 |
| 7.8  | Payoff projection            | Calculate projected payoff date from balance, rate, minimum payment | FR-08.3          |
| 7.9  | Debt payment flow            | Log payment → update balance + create transaction                   | FR-08.4          |
| 7.10 | Debt bill reminders          | Auto-generate reminder for debt payment day                         | FR-08.6          |

**Definition of Done:**

- Admin can CRUD savings goals; users can add contributions
- Progress bars and monthly required contribution display correctly
- Milestone notifications fire at 25/50/75/100%
- Debt payments update outstanding balance and create corresponding transaction
- Payoff projection calculates correctly based on interest rate and payments

**Tests:**

- Unit: Payoff projection math, milestone calculation, monthly contribution calc — 10-12 tests
- Integration: Savings & debt CRUD, contribution flow, payment flow — 8-10 tests
- E2E: Create goal → add contribution → progress updates, log debt payment — 3-4 Playwright tests

---

### Sprint 8 — Dashboard (Apr 20 – Apr 27)

**Goal:** Complete dashboard with all 8 widgets, month selector, responsive layout.

| #    | Task                               | Details                                                     | Spec Ref |
| ---- | ---------------------------------- | ----------------------------------------------------------- | -------- |
| 8.1  | Dashboard layout                   | Grid layout with responsive breakpoints                     | §8.3     |
| 8.2  | Widget: Monthly Spending vs Budget | Progress bars per category, color-coded                     | FR-14.2  |
| 8.3  | Widget: Recent Transactions        | Last 10 transactions with quick-add button                  | FR-14.3  |
| 8.4  | Widget: Upcoming Bills             | Next 5 bills with days remaining                            | FR-14.4  |
| 8.5  | Widget: Savings Goals              | Progress bars for active goals                              | FR-14.5  |
| 8.6  | Widget: Income vs Expenses         | Bar chart for current month using Recharts                  | FR-14.6  |
| 8.7  | Widget: Overall Budget             | Circular progress (total spent / total budget)              | FR-14.7  |
| 8.8  | Widget: Account Balances           | Quick view of all accounts                                  | FR-14.8  |
| 8.9  | Month/year selector                | Switch dashboard data by month                              | FR-14.10 |
| 8.10 | Dashboard API aggregation          | Optimized queries for dashboard data (minimize round-trips) | FR-14.9  |

**Definition of Done:**

- Dashboard renders all 8 widgets with real data from previous sprints
- Month selector updates all widgets simultaneously
- Responsive: desktop (grid), tablet (stacked), mobile (single column)
- Dashboard is the default landing page after login

**Tests:**

- Unit: Widget components render with mock data, currency formatting — 10-12 tests
- Integration: Dashboard aggregation API returns correct data — 4-6 tests
- E2E: Dashboard loads with widgets, month selector changes data — 3-4 Playwright tests

---

### Sprint 9 — Reports & Charts (Apr 27 – May 4)

**Goal:** All 6 report types with interactive Recharts, date range filtering.

| #    | Task                        | Details                                               | Spec Ref         |
| ---- | --------------------------- | ----------------------------------------------------- | ---------------- |
| 9.1  | Reports page layout         | Metric cards + chart area with filter controls        | —                |
| 9.2  | Report: Monthly Summary     | Total income, expenses, net, MoM comparison           | FR-10.1          |
| 9.3  | Report: Category Breakdown  | Pie/donut chart by category                           | FR-10.2          |
| 9.4  | Report: Income vs Expenses  | Bar chart over 6/12 months                            | FR-10.3          |
| 9.5  | Report: Net Worth Over Time | Line chart (assets − debts)                           | FR-10.4          |
| 9.6  | Report: Budget vs Actual    | Grouped bar chart per category                        | FR-10.5          |
| 9.7  | Report: Spending Trends     | Line chart by category over time                      | FR-10.6          |
| 9.8  | Report filtering            | Date range, account, category, user filters           | FR-10.7, FR-10.8 |
| 9.9  | Key metrics cards           | Total income, expenses, net savings, budget remaining | FR-10.9          |
| 9.10 | Reports API routes          | All 6 report data endpoints                           | §9.10            |

**Definition of Done:**

- All 6 chart types render with real data
- Filters update charts dynamically
- Key metric cards display correct aggregated values
- Charts are responsive and readable on mobile

**Tests:**

- Unit: Chart data transformation functions, metric calculations — 8-10 tests
- Integration: Report API endpoints return correct aggregations — 6-8 tests
- E2E: Navigate to reports, filter by date, charts render — 3-4 Playwright tests

---

### Sprint 10 — Export, Dark Mode & PWA (May 4 – May 11)

**Goal:** CSV/PDF export, dark/light mode toggle, PWA installability.

| #    | Task                   | Details                                                              | Spec Ref         |
| ---- | ---------------------- | -------------------------------------------------------------------- | ---------------- |
| 10.1 | CSV export             | Export filtered transactions to CSV file                             | FR-11.1, FR-11.3 |
| 10.2 | PDF export             | Monthly summary report as PDF with charts/tables                     | FR-11.2, FR-11.4 |
| 10.3 | Dark/light mode        | Theme toggle with system preference detection, persistent preference | NFR-17           |
| 10.4 | PWA configuration      | Web manifest, service worker, installable on mobile                  | NFR-03           |
| 10.5 | PWA icons & splash     | App icons (192px, 512px), splash screens                             | NFR-03           |
| 10.6 | Offline shell          | Basic offline page when no network                                   | NFR-03           |
| 10.7 | KES formatting utility | Consistent currency display across app                               | NFR-13           |
| 10.8 | Date formatting        | DD/MM/YYYY format throughout                                         | NFR-14           |

**Definition of Done:**

- CSV export downloads file with all transaction fields
- PDF export generates readable report with chart snapshots
- Dark/light mode toggles correctly with persisted preference
- PWA installable on mobile, shows app icon on home screen
- All monetary amounts display as `KES X,XXX.XX`

**Tests:**

- Unit: CSV generation, date/currency formatting, theme toggle — 8-10 tests
- Integration: Export API endpoints return correct file formats — 4-6 tests
- E2E: Export CSV, toggle dark mode, PWA install prompt — 3-4 Playwright tests

---

### Sprint 11 — Polish, Accessibility & Comprehensive Testing (May 11 – May 18)

**Goal:** Accessibility audit, comprehensive E2E suite, performance optimization, bug fixes.

| #     | Task                     | Details                                                               | Spec Ref  |
| ----- | ------------------------ | --------------------------------------------------------------------- | --------- |
| 11.1  | Accessibility audit      | WCAG 2.1 AA: color contrast, keyboard nav, ARIA labels, screen reader | NFR-16    |
| 11.2  | Toast notifications      | Success/error toasts on all CRUD operations                           | NFR-15    |
| 11.3  | Error boundaries         | Global and route-level error boundaries                               | —         |
| 11.4  | Loading states           | Skeleton loaders for all data-driven pages                            | —         |
| 11.5  | Comprehensive E2E suite  | Full user journey tests covering all major flows                      | —         |
| 11.6  | Performance optimization | Image optimization, code splitting, API query optimization            | NFR-02    |
| 11.7  | Security review          | Verify all RLS policies, input sanitization, CSP headers              | NFR-04–08 |
| 11.8  | Mobile responsive QA     | Test all breakpoints: 320px, 768px, 1024px, 1440px+                   | NFR-01    |
| 11.9  | Bug fixes & edge cases   | Address issues found during testing                                   | —         |
| 11.10 | Production deployment    | Final deploy, verify environment variables, monitor                   | §12       |
| 11.11 | UAT with stakeholders    | Walkthrough with both users (Admin & Contributor)                     | —         |

**Definition of Done:**

- All WCAG 2.1 AA checks pass (axe-core)
- Full E2E regression suite green (~40-50 tests)
- Lighthouse performance score ≥ 90
- Both users complete UAT walkthrough successfully
- Production deployment verified and stable

**Tests:**

- Full E2E regression suite: 15-20 additional Playwright tests covering critical paths
- Accessibility tests: axe-core integration in Playwright tests
- Performance: Lighthouse CI checks in GitHub Actions

---

## 6. Milestones & Verification

### 6.1 Milestone Schedule

| Milestone                   | Sprint    | Date         | Criteria                                                           |
| --------------------------- | --------- | ------------ | ------------------------------------------------------------------ |
| **M1: Foundation**          | Sprint 0  | Mar 2, 2026  | Project running locally, DB schema deployed, CI pipeline green     |
| **M2: Auth Complete**       | Sprint 1  | Mar 9, 2026  | Full auth flow working, household creation, protected routes       |
| **M3: Core Data Entry**     | Sprint 4  | Mar 30, 2026 | Accounts, categories, transactions (full CRUD + filters + import)  |
| **M4: Budget Intelligence** | Sprint 6  | Apr 13, 2026 | Budgets, recurring, bill reminders, notifications all functional   |
| **M5: Goals & Dashboard**   | Sprint 8  | Apr 27, 2026 | Savings, debts, full dashboard with all 8 widgets                  |
| **M6: MVP Launch 🚀**       | Sprint 11 | May 18, 2026 | Reports, export, PWA, accessibility, UAT complete, production live |

### 6.2 Per-Sprint Verification Checklist

- [ ] All CI checks pass (lint, type-check, unit tests, E2E)
- [ ] New tests written for all new features
- [ ] Feature branch merged to main via PR
- [ ] Vercel preview deploy verified
- [ ] Sprint tasks marked complete in project tracker
- [ ] Feature demo/walkthrough (async or live)

### 6.3 Pre-Release Verification (Sprint 11)

- [ ] Full E2E regression suite passes
- [ ] Lighthouse scores: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95
- [ ] axe-core accessibility scan: 0 critical/serious violations
- [ ] Security checklist: All RLS policies verified, CSP headers set, no exposed secrets
- [ ] Mobile responsive: tested on 320px, 375px, 768px, 1024px, 1440px
- [ ] Both users complete UAT checklist
- [ ] Production environment variables correctly configured
- [ ] Supabase production schema matches dev
- [ ] Monitoring and error tracking operational

---

## 7. Prompt Files

The following prompt files will be created in `.github/prompts/` to guide AI-assisted development:

| File                        | Purpose                                                                                                              | Used In     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------- |
| `project-setup.prompt.md`   | Full scaffolding instructions: Next.js init, dependency installation, tooling config, folder structure               | Sprint 0    |
| `database-schema.prompt.md` | Complete SQL for all 13 tables, constraints, indexes, RLS policies, seed data, type generation                       | Sprint 0    |
| `api-route.prompt.md`       | Pattern/template for Next.js App Router API routes: Supabase client, Zod validation, role-based auth, error handling | Sprint 1+   |
| `ui-component.prompt.md`    | Component conventions: shadcn/ui usage, form patterns (RHF + Zod), TanStack Query hooks, responsive design           | Sprint 1+   |
| `testing.prompt.md`         | Test patterns: Vitest config, RTL for components, API route integration tests, Playwright page objects & fixtures    | Sprint 0+   |
| `ci-cd-pipeline.prompt.md`  | GitHub Actions YAML for CI and E2E workflows, Vercel integration, environment variable setup                         | Sprint 0    |
| `supabase-rls.prompt.md`    | Row-Level Security policy patterns: household isolation, role-based access, storage policies                         | Sprint 0    |
| `feature-sprint.prompt.md`  | Sprint execution workflow: schema → API → UI → tests → PR. Checklist and conventions for feature development         | All sprints |

---

## Appendix: Risk Mitigations for Timeline

| Risk                      | Mitigation                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| Sprint overrun            | Each sprint has a clear "Definition of Done" — incomplete work rolls to next sprint with scope adjustment |
| Blocked on Supabase setup | Sprint 0 allocates full week for infrastructure; local Supabase dev reduces cloud dependency              |
| Complex PDF export        | PDF export (Sprint 10) uses `@react-pdf/renderer`; fallback to HTML-to-PDF if charts prove difficult      |
| E2E test flakiness        | Playwright tests use stable selectors (data-testid), retry config, and isolated test data per run         |
| Scope creep               | All Phase 2+ features explicitly deferred; any new requests logged but not added to current sprint        |

---

_FamFin Implementation Plan v1.0 — February 24, 2026_

_Prepared for development commencement pending approval_
