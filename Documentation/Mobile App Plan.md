# FamFin — React Native Mobile App Plan v1.0

**Mobile-First Implementation: iOS & Android via Expo**

---

| Field                   | Value                                                         |
| ----------------------- | ------------------------------------------------------------- |
| Document Version        | 2.0                                                           |
| Date                    | March 5, 2026                                                 |
| Status                  | APPROVED                                                      |
| Specification Reference | Specification Document v1.0 (Feb 20, 2026)                    |
| Approach                | React Native / Expo (managed) — new native UI, shared backend |
| Styling                 | NativeWind (Tailwind for React Native)                        |
| Repository Strategy     | Monorepo (extend existing pnpm workspaces)                    |
| API Strategy            | Reuse existing Next.js API routes with Bearer token auth      |
| Target Timeline         | ~15 weeks (S0 + 5 phases)                                     |
| Sprint Cadence          | 1-week sprints                                                |
| Team Size               | Solo developer                                                |

---

## Table of Contents

1. [Summary](#1-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Sprint 0 — Test Hardening & Deploy Verification](#3-sprint-0--test-hardening--deploy-verification-week-1)
4. [Phase 0 — Monorepo Restructure & Shared Package](#4-phase-0--monorepo-restructure--shared-package-week-2)
5. [Phase 1 — Backend Auth Adaptation & Expo Scaffold](#5-phase-1--backend-auth-adaptation--expo-scaffold-weeks-34)
6. [Phase 2 — Core Features UI](#6-phase-2--core-features-ui-weeks-59)
7. [Phase 3 — Native Features](#7-phase-3--native-features-weeks-1012)
8. [Phase 4 — Polish, Testing & Store Submission](#8-phase-4--polish-testing--store-submission-weeks-1315)
9. [Key Decisions](#9-key-decisions)
10. [What Can Be Shared vs. Rewritten](#10-what-can-be-shared-vs-rewritten)
11. [Risk Register](#11-risk-register)

---

## 1. Summary

Build a new Expo (managed) React Native app within the existing monorepo, sharing types, validations, and utilities via a `packages/shared` workspace. The mobile app consumes the same Next.js API routes (hosted on Vercel) by passing Supabase JWT tokens via `Authorization: Bearer` headers. Core features ship first (Dashboard, Transactions, Budgets, Bills), with native capabilities (push notifications, biometrics, camera, offline mode, home screen widgets) integrated throughout. NativeWind provides Tailwind-like styling for consistency with the web app.

### MVP Feature Scope (Core Features First)

| Included in MVP                            | Deferred to Phase 2 Release |
| ------------------------------------------ | --------------------------- |
| Dashboard (all 7 widgets)                  | Reports (6 chart types)     |
| Transactions (full CRUD + filters)         | Savings Goals               |
| Budgets (per-category + overall)           | Debt Tracking               |
| Bill Reminders                             | Recurring Transactions      |
| Notifications                              | Import / Export             |
| Settings (profile, theme, accounts, users) | Category management         |

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Monorepo (pnpm)                    │
├──────────────┬───────────────┬────────────────────────┤
│  apps/web/   │ apps/mobile/  │   packages/shared/     │
│  (Next.js)   │ (Expo)        │   (types, validations, │
│              │               │    utils, query keys)   │
└──────┬───────┴───────┬───────┴───────────┬────────────┘
       │               │                   │
       │    ┌──────────▼──────────┐        │
       │    │   Expo Router       │        │
       │    │   (Tab Navigation)  │        │
       │    │   NativeWind        │        │
       │    │   TanStack Query    │        │
       │    └──────────┬──────────┘        │
       │               │                   │
       ▼               ▼                   │
┌──────────────────────────────────────────┘
│  Next.js API Routes (Vercel)
│  - Cookie auth (web)
│  - Bearer token auth (mobile)
│  - Business logic (balance updates,
│    budget notifications, validation)
└──────────────┬───────────────────────────┐
               ▼                           │
┌──────────────────────┐   ┌───────────────▼──────────┐
│  Supabase (Postgres)  │   │  Supabase Storage        │
│  - 13 tables + RLS    │   │  - Receipt images        │
│  - Auth (JWT)          │   │                          │
└──────────────────────┘   └──────────────────────────┘
```

### Navigation Structure

```
(auth)/
├── login
├── register
└── forgot-password

(tabs)/
├── Dashboard     (index)
├── Transactions  (list + [id] detail)
├── ＋ Add        (FAB center button → modal)
├── Budgets
└── More          (settings, notifications, reports*, savings*, debts*)
                  (* = Phase 2)

modals/
├── add-transaction
├── add-budget
└── receipt-camera
```

---

## 3. Sprint 0 — Test Hardening & Deploy Verification (Week 1)

> **Rationale:** The current codebase has 14 unit tests covering only pure functions. There are zero API integration tests, zero component tests, and zero E2E tests. The monorepo restructure will move every source file and edit 80+ imports — without integration and E2E tests as a safety net, regressions during the restructure will go undetected.

### 3.1 Write API integration tests

- Write tests for `getAuthContext()` — valid session, no session, expired session
- Write tests for 5 core API route groups: `dashboard`, `transactions`, `budgets`, `accounts`, `categories`
- Each test verifies HTTP status code and response shape

### 3.2 Write Playwright E2E smoke tests

- 5 critical paths: login, view dashboard, create transaction, view budgets, logout
- Uses the existing Playwright config and `tests/e2e/` directory (currently empty)

### 3.3 Document and verify deployment

- Confirm and screenshot current Vercel project settings (root directory, env vars, build command)
- Pin Node version: add `.nvmrc` (Node 20) and `engines` field to `package.json`
- Test `OPTIONS` preflight handling on Vercel to inform CORS implementation in Phase 1

---

## 4. Phase 0 — Monorepo Restructure & Shared Package (Week 2)

### 4.1 Restructure to pnpm monorepo

Move the existing Next.js app into `apps/web/`. Create `apps/mobile/` for Expo and `packages/shared/` for shared code. Create `pnpm-workspace.yaml` with a `packages:` field declaring `apps/*` and `packages/*` workspaces (the current file only contains `ignoredBuiltDependencies` — it has no workspace declarations).

**CI/CD & Deployment updates:** Update Vercel project root directory to `apps/web/`. Update GitHub Actions workflow paths for the new monorepo structure. Verify web deployment works from the new directory before merging.

### 4.2 Extract shared code into `packages/shared/`

> **Note on actual shared content:** The `@famfin/shared` package will initially contain: 8 Zod validation schema files, 1 database types file, 1 constants file, 2 portable utility functions (`formatKES`, `formatDate`), and 1 query key factory. This is valuable shared code, but it is thinner than it may appear — there are no extracted budget calculation, payoff projection, or milestone check functions in `utils.ts` (these calculations exist inline in API routes and components, not as standalone utilities).

| Source File                    | Shared Module                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/validations/*.ts`     | All Zod validation schemas                                                                                                                             |
| `src/types/database.ts`        | Database types (auto-gen)                                                                                                                              |
| `src/lib/constants.ts`         | Constants                                                                                                                                              |
| `src/lib/utils.ts`             | Pure utility functions only — `formatKES()`, `formatDate()`. The `cn()` helper (uses `clsx` + `tailwind-merge`) stays in `apps/web/` as it's web-only. |
| All hooks (query key patterns) | `queryKeys.ts` factory                                                                                                                                 |

### 4.3 Configure `packages/shared/`

- `package.json` → `"name": "@famfin/shared"`
- `tsconfig.json` → target ES2022, no DOM types
- Barrel `index.ts` exports

### 4.4 Update `apps/web/` imports

Refactor all imports in the web app to use `@famfin/shared` instead of local paths. Run existing test suite to confirm no regressions.

---

## 5. Phase 1 — Backend Auth Adaptation & Expo Scaffold (Weeks 3–4)

### 5.1 Modify API routes to accept Bearer tokens

**Update middleware (`src/middleware.ts` + `src/lib/supabase/middleware.ts`):**

- The current middleware redirects all unauthenticated requests to `/login` (HTML redirect). API routes carrying Bearer tokens will have no cookies set, so the middleware will redirect them before the API route can check the `Authorization` header.
- Add middleware bypass: skip redirect for all `/api/*` routes — let API route handlers perform their own auth via `getAuthContext()`.
- Ensure `OPTIONS` preflight requests are also bypassed (required for CORS).

**Update `getAuthContext()` in `src/lib/supabase/auth-helpers.ts`:**

- Import `headers()` from `next/headers` to read the incoming `Authorization` header (the current implementation does not receive or inspect request headers)
- If `Authorization: Bearer <token>` header is present, create a Supabase client using `supabase.auth.getUser(token)` to validate the JWT and extract user info — this requires a **separate** Supabase client instance created with the raw JWT for proper RLS enforcement
- If no Bearer token, fall back to existing cookie-based `createClient()` flow
- Same `{userId, householdId, role}` response shape for both auth methods
- Return 401 with JSON body (not redirect) for invalid/expired tokens

**Update `createClient()` in `src/lib/supabase/server.ts`:**

- Add an overload or optional `jwt` parameter to create a Supabase server client using a raw JWT instead of cookie-based auth
- When JWT is provided, use `createClient()` from `@supabase/supabase-js` (not `@supabase/ssr`) with the token set via `global.headers.Authorization` for RLS enforcement

**Add CORS in `next.config.ts`:**

- Allow requests from Expo dev server (`http://localhost:8081`) and production mobile origins
- `Access-Control-Allow-Headers: Authorization, Content-Type`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`

**Environment variables:**

- Mobile app requires: `EXPO_PUBLIC_API_URL` (Vercel deployment URL), `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Configure EAS environment variables per profile (dev → local API, preview → staging, production → production URL)
- Add `.env.example` to `apps/mobile/` documenting all required variables

### 5.2 Scaffold Expo app

Initialize Expo project in `apps/mobile/` using `npx create-expo-app@latest` (blank TypeScript template).

**Core dependencies:**

| Category        | Package                                           |
| --------------- | ------------------------------------------------- |
| Navigation      | `expo-router`                                     |
| Styling         | `nativewind` + `tailwindcss`                      |
| Auth            | `@supabase/supabase-js` + `expo-secure-store`     |
| Data fetching   | `@tanstack/react-query`                           |
| Forms           | `react-hook-form` + `@hookform/resolvers` + `zod` |
| Camera          | `expo-image-picker`                               |
| Biometrics      | `expo-local-authentication`                       |
| Push            | `expo-notifications`                              |
| Haptics         | `expo-haptics`                                    |
| Offline storage | `@react-native-async-storage/async-storage`       |
| Connectivity    | `@react-native-community/netinfo`                 |
| Icons           | `lucide-react-native`                             |
| Charts          | `victory-native`                                  |
| Animations      | `react-native-reanimated`                         |

### 5.3 Configure NativeWind

Set up `tailwind.config.ts` extending the web app's design tokens (colors, spacing, font sizes) from `@famfin/shared`. Configure the Babel/Metro NativeWind plugin.

### 5.4 Configure Expo Router

Set up tab-based navigation structure (see Architecture Overview).

### 5.4a Configure Deep Linking & Universal Links

- Register URL scheme `famfin://` for dev/debug deep linking
- Configure iOS Universal Links (`.well-known/apple-app-site-association` hosted on Vercel) and Android App Links (`.well-known/assetlinks.json`) for production
- Configure Expo Router linking config to map deep link paths to screens (e.g., `famfin://transactions/123` → transaction detail, `famfin://dashboard` → dashboard tab)
- Required for push notification tap-to-open routing (Phase 3) and email links (password reset, invitations)

### 5.5 Build API client layer

Create `apps/mobile/lib/api-client.ts`:

- Prepends Vercel-hosted base URL (`EXPO_PUBLIC_API_URL`)
- Reads the **current** access token from the Supabase session (not a stale token from SecureStore) — the Supabase JS client handles token refresh automatically, so `api-client.ts` must call `supabase.auth.getSession()` before each request to get a fresh JWT
- Attaches `Authorization: Bearer <token>` header
- Handles 401 responses → clear auth state → redirect to login
- Handles expired refresh tokens (user hasn’t opened app in 7+ days) → show “Session expired” alert → redirect to login
- JSON parsing with error handling

### 5.6 Create mobile hooks

Rewrite the 10 hooks from `src/hooks/` for mobile. The web hooks use `'use client'` directive, relative `fetch('/api/...')`, and implicit cookie-based auth — **none of these work in React Native**. The mobile versions use the API client with absolute URLs and Bearer token injection. Query keys are imported from `@famfin/shared` to share cache key structure.

### 5.7 Create auth provider

`apps/mobile/providers/auth-provider.tsx`:

- Initialize `@supabase/supabase-js` with `SecureStore` adapter for token persistence
- `onAuthStateChange` listener for session management
- Expose `signIn`, `signUp`, `signOut`, `resetPassword` methods
- Navigation gate: unauthenticated → `(auth)` stack, authenticated → `(tabs)` stack

**Token refresh lifecycle:**

- The Supabase JS client handles JWT refresh automatically via `onAuthStateChange` — on each `TOKEN_REFRESHED` event, the new token is persisted to SecureStore
- If the refresh token itself has expired (e.g., user hasn’t opened the app in 7+ days, exceeding Supabase’s default refresh token TTL), the session is invalid — clear all stored tokens and navigate to login with a “Session expired” message
- On app foreground resume (`AppState` listener), proactively call `supabase.auth.getSession()` to validate/refresh the session before any API calls

**Household onboarding:**

- New users who register via mobile must go through household creation (same as web flow) — the mobile app must handle the case where a registered user has no `household_id`
- Display a “Create Household” or “Join Household” screen before granting access to the main tabs
- Users invited via email deep link must be routed through the invitation acceptance flow
- The `seed_user_categories()` database function runs on registration to populate default categories — verify this works correctly when triggered from mobile sign-up

### 5.7a Create registration API route

The current registration flow is a Next.js Server Action (`'use server'` in `auth-actions.ts`) that uses `redirect()` and `revalidatePath()` — **Server Actions cannot be called from a mobile app**. Create a dedicated API route:

**`POST /api/auth/register`:**

- Accepts JSON body: `{ name, email, password, householdName }`
- Mirrors the Server Action logic: sign up via Supabase → create household (admin client) → link user to household → seed default categories via `seed_default_categories()` RPC
- Returns JSON `{ userId, householdId }` on success (not a redirect)
- Returns validation errors for invalid input
- Uses the admin client (service role key) for household creation and user linking — the service role key must never be exposed to client apps

---

## 6. Phase 2 — Core Features UI (Weeks 5–9)

### 6.1 Design System & Shared Components (Week 5)

**UI component library** in `apps/mobile/components/ui/`:

`Button`, `Input`, `Select`, `Card`, `Badge`, `Avatar`, `Modal`, `BottomSheet`, `Toast`, `Skeleton`, `EmptyState`, `ErrorBoundary`

- All styled with NativeWind, same color palette and design tokens as web
- Touch targets minimum 44×44px per iOS/Android HIG
- Dark/light mode support via NativeWind theme

**Layout components:**

- Bottom tab bar: Dashboard, Transactions, Add (FAB center), Budgets, More
- Pull-to-refresh wrapper (`RefreshControl`)
- Safe area handling (`expo-constants`)

### 6.2 Dashboard (Week 6)

Port the 6 dashboard widgets (SavingsWidget excluded — Savings Goals deferred to Phase 2):

| Web Component           | Mobile Component                                   |
| ----------------------- | -------------------------------------------------- |
| `MetricCards`           | Horizontal scroll card strip                       |
| `BudgetProgress`        | Vertical list with progress bars (green/amber/red) |
| `RecentTransactions`    | FlatList (tap → detail)                            |
| `UpcomingBills`         | Card list with days-until-due badges               |
| `AccountBalances`       | Card list                                          |
| `OverallBudgetWidget`   | Circular progress indicator                        |
| `IncomeVsExpense` chart | `victory-native` bar chart                         |

### 6.3 Transactions (Weeks 6–7)

> **Note:** Category management is deferred to Phase 2, but categories are required for transaction creation and budget assignment. Default categories are seeded on user registration via the `seed_user_categories()` database function. Verify this function triggers correctly from mobile sign-up during Sprint 3 auth testing.

**List screen:**

- `FlatList` with infinite scroll pagination (`page` + `limit` params)
- Filter bottom sheet (type, category, account, date range, payment method)
- Search bar with debounced input
- Sort toggle (date, amount)
- Swipe-left to delete with confirmation

**Detail/edit screen:**

- `react-hook-form` + Zod validation from `@famfin/shared`
- Hierarchical category picker (parents → expand children → leaf selection only)
- Account picker, native date picker
- Amount input with KES currency formatting
- Receipt: camera capture via `expo-image-picker` or gallery
- Upload to `POST /api/transactions/upload-receipt`

**Add transaction modal:**

- Bottom sheet / full-screen modal from center FAB
- Streamlined quick-entry form

### 6.4 Budgets (Week 8)

**List screen:**

- Month/year selector (horizontal scroll or picker)
- Overall budget card at top (circular progress)
- Per-category budget list with progress bars
- Color coding: green (<70%), amber (70–90%), red (>90%) via `getBudgetStatus()` from shared — thresholds sourced from `BUDGET_THRESHOLDS` in `@famfin/shared` (`GREEN_MAX: 70`, `AMBER_MAX: 90`)
- Expandable sub-category breakdown rows

**Create/edit (bottom sheet):**

- Category picker (parent categories only)
- Amount input
- Month/year pre-filled
- Copy-forward action (`POST /api/budgets/copy`)

### 6.5 Bills (Week 8)

- List of active bill reminders with due day, amount, category
- Days-until-due badge (`getDaysUntilDue()` from shared)
- Add/edit/delete bill reminders

### 6.6 More Tab & Settings (Week 9)

**More tab menu:**

- Settings (profile, theme toggle, account CRUD for admins, user management for admins)
- Notifications center (full list, mark read/all read)
- Reports, Savings, Debts, Recurring, Export → placeholders (Phase 2)
- Logout

**Settings screens:**

- Profile edit (`PUT /api/users/me`)
- Theme toggle (dark/light/system)
- Account CRUD (admin only)
- User management (admin only)

---

## 7. Phase 3 — Native Features (Weeks 10–12)

### 7.1 Push Notifications (Week 10)

**Infrastructure:**

- Register push tokens via `expo-notifications`
- New `push_tokens` table in Supabase (migration `00005_push_tokens.sql`): `user_id`, `token`, `platform`, `created_at`
- New API routes: `POST /api/users/me/push-token`, `DELETE /api/users/me/push-token`

**Server-side delivery:**

- Create a dedicated push delivery module (`src/lib/push.ts`) that wraps the Expo Push API (`https://exp.host/--/api/v2/push/send`)
- Modify `createNotification()` in `src/lib/notifications.ts` to call the push module after inserting the in-app notification — query `push_tokens` for the target user(s) and send in batches (max 100 per Expo Push API request)
- Handle push ticket receipts: store ticket IDs, poll receipt endpoint after 15 minutes to confirm delivery, remove invalid/expired tokens from `push_tokens` (device uninstalled app)
- Bill reminder delivery: create an API route or cron job (`/api/notifications/send-bill-reminders`) that runs daily, queries bills due within reminder window, and dispatches push to household members
- Types: budget threshold alerts, bill reminders (X days before due), recurring reminders (savings milestones deferred to Phase 2)

**In-app handling:**

- Foreground → in-app toast
- Tapped → deep link to relevant screen
- Badge count management

### 7.2 Biometric Auth (Week 10)

- `expo-local-authentication` for Face ID / Fingerprint
- First login → prompt to enable biometric unlock
- Preference stored in `SecureStore`
- App launch → biometric prompt before revealing content
- Fallback to email/password
- Auto-lock after configurable inactivity timeout

### 7.3 Camera & Receipt Scanning (Week 11)

- `expo-image-picker` with camera and gallery options
- Image preview with crop/rotate before upload
- Upload to existing `POST /api/transactions/upload-receipt` endpoint
- Link receipt to new or existing transaction

### 7.4 Offline Mode (Weeks 11–12)

**Read cache:**

- Cache GET responses in AsyncStorage (accounts, categories, dashboard, recent transactions)
- Stale-while-revalidate pattern

**Write queue:**

- When offline, queue mutations in AsyncStorage with timestamps and operation metadata (entity type, action, payload)
- Visual indicators: offline badge in header, sync-pending icons on queued items
- **Queue size limit:** Cap at 50 pending mutations (~500KB) to stay within AsyncStorage limits (6MB on Android). Show warning when approaching limit; block new offline mutations at cap.
- **Receipt images while offline:** Queue the transaction metadata but defer image upload until online — store image URI locally in the queue entry. Upload receipt first on sync, then create/update the transaction with the returned `receipt_url`.
- **Cross-entity ordering:** Queue entries are replayed in strict chronological order. Since categories cannot be created from mobile (deferred), no cross-entity dependency risk exists for MVP. Document this constraint for Phase 2 when category management is added.

**Sync on reconnect:**

- `@react-native-community/netinfo` connectivity listener triggers sync
- Replay queued operations against API in chronological order; each operation must succeed before the next is attempted; failed items halt the queue and prompt user for retry/skip/discard
- Conflict resolution: last-write-wins with server timestamp comparison — if server `updated_at` is newer than queued operation timestamp, server data wins silently
- Background sync via `expo-background-fetch` (periodic) — limited to 30-second execution window on iOS

### 7.5 Home Screen Widgets (Week 12)

**iOS Widgets** (`expo-widget` or `react-native-ios-widgets`):

- Small: Monthly spending summary (income, expenses, net)
- Medium: Budget progress (top 3 categories)
- Data updated via background fetch

**Android Widgets** (`react-native-android-widget`):

- Equivalent widgets matching iOS functionality
- Uses Android `AppWidgetProvider`

---

## 8. Phase 4 — Polish, Testing & Store Submission (Weeks 13–15)

### 8.1 Polish (Week 13)

- **Animations:** `react-native-reanimated` for smooth transitions, skeleton loading states, haptic feedback on key actions, pull-to-refresh animations
- **Accessibility:** `accessibilityLabel` on all interactive elements, screen reader support, dynamic font scaling, WCAG 2.1 AA contrast ratios
- **Error handling:** Global error boundary, network error retry UI, empty states for all lists, session expiry handling

### 8.2 Testing (Continuous — Every Sprint)

Testing is distributed across all sprints rather than backloaded. Each sprint includes testing for that sprint's deliverables as a mandatory task.

**Per-sprint testing mandate (see Sprint Plan for details):**

| Sprint | Testing Focus                                                          | Min Coverage |
| ------ | ---------------------------------------------------------------------- | ------------ |
| S0     | API integration tests (5 route groups), Playwright E2E smoke tests (5) | —            |
| S1     | Shared package unit tests (schemas, utils, constants, query keys)      | 90%          |
| S2     | Bearer auth integration tests (valid/invalid/expired tokens via curl)  | —            |
| S3     | API client unit tests (mock fetch), auth provider logic tests          | 80%          |
| S4     | UI component render tests (Button, Input, Card, BottomSheet, etc.)     | 80%          |
| S5     | Dashboard screen integration test (renders with mock data)             | —            |
| S6     | Transaction list integration test, filter logic unit tests             | —            |
| S7     | Transaction form integration test, category picker test                | —            |
| S8     | Budget/bill screen integration tests                                   | —            |
| S9     | Settings + notification center integration tests                       | —            |
| S10    | Push token registration unit tests, biometric flow tests               | 80%          |
| S11    | Read cache layer unit tests, connectivity handler tests                | 80%          |
| S12    | Offline queue/sync unit tests, conflict resolution tests               | 90%          |
| S13    | Accessibility audit tests (VoiceOver/TalkBack), error boundary tests   | —            |
| S14    | E2E test suite (3+ critical flows), final coverage audit ≥80% overall  | 80%          |

**E2E tests** (Maestro or Detox) — written in Sprint 14: Login → Dashboard → Add Transaction → Verify; budget creation + threshold alerts; offline create → online sync

### 8.3 Store Submission (Week 15)

- **EAS Build** (`eas.json`): dev, preview, production profiles; iOS provisioning + certificates; Android keystore
- **App Store assets:** Icons (1024×1024 + adaptive), screenshots (iPhone 6.7"/6.5"/5.5", Android phone + tablet), descriptions, privacy policy
- **Submissions:** Apple via EAS Submit → App Store Connect; Google via EAS Submit → Play Console
- **OTA updates:** `expo-updates` for post-launch patches
  - **Channel strategy:** `production` (stable releases), `preview` (beta testers), `development` (dev builds)
  - **OTA vs. native build:** JS-only changes deploy via OTA; any native module change (new Expo package, config plugin change) requires a full EAS Build
  - **Rollback strategy:** If OTA causes crashes, use `expo-updates` rollback API or publish a fix OTA; pin `runtimeVersion` per native build to prevent incompatible JS bundles
- **CI/CD:** GitHub Actions workflow: lint → typecheck → test → EAS Build (on tag/release)

---

### 8.4 Performance Budgets

Given the target audience (Kenya-based users, KES currency, potential low-bandwidth / low-end devices):

| Metric                 | Target      | Measurement                          |
| ---------------------- | ----------- | ------------------------------------ |
| App binary size (iOS)  | < 30 MB     | EAS Build output                     |
| App binary size (APK)  | < 25 MB     | EAS Build output                     |
| Cold start time        | < 2 seconds | Profiler on mid-range Android device |
| Screen transition      | < 300ms     | React Native performance monitor     |
| Memory usage (idle)    | < 150 MB    | Xcode Instruments / Android Studio   |
| AsyncStorage usage     | < 4 MB      | Runtime audit                        |
| API response rendering | < 500ms     | TanStack Query devtools              |

These targets are validated during Sprint 13 (polish phase) and enforced in CI during Sprint 14.

---

## 9. Key Decisions

| Decision             | Choice                           | Rationale                                                                               |
| -------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| Mobile framework     | React Native / Expo (managed)    | EAS handles builds, signing, OTA. Expo Router mirrors Next.js file-based routing.       |
| API strategy         | Reuse Next.js API routes         | Single source of truth for business logic (balance updates, notifications, validation). |
| Repository structure | Monorepo (pnpm workspaces)       | Already configured. Types, validations, utils shared via `@famfin/shared`.              |
| Styling              | NativeWind                       | Closest to existing Tailwind workflow. Design tokens shareable.                         |
| MVP scope            | Core features first              | Dashboard, Transactions, Budgets, Bills. Reports/Savings/Debts follow.                  |
| Charts               | `victory-native`                 | Better API, active maintenance, supports needed chart types.                            |
| Offline storage      | AsyncStorage-based cache + queue | Full offline-first DB (WatermelonDB) may be overkill for MVP.                           |
| Push notifications   | Expo Push Notifications          | Simpler setup, cross-platform, compatible with managed workflow.                        |

---

## 10. What Can Be Shared vs. Rewritten

### Fully Shareable (copy to `@famfin/shared`)

| Item                                          | Why                                  |
| --------------------------------------------- | ------------------------------------ |
| Zod validation schemas                        | Pure TypeScript, no web dependencies |
| Database types                                | Generated types, framework-agnostic  |
| Constants                                     | Pure data                            |
| Utility functions (`formatKES`, `formatDate`) | Pure logic, no DOM dependencies      |
| TanStack Query key patterns                   | Same library works in React Native   |

### Needs Adaptation

| Item            | Web Approach              | Mobile Approach                                              |
| --------------- | ------------------------- | ------------------------------------------------------------ |
| Supabase client | `@supabase/ssr` + cookies | `@supabase/supabase-js` + `SecureStore`                      |
| Auth flow       | Server actions + cookies  | `POST /api/auth/register` + Supabase SDK + navigation guards |
| API fetch calls | Relative `/api/...`       | Absolute URL + `Authorization: Bearer` header                |
| Notifications   | Polling every 60s         | Push notifications (Expo Push / FCM)                         |
| Receipt upload  | `FormData` via `fetch`    | `expo-image-picker` + `FormData`                             |

### Must Rewrite Completely

| Item              | Why                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| All UI components | React DOM → React Native primitives                                                                           |
| Navigation        | Next.js App Router → Expo Router                                                                              |
| Data hooks        | `'use client'` + relative `fetch('/api/...')` + implicit cookies → API client with absolute URL + Bearer auth |
| Registration flow | Server Action (`redirect()`) → `POST /api/auth/register` API route (JSON response)                            |
| Layout/Sidebar    | Web layout → Tab navigation / Drawer                                                                          |
| Charts            | Recharts → `victory-native`                                                                                   |
| CSS/Styling       | Tailwind CSS → NativeWind                                                                                     |
| PDF export        | Different library needed for native                                                                           |
| CSV export/import | Different file system APIs                                                                                    |

---

## 11. Risk Register

| Risk                                                | Severity | Mitigation                                                                          |
| --------------------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| No service worker on web (PWA incomplete)           | Medium   | Separate concern — web PWA can be completed independently                           |
| Cookie-based auth adaptation for Bearer tokens      | High     | Modify `getAuthContext()` early (Phase 1); test thoroughly                          |
| NativeWind v4 stability                             | Medium   | Pin version; fallback to StyleSheet if critical issues arise                        |
| Expo managed workflow limitations                   | Low      | EAS Build supports custom native modules via config plugins                         |
| Home screen widgets platform fragmentation          | Medium   | Ship without widgets in MVP if blocked; add in subsequent release                   |
| Offline sync conflict resolution                    | Medium   | Start with simple last-write-wins; iterate based on user feedback                   |
| App Store review rejection                          | Medium   | Review Apple/Google guidelines early; ensure privacy policy exists                  |
| Chart library compatibility (victory-native)        | Low      | `react-native-gifted-charts` as fallback option                                     |
| Middleware redirect blocks mobile API requests      | High     | Bypass `/api/*` routes in middleware before Bearer auth rollout                     |
| Registration Server Action not callable from mobile | High     | Create `POST /api/auth/register` API route mirroring Server Action logic            |
| Insufficient test coverage for safe restructure     | High     | Sprint 0 adds API integration tests + E2E smoke tests before restructure            |
| Token refresh expiry (long app inactivity)          | Medium   | Detect expired refresh token → show “Session expired” → re-login                    |
| CI/CD pipeline broken by monorepo restructure       | High     | Update Vercel root + GitHub Actions paths in Sprint 1; verify deploy before merging |
| App binary size too large for target market         | Medium   | Set 25 MB budget; audit bundle; use `expo-asset` for lazy loading                   |
| Missing household onboarding on mobile              | Medium   | Add create/join household screen in auth flow; test with fresh user                 |
