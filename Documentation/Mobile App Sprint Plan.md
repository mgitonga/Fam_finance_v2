# FamFin Mobile — Sprint Plan

**14 × 1-Week Sprints · Solo Developer · ~20 Story Points / Sprint**

---

| Field             | Value                                  |
| ----------------- | -------------------------------------- |
| Document Version  | 1.0                                    |
| Date              | March 5, 2026                          |
| Plan Reference    | Mobile App Plan v1.0                   |
| Sprint Cadence    | 1-week sprints (Monday → Friday)       |
| Total Sprints     | 14                                     |
| Team              | 1 developer                            |
| Estimation        | Fibonacci story points (1, 2, 3, 5, 8) |
| Target Velocity   | ~20 pts/sprint                         |
| Start Date        | March 9, 2026                          |
| Target Completion | June 12, 2026                          |

---

## Sprint Overview

| Sprint | Phase   | Focus                             | Points  |
| ------ | ------- | --------------------------------- | ------- |
| S1     | Phase 0 | Monorepo restructure & shared pkg | 21      |
| S2     | Phase 1 | Backend auth + Expo scaffold      | 21      |
| S3     | Phase 1 | API client, hooks, auth provider  | 19      |
| S4     | Phase 2 | Design system + UI components     | 21      |
| S5     | Phase 2 | Dashboard screens + charts        | 21      |
| S6     | Phase 2 | Transaction list + filters        | 20      |
| S7     | Phase 2 | Transaction CRUD + receipt upload | 19      |
| S8     | Phase 2 | Budgets + Bills screens           | 21      |
| S9     | Phase 2 | More tab, Settings, Notifications | 18      |
| S10    | Phase 3 | Push notifications + biometrics   | 21      |
| S11    | Phase 3 | Camera receipts + offline (read)  | 20      |
| S12    | Phase 3 | Offline (write/sync) + widgets    | 21      |
| S13    | Phase 4 | Polish, animations, accessibility | 19      |
| S14    | Phase 4 | Testing, store assets, submission | 21      |
|        |         | **Total**                         | **283** |

---

## Sprint 1 — Monorepo Restructure & Shared Package

**Phase 0 · Week of March 9, 2026**

| #   | Task                                                                                                   | Points |
| --- | ------------------------------------------------------------------------------------------------------ | ------ |
| 1.1 | Move existing Next.js app into `apps/web/` directory; update all path references                       | 5      |
| 1.2 | Update `pnpm-workspace.yaml` to declare `apps/*` and `packages/*` workspaces                           | 1      |
| 1.3 | Create `packages/shared/` with `package.json` (`@famfin/shared`), `tsconfig.json`, barrel `index.ts`   | 3      |
| 1.4 | Extract all Zod validation schemas (`src/lib/validations/*.ts`) into `packages/shared/validations/`    | 3      |
| 1.5 | Extract database types (`src/types/database.ts`) and constants (`src/lib/constants.ts`) into shared    | 2      |
| 1.6 | Extract pure utility functions (budget calc, payoff projection, milestone check, due date) into shared | 3      |
| 1.7 | Create `queryKeys.ts` factory in shared — extract all query key patterns from `src/hooks/`             | 2      |
| 1.8 | Refactor all `apps/web/` imports to use `@famfin/shared`; fix any TS errors                            | 2      |

**Sprint Total: 21 points**

### Acceptance Criteria

- [ ] Repository structure is `apps/web/`, `apps/mobile/` (empty placeholder), `packages/shared/`
- [ ] `pnpm install` succeeds from monorepo root with no errors
- [ ] `pnpm --filter web build` completes successfully (web app builds)
- [ ] `pnpm --filter web test` passes — all existing unit/integration tests green
- [ ] `@famfin/shared` exports: all Zod schemas, database types, constants, utility functions, query key factory
- [ ] `apps/web/` has zero local imports of moved modules — all reference `@famfin/shared`
- [ ] TypeScript compilation succeeds with `--noEmit` across all workspaces
- [ ] Web app runs locally (`pnpm --filter web dev`) and all pages function identically to pre-restructure

---

## Sprint 2 — Backend Auth Adaptation & Expo Scaffold

**Phase 1a · Week of March 16, 2026**

| #   | Task                                                                                                                                                     | Points |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2.1 | Update `getAuthContext()` in `auth-helpers.ts` to check `Authorization: Bearer` header before cookies                                                    | 5      |
| 2.2 | Update `createClient()` in `server.ts` to accept optional JWT parameter for token-based RLS                                                              | 3      |
| 2.3 | Add CORS headers in `next.config.ts` for Expo dev server + production mobile origins                                                                     | 2      |
| 2.4 | Test all core API endpoints with Bearer token auth via Postman/curl (dashboard, transactions, budgets, bills, accounts, categories, auth, notifications) | 3      |
| 2.5 | Initialize Expo project in `apps/mobile/` using `create-expo-app` (blank TS template)                                                                    | 2      |
| 2.6 | Install all core dependencies (expo-router, nativewind, supabase-js, tanstack-query, react-hook-form, zod, etc.)                                         | 2      |
| 2.7 | Configure NativeWind v4 with Babel/Metro plugin; create `tailwind.config.ts` inheriting shared design tokens                                             | 3      |
| 2.8 | Set up Expo Router file structure: `(auth)/`, `(tabs)/`, `modals/` with placeholder screens                                                              | 1      |

**Sprint Total: 21 points**

### Acceptance Criteria

- [ ] API endpoints accept `Authorization: Bearer <valid_supabase_jwt>` and return correct data (same as cookie-based)
- [ ] API returns 401 for missing/invalid/expired Bearer tokens
- [ ] Cookie-based auth (web) continues to work unchanged — no regressions
- [ ] CORS headers allow requests from `http://localhost:8081` (Expo dev) and configured production origins
- [ ] Expo app starts on both iOS Simulator and Android Emulator (`pnpm --filter mobile start`)
- [ ] NativeWind compiles and a test `<Text className="text-blue-500">Hello</Text>` renders with correct color
- [ ] Expo Router resolves all placeholder screens (auth, tabs, modals) without crashes
- [ ] `pnpm --filter web test` still green (backend changes didn't break web)

---

## Sprint 3 — API Client, Mobile Hooks & Auth Provider

**Phase 1b · Week of March 23, 2026**

| #   | Task                                                                                                                     | Points |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| 3.1 | Create `api-client.ts` — fetch wrapper with base URL, Bearer token injection, 401 handling, JSON parsing                 | 5      |
| 3.2 | Create auth provider with Supabase JS + SecureStore: `signIn`, `signUp`, `signOut`, `resetPassword`, `onAuthStateChange` | 5      |
| 3.3 | Implement auth navigation gate: unauthenticated → `(auth)`, authenticated → `(tabs)`                                     | 3      |
| 3.4 | Port `use-dashboard.ts` hook to mobile (first hook — validates full API client flow)                                     | 2      |
| 3.5 | Port `use-transactions.ts` hook (queries + all mutations: create, update, delete, upload)                                | 2      |
| 3.6 | Port remaining hooks: `use-accounts`, `use-budgets`, `use-bills`, `use-categories`, `use-notifications`                  | 2      |

**Sprint Total: 19 points**

### Acceptance Criteria

- [ ] User can register a new account from the mobile app and land on the dashboard placeholder
- [ ] User can log in with existing credentials and see authenticated tab navigation
- [ ] User can log out and is returned to the login screen
- [ ] Password reset flow sends email successfully
- [ ] Auth token persists across app restarts (SecureStore) — no re-login required
- [ ] API client automatically attaches Bearer token to all requests
- [ ] API client handles 401 by clearing session and redirecting to login
- [ ] Dashboard hook returns data from API when called from a test component
- [ ] Transaction hook can fetch paginated transactions from the API
- [ ] All 6 ported hooks can successfully perform GET requests against the live API

---

## Sprint 4 — Design System & UI Components

**Phase 2a · Week of March 30, 2026**

| #   | Task                                                                                                                               | Points |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 4.1 | Build `Button` component — primary, secondary, outline, destructive variants; loading state; disabled state; 44px min touch target | 3      |
| 4.2 | Build `Input` component — text, number, password, date types; error state; label; prefix/suffix; currency formatting               | 3      |
| 4.3 | Build `Card`, `Badge`, `Avatar` components with NativeWind styling                                                                 | 2      |
| 4.4 | Build `BottomSheet` component (react-native-bottom-sheet) — drag handle, snap points, keyboard-aware                               | 3      |
| 4.5 | Build `Modal`, `Toast`, `Skeleton`, `EmptyState`, `ErrorBoundary` components                                                       | 3      |
| 4.6 | Build `Select` / `Picker` component — single select, searchable option list in bottom sheet                                        | 3      |
| 4.7 | Build bottom tab bar layout — 5 tabs (Dashboard, Transactions, Add FAB, Budgets, More); safe area; dark/light theme                | 3      |
| 4.8 | Build pull-to-refresh wrapper; configure `QueryProvider` and `ThemeProvider` in root layout                                        | 1      |

**Sprint Total: 21 points**

### Acceptance Criteria

- [ ] All UI components render correctly on both iOS and Android
- [ ] All interactive components meet 44×44px minimum touch target
- [ ] Components support dark mode and light mode — toggle works via theme provider
- [ ] `Button` shows loading spinner, disabled state is visually distinct and non-interactive
- [ ] `Input` displays validation errors, currency formatting works for KES amounts
- [ ] `BottomSheet` opens/closes smoothly, handles keyboard avoidance
- [ ] `Toast` displays success/error messages and auto-dismisses
- [ ] `Skeleton` renders loading placeholders matching component shapes
- [ ] Tab bar renders all 5 tabs with icons; center Add button is visually distinct (FAB style)
- [ ] Safe area insets are respected on notched devices (iPhone X+, Android cutouts)
- [ ] Pull-to-refresh triggers data refetch via TanStack Query `refetch()`

---

## Sprint 5 — Dashboard Screens & Charts

**Phase 2b · Week of April 6, 2026**

| #   | Task                                                                                                              | Points |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------ |
| 5.1 | Build Dashboard screen layout — scrollable vertical layout with month/year selector at top                        | 2      |
| 5.2 | Build `MetricCards` — horizontal ScrollView with 4 metric cards (income, expenses, net savings, budget remaining) | 3      |
| 5.3 | Build `BudgetProgress` widget — list of category budgets with color-coded progress bars (green/amber/red)         | 3      |
| 5.4 | Build `RecentTransactions` widget — last 5 transactions as touchable rows linking to detail                       | 2      |
| 5.5 | Build `UpcomingBills` widget — card list with days-until-due badges                                               | 2      |
| 5.6 | Build `AccountBalances` widget — card list showing all accounts and balances                                      | 2      |
| 5.7 | Build `OverallBudgetWidget` — circular progress indicator (spent vs cap)                                          | 2      |
| 5.8 | Build `IncomeVsExpense` chart using `victory-native` — grouped bar chart for current month                        | 3      |
| 5.9 | Integrate all widgets with `useDashboard` hook; implement pull-to-refresh and loading skeletons                   | 2      |

**Sprint Total: 21 points**

### Acceptance Criteria

- [ ] Dashboard loads data from `GET /api/dashboard?month=X&year=Y` and displays all 7 widgets + 1 chart
- [ ] Month/year selector changes the data displayed across all widgets
- [ ] Metric cards show correct totals matching the web dashboard for the same month
- [ ] Budget progress bars use correct color coding: green (<75%), amber (75–90%), red (>90%)
- [ ] Tapping a recent transaction navigates to transaction detail screen (placeholder OK)
- [ ] Upcoming bills display `daysLeft` badge accurately
- [ ] Overall budget widget shows circular progress with percentage
- [ ] Income vs Expense chart renders with correct data in `victory-native`
- [ ] Pull-to-refresh re-fetches dashboard data
- [ ] Loading state shows skeleton placeholders
- [ ] Empty states display for widgets with no data (e.g., "No bills set up yet")
- [ ] Dashboard renders correctly on both iOS and Android, in both light and dark mode

---

## Sprint 6 — Transaction List & Filters

**Phase 2c · Week of April 13, 2026**

| #   | Task                                                                                                                     | Points |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| 6.1 | Build transaction list screen — `FlatList` with infinite scroll pagination (page + limit params)                         | 5      |
| 6.2 | Build transaction row component — date, description, amount (colored by type), category icon/name, account               | 3      |
| 6.3 | Build filter bottom sheet — type (income/expense), category picker, account picker, date range (from/to), payment method | 5      |
| 6.4 | Build search bar with debounced input (300ms) — searches description + merchant fields                                   | 2      |
| 6.5 | Build sort toggle — sort by date (default) or amount, ascending/descending                                               | 2      |
| 6.6 | Build swipe-to-delete with confirmation alert on transaction rows                                                        | 3      |

**Sprint Total: 20 points**

### Acceptance Criteria

- [ ] Transaction list loads first page (20 items) from `GET /api/transactions` on mount
- [ ] Scrolling to bottom triggers next page load — infinite scroll works until all pages loaded
- [ ] Pagination indicator shows loading spinner at bottom while fetching next page
- [ ] Each transaction row displays: date, description, amount (green for income, red for expense), category name + icon, account name
- [ ] Filter bottom sheet opens from filter icon in header
- [ ] Applying filters updates the list — API receives correct query parameters
- [ ] Active filter count badge shown on filter icon
- [ ] Clearing all filters resets list to unfiltered state
- [ ] Search input filters transactions by description/merchant with 300ms debounce
- [ ] Sort toggle switches between date and amount sorting; tapping same sort reverses order
- [ ] Swiping a transaction left reveals delete button; tapping shows confirmation; confirming deletes and updates list
- [ ] Empty state shown when no transactions match filters/search

---

## Sprint 7 — Transaction CRUD & Receipt Upload

**Phase 2d · Week of April 20, 2026**

| #   | Task                                                                                                                  | Points |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------ |
| 7.1 | Build transaction detail screen — read-only view with all fields, edit button, delete button                          | 3      |
| 7.2 | Build transaction form (shared for create + edit) — all fields with `react-hook-form` + Zod from shared               | 5      |
| 7.3 | Build hierarchical category picker — show parents, tap to expand children, only leaf categories selectable            | 3      |
| 7.4 | Build add-transaction modal from center FAB — streamlined quick-entry form                                            | 3      |
| 7.5 | Integrate receipt upload — `expo-image-picker` (camera + gallery) → upload to `POST /api/transactions/upload-receipt` | 3      |
| 7.6 | Wire transaction creation: form submit → API call → invalidate queries → navigate back; handle errors                 | 2      |

**Sprint Total: 19 points**

### Acceptance Criteria

- [ ] Tapping a transaction in the list navigates to detail screen showing all fields
- [ ] Edit button on detail screen opens form pre-populated with transaction data
- [ ] Transaction form validates all fields using Zod schemas from `@famfin/shared`
- [ ] Form shows inline validation errors (red border + message) for invalid inputs
- [ ] Category picker shows only parent categories initially; tapping expands children; only leaf categories are selectable
- [ ] Account picker lists all active accounts
- [ ] Date picker uses native iOS/Android date selector
- [ ] Amount input formats as KES currency
- [ ] FAB center button opens add-transaction modal (bottom sheet or full-screen)
- [ ] Creating a transaction: form submits → API call → success toast → list refreshes with new item → account balance updated
- [ ] Editing a transaction: saves changes → success toast → detail screen shows updated data
- [ ] Receipt attachment: user can capture from camera or select from gallery
- [ ] Receipt image displays as thumbnail on transaction detail
- [ ] Receipt upload succeeds and `receipt_url` is associated with the transaction
- [ ] Error states: network failure shows retry option; validation failure shows specific field errors

---

## Sprint 8 — Budgets & Bills Screens

**Phase 2e · Week of April 27, 2026**

| #   | Task                                                                                                                          | Points |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ------ |
| 8.1 | Build budget list screen — month/year selector, overall budget card (circular progress), per-category list with progress bars | 5      |
| 8.2 | Build budget sub-category expandable rows — tap parent row to reveal sub-category spending breakdown                          | 3      |
| 8.3 | Build budget create/edit bottom sheet — category picker (parents only), amount input, month/year pre-filled                   | 3      |
| 8.4 | Implement budget copy-forward — button to copy from previous month (`POST /api/budgets/copy`)                                 | 2      |
| 8.5 | Build bill reminders list screen — active bills with due day, amount, category, days-until-due badge                          | 3      |
| 8.6 | Build bill create/edit form — name, amount, due day, category, reminder days, notification method                             | 3      |
| 8.7 | Wire bill delete with confirmation; handle soft-delete (`is_active = false`)                                                  | 2      |

**Sprint Total: 21 points**

### Acceptance Criteria

- [ ] Budget screen loads data from `GET /api/budgets?month=X&year=Y` and `GET /api/budgets/overall?month=X&year=Y`
- [ ] Month/year selector changes displayed budget data
- [ ] Overall budget shows circular progress: spent / cap with percentage
- [ ] Per-category budget rows show: category name + icon, spent/budget amounts, progress bar
- [ ] Progress bars are color-coded: green (<75%), amber (75–90%), red (>90%)
- [ ] Tapping a parent category row expands to show sub-category spending breakdown
- [ ] Creating a budget: opens bottom sheet → select parent category → enter amount → save → list updates
- [ ] Editing a budget: tap edit icon → bottom sheet pre-filled → change amount → save
- [ ] Deleting a budget: confirmation → delete → list updates
- [ ] Copy-forward: button present when no budgets exist for current month → copies from previous month → success toast
- [ ] Budget can only be set on parent categories (API enforces, UI only shows parents in picker)
- [ ] Bill reminders list shows: name, KES amount, due day (e.g., "15th"), category, days-until-due badge
- [ ] Creating a bill: form validates → saves → list updates
- [ ] Editing a bill: form pre-filled → save → list updates
- [ ] Deleting a bill: confirmation → soft-delete → item removed from list

---

## Sprint 9 — More Tab, Settings & Notifications

**Phase 2f · Week of May 4, 2026**

| #   | Task                                                                                                                                                                                           | Points |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 9.1 | Build More tab menu screen — sectioned list: Settings, Notifications, Reports (placeholder), Savings (placeholder), Debts (placeholder), Recurring (placeholder), Export (placeholder), Logout | 3      |
| 9.2 | Build profile settings screen — edit name (`PUT /api/users/me`), display email (read-only)                                                                                                     | 2      |
| 9.3 | Build theme toggle — dark/light/system modes via NativeWind theme provider                                                                                                                     | 2      |
| 9.4 | Build accounts management screen (admin only) — list, create, edit, soft-delete accounts                                                                                                       | 3      |
| 9.5 | Build user management screen (admin only) — list users, change roles (`PUT /api/users/:id/role`), invite user (`POST /api/auth/invite`)                                                        | 3      |
| 9.6 | Build notification center screen — list notifications, mark individual as read, mark all as read, unread count badge on More tab                                                               | 3      |
| 9.7 | Add role-based UI guards — hide admin-only actions (account CRUD, user management, budget create/edit, bill create/edit) for contributors                                                      | 2      |

**Sprint Total: 18 points**

### Acceptance Criteria

- [ ] More tab shows organized menu with all sections; Phase 2 items show with "Coming soon" labels
- [ ] Profile screen displays user name (editable) and email (read-only); save updates name via API
- [ ] Theme toggle switches between dark, light, and system modes; preference persists across restarts
- [ ] Admin users see Accounts and User Management menu items; contributors do not
- [ ] Accounts screen (admin): can create new account, edit existing, soft-delete (confirmation required)
- [ ] User management (admin): displays all household members with roles; can change role (cannot change own); can invite new user by email
- [ ] Invite sends email via Supabase auth — invitee receives invitation
- [ ] Notification center shows last 50 notifications ordered by newest first
- [ ] Unread notifications have visual distinction (bold/dot); tapping marks as read
- [ ] "Mark all as read" button clears all unread indicators
- [ ] Unread count badge appears on the More tab icon when unread > 0
- [ ] Logout clears SecureStore tokens, clears query cache, navigates to login screen
- [ ] Contributor role cannot access create/edit/delete actions for budgets, bills, accounts, or users

---

## Sprint 10 — Push Notifications & Biometric Auth

**Phase 3a · Week of May 11, 2026**

| #    | Task                                                                                                                                             | Points |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 10.1 | Create Supabase migration `00005_push_tokens.sql` — `push_tokens` table with `user_id`, `token`, `platform`, `created_at`; RLS policies          | 3      |
| 10.2 | Create API routes: `POST /api/users/me/push-token` (register), `DELETE /api/users/me/push-token` (deregister on logout)                          | 3      |
| 10.3 | Integrate `expo-notifications` — request permissions, obtain push token, register with API on login                                              | 3      |
| 10.4 | Build server-side push delivery service — modify `createNotification()` to trigger Expo Push API for users with registered tokens                | 5      |
| 10.5 | Handle push notifications in-app: foreground → toast, background/quit → tap opens deep link to relevant screen                                   | 2      |
| 10.6 | Implement biometric auth via `expo-local-authentication` — opt-in prompt after first login, SecureStore preference, biometric gate on app launch | 3      |
| 10.7 | Add auto-lock setting — lock app after configurable inactivity (1/5/15/30 min); fallback to password                                             | 2      |

**Sprint Total: 21 points**

### Acceptance Criteria

- [ ] `push_tokens` table exists in Supabase with correct schema and RLS policies (user can only read/write own tokens)
- [ ] On login, app requests notification permissions (iOS prompt, Android auto-granted)
- [ ] Push token is registered via `POST /api/users/me/push-token` on successful login
- [ ] Push token is deregistered via `DELETE /api/users/me/push-token` on logout
- [ ] Budget threshold notification (>90% spent) triggers push to all household members with registered tokens
- [ ] Bill reminder push sent X days before due date to relevant household members
- [ ] Push received while app is in foreground → in-app toast (not system notification)
- [ ] Push received while app is in background → system notification → tapping opens correct screen
- [ ] After first login, user is prompted: "Enable Face ID/fingerprint unlock?"
- [ ] If enabled: next app launch shows biometric prompt before revealing content
- [ ] Biometric failure → fallback button to enter email/password
- [ ] Auto-lock: app locks after configured inactivity period; shows biometric/password screen
- [ ] Auto-lock setting configurable in Settings (1/5/15/30 minutes, or disabled)
- [ ] All above works on both iOS (Face ID / Touch ID) and Android (fingerprint / face)

---

## Sprint 11 — Camera Receipts & Offline Read Cache

**Phase 3b · Week of May 18, 2026**

| #    | Task                                                                                                                            | Points |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 11.1 | Build receipt capture flow — `expo-image-picker` with camera + gallery options, preview before upload                           | 3      |
| 11.2 | Integrate receipt image crop/rotate before submission                                                                           | 2      |
| 11.3 | Upload receipt to `POST /api/transactions/upload-receipt`; link to new or existing transaction                                  | 2      |
| 11.4 | Display receipt thumbnail on transaction detail; tap to view full-size image                                                    | 2      |
| 11.5 | Implement connectivity listener (`@react-native-community/netinfo`) — detect online/offline state, show offline badge in header | 3      |
| 11.6 | Build read cache layer — cache GET responses (dashboard, accounts, categories, recent transactions) in AsyncStorage with TTL    | 5      |
| 11.7 | Serve cached data when offline — show stale data with "offline" visual indicator                                                | 3      |

**Sprint Total: 20 points**

### Acceptance Criteria

- [ ] Tapping "Add receipt" on transaction form/detail opens action sheet: "Take Photo" or "Choose from Gallery"
- [ ] Camera opens and captured image is shown in preview
- [ ] Gallery opens and selected image is shown in preview
- [ ] Preview screen allows crop and rotate before confirming
- [ ] Confirming upload sends image to API and returns `receipt_url`
- [ ] Receipt thumbnail visible on transaction detail screen; tapping opens full-size viewer
- [ ] Offline badge appears in header bar within 2 seconds of losing connectivity
- [ ] Offline badge disappears when connectivity resumes
- [ ] When offline: dashboard shows last cached data with "Last updated X ago" label
- [ ] When offline: transaction list shows cached transactions
- [ ] When offline: categories and accounts data available from cache
- [ ] When coming back online: automatic background refetch refreshes stale cache
- [ ] Cache respects TTL — stale data older than threshold triggers refetch when online
- [ ] First launch with no cache and no connectivity shows empty state with "No cached data" message

---

## Sprint 12 — Offline Write Queue & Home Screen Widgets

**Phase 3c · Week of May 25, 2026**

| #    | Task                                                                                                                                   | Points |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 12.1 | Build offline write queue — queue mutations (create transaction, update budget) in AsyncStorage with timestamps and operation metadata | 5      |
| 12.2 | Show sync-pending visual indicator on locally-created items (clock/sync icon)                                                          | 2      |
| 12.3 | Build sync-on-reconnect logic — replay queued operations in order when connectivity resumes; handle success/failure per item           | 5      |
| 12.4 | Implement conflict resolution (last-write-wins with server timestamp); show sync failure toast with retry for failed items             | 3      |
| 12.5 | Build iOS home screen widget (small) — monthly spending summary (income, expenses, net) via `expo-widget` or config plugin             | 3      |
| 12.6 | Build Android home screen widget — equivalent spending summary widget                                                                  | 3      |

**Sprint Total: 21 points**

### Acceptance Criteria

- [ ] When offline: creating a transaction succeeds locally — item appears in list with sync-pending icon
- [ ] When offline: multiple transactions can be queued — all show sync-pending indicators
- [ ] When connectivity resumes: queued items sync automatically to server in chronological order
- [ ] After successful sync: sync-pending icon disappears; data matches server state
- [ ] Sync failure on individual item: toast with error message; item remains in queue with retry option
- [ ] Conflict scenario: if server data was modified by another user, last-write-wins resolves silently
- [ ] Sync status summary: "3/3 items synced successfully" or "2/3 synced, 1 failed" toast
- [ ] Offline queue persists across app restarts (stored in AsyncStorage)
- [ ] iOS widget: displays current month income, expenses, net savings — updates via background fetch
- [ ] Android widget: displays same data as iOS widget
- [ ] Widgets update at least every 15 minutes (iOS) / 30 minutes (Android) via background refresh
- [ ] Tapping widget opens the app to the dashboard screen

---

## Sprint 13 — Polish, Animations & Accessibility

**Phase 4a · Week of June 1, 2026**

| #    | Task                                                                                                                         | Points |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ------ |
| 13.1 | Add `react-native-reanimated` animations: screen transitions, list item enter/exit, bottom sheet spring, FAB press scale     | 3      |
| 13.2 | Add haptic feedback (`expo-haptics`) on key actions: add transaction confirm, swipe-delete, FAB tap, pull-to-refresh release | 2      |
| 13.3 | Audit and add `accessibilityLabel` / `accessibilityRole` / `accessibilityHint` to all interactive elements                   | 3      |
| 13.4 | Implement dynamic font scaling support — test with iOS/Android accessibility font size settings                              | 2      |
| 13.5 | Audit contrast ratios across all screens (light + dark mode) — fix any failing WCAG 2.1 AA checks                            | 2      |
| 13.6 | Build global error boundary — catch React render errors, show recovery UI with retry/reset                                   | 2      |
| 13.7 | Build network error retry UI — inline retry button on failed API requests                                                    | 2      |
| 13.8 | Verify empty states exist for all list screens: transactions, budgets, bills, notifications, accounts                        | 2      |
| 13.9 | Session expiry handling — detect 401 mid-session, show "Session expired" alert, navigate to login                            | 1      |

**Sprint Total: 19 points**

### Acceptance Criteria

- [ ] Screen transitions use smooth animated fades/slides (not instant jumps)
- [ ] Bottom sheets animate with spring physics on open/close
- [ ] FAB button has a press-down scale animation
- [ ] List items animate in on first load (staggered fade-in)
- [ ] Haptic feedback fires on: transaction created, swipe-delete triggered, FAB tapped, pull-to-refresh released
- [ ] VoiceOver (iOS) and TalkBack (Android) can navigate all screens — all buttons, inputs, and interactive elements are announced
- [ ] Screen reader announces: button labels, input descriptions, error messages, list items, navigation tabs
- [ ] App remains usable with iOS "Largest" text size setting — no text truncation, scrollable content
- [ ] All text/background color pairs pass WCAG 2.1 AA contrast ratio (4.5:1 for normal text, 3:1 for large)
- [ ] Error boundary catches render crashes and shows "Something went wrong" screen with "Try Again" button
- [ ] Network errors on any API call show inline "Failed to load. Tap to retry" with retry button
- [ ] All list screens show appropriate empty states with helpful messages when no data exists
- [ ] 401 response mid-session shows "Session expired, please log in again" alert → navigates to login

---

## Sprint 14 — Testing, Store Assets & Submission

**Phase 4b · Week of June 8, 2026**

| #    | Task                                                                                                                                   | Points |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 14.1 | Write unit tests: shared Zod schemas, API client (mock fetch), auth flow logic, offline queue/sync logic                               | 5      |
| 14.2 | Write integration tests: dashboard screen, transaction form, budget screen, login flow — using `@testing-library/react-native`         | 5      |
| 14.3 | Write E2E tests (Maestro or Detox): login → dashboard → add transaction → verify in list; budget creation; offline sync                | 3      |
| 14.4 | Configure `eas.json` with dev, preview, production build profiles; iOS provisioning + signing; Android keystore                        | 2      |
| 14.5 | Create app icons (1024×1024 + adaptive Android), splash screen, screenshots for iPhone (6.7", 6.5", 5.5") and Android (phone + tablet) | 2      |
| 14.6 | Write App Store and Play Store descriptions, keywords, privacy policy URL; submit via EAS Submit                                       | 2      |
| 14.7 | Configure `expo-updates` for OTA post-launch patches; set up GitHub Actions CI: lint → typecheck → test → EAS Build on tag             | 2      |

**Sprint Total: 21 points**

### Acceptance Criteria

- [ ] Unit test suite: ≥80% coverage on shared schemas, API client, auth logic, offline sync
- [ ] All unit tests pass: `pnpm --filter mobile test`
- [ ] Integration tests pass: dashboard renders with mock data, transaction form submits successfully, budget screen displays progress bars, login flow completes
- [ ] E2E test suite: 3+ critical flows pass on both iOS Simulator and Android Emulator
- [ ] EAS Build succeeds for production profile on both iOS and Android
- [ ] iOS `.ipa` installs and runs on physical device via TestFlight
- [ ] Android `.aab` installs and runs on physical device
- [ ] App icon renders correctly on both platforms (rounded corners iOS, adaptive Android)
- [ ] All required screenshots captured and formatted per store specifications
- [ ] App Store submission accepted by App Store Connect (may be "Waiting for Review")
- [ ] Play Store submission accepted by Google Play Console (may be in review)
- [ ] OTA update channel configured — test OTA update deploys to preview build
- [ ] GitHub Actions workflow runs on push to `main` or tag: lint + typecheck + test pass; EAS Build triggers on version tag
- [ ] Privacy policy URL is live and linked in both store listings
- [ ] `pnpm --filter web test` still passes (no regressions from monorepo changes)

---

## Milestone Summary

| Milestone             | Sprint | Date           | Gate                                                                                            |
| --------------------- | ------ | -------------- | ----------------------------------------------------------------------------------------------- |
| **M1: Foundation**    | S3     | March 28, 2026 | Monorepo working, auth flow complete, hooks connected                                           |
| **M2: Core MVP**      | S9     | May 9, 2026    | All core features functional (Dashboard, Transactions, Budgets, Bills, Settings, Notifications) |
| **M3: Native Ready**  | S12    | May 29, 2026   | Push notifications, biometrics, camera, offline, widgets                                        |
| **M4: Store Release** | S14    | June 12, 2026  | Apps submitted to App Store + Play Store                                                        |

---

## Risk Mitigations Per Sprint

| Sprint | Key Risk                                          | Mitigation                                                      |
| ------ | ------------------------------------------------- | --------------------------------------------------------------- |
| S1     | Monorepo restructure breaks web app               | Run full test suite before merging; keep web deploy working     |
| S2     | Bearer token auth doesn't work with Supabase RLS  | Verify with curl/Postman before writing mobile code             |
| S3     | SecureStore token persistence issues              | Test on both physical devices early; have AsyncStorage fallback |
| S4     | NativeWind v4 instability                         | Pin version; have StyleSheet fallback for critical components   |
| S5     | `victory-native` rendering issues                 | `react-native-gifted-charts` as fallback                        |
| S6     | Infinite scroll performance with large datasets   | Implement `windowSize` and `maxToRenderPerBatch` on FlatList    |
| S7     | Category picker hierarchy UX complexity           | User test early; simplify if 2-level picker is confusing        |
| S8     | Budget copy-forward edge cases                    | Match web behavior exactly; test month boundary scenarios       |
| S10    | Push notification permission denials              | Graceful degradation — fall back to in-app polling              |
| S11    | Offline cache memory pressure on low-end devices  | Limit cache size; evict oldest entries first                    |
| S12    | Offline sync conflicts with multi-user households | Start simple (last-write-wins); iterate post-launch             |
| S12    | Widget platform fragmentation                     | Ship without widgets if blocked; add in post-launch update      |
| S14    | App Store review rejection                        | Review Apple/Google guidelines in S13; ensure all policies met  |

---

## Definition of Done (Global)

Every sprint item must satisfy:

- [ ] Code compiles with zero TypeScript errors
- [ ] No console errors or warnings in development
- [ ] Renders correctly on iOS Simulator (iPhone 16 Pro) and Android Emulator (Pixel 8)
- [ ] Dark mode and light mode both tested
- [ ] No regressions in web app (`pnpm --filter web test`)
- [ ] Code committed with descriptive commit messages
- [ ] PR created with brief description and screenshots where applicable
