# FamFin — React Native Mobile App Plan v1.0

**Mobile-First Implementation: iOS & Android via Expo**

---

| Field                   | Value                                                         |
| ----------------------- | ------------------------------------------------------------- |
| Document Version        | 1.0                                                           |
| Date                    | March 5, 2026                                                 |
| Status                  | APPROVED                                                      |
| Specification Reference | Specification Document v1.0 (Feb 20, 2026)                    |
| Approach                | React Native / Expo (managed) — new native UI, shared backend |
| Styling                 | NativeWind (Tailwind for React Native)                        |
| Repository Strategy     | Monorepo (extend existing pnpm workspaces)                    |
| API Strategy            | Reuse existing Next.js API routes with Bearer token auth      |
| Target Timeline         | ~14 weeks (5 phases)                                          |
| Sprint Cadence          | 1-week sprints                                                |
| Team Size               | Solo developer                                                |

---

## Table of Contents

1. [Summary](#1-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Phase 0 — Monorepo Restructure & Shared Package](#3-phase-0--monorepo-restructure--shared-package-week-1)
4. [Phase 1 — Backend Auth Adaptation & Expo Scaffold](#4-phase-1--backend-auth-adaptation--expo-scaffold-weeks-23)
5. [Phase 2 — Core Features UI](#5-phase-2--core-features-ui-weeks-48)
6. [Phase 3 — Native Features](#6-phase-3--native-features-weeks-911)
7. [Phase 4 — Polish, Testing & Store Submission](#7-phase-4--polish-testing--store-submission-weeks-1214)
8. [Key Decisions](#8-key-decisions)
9. [What Can Be Shared vs. Rewritten](#9-what-can-be-shared-vs-rewritten)
10. [Risk Register](#10-risk-register)

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

## 3. Phase 0 — Monorepo Restructure & Shared Package (Week 1)

### 3.1 Restructure to pnpm monorepo

Move the existing Next.js app into `apps/web/`. Create `apps/mobile/` for Expo and `packages/shared/` for shared code. Update `pnpm-workspace.yaml` to declare all three workspaces.

### 3.2 Extract shared code into `packages/shared/`

| Source File                    | Shared Module                                       |
| ------------------------------ | --------------------------------------------------- |
| `src/lib/validations/*.ts`     | All Zod validation schemas                          |
| `src/types/database.ts`        | Database types (auto-gen)                           |
| `src/lib/constants.ts`         | Constants                                           |
| `src/lib/utils.ts`             | Pure utility functions (no `clsx`/`tailwind-merge`) |
| All hooks (query key patterns) | `queryKeys.ts` factory                              |

### 3.3 Configure `packages/shared/`

- `package.json` → `"name": "@famfin/shared"`
- `tsconfig.json` → target ES2022, no DOM types
- Barrel `index.ts` exports

### 3.4 Update `apps/web/` imports

Refactor all imports in the web app to use `@famfin/shared` instead of local paths. Run existing test suite to confirm no regressions.

---

## 4. Phase 1 — Backend Auth Adaptation & Expo Scaffold (Weeks 2–3)

### 4.1 Modify API routes to accept Bearer tokens

**Update `getAuthContext()` in `src/lib/supabase/auth-helpers.ts`:**

- Check for `Authorization: Bearer <token>` header before falling back to cookie-based auth
- If Bearer token present, validate via `supabase.auth.getUser(token)` to extract user info
- Same `{userId, householdId, role}` response shape for both auth methods

**Update `createClient()` in `src/lib/supabase/server.ts`:**

- Add optional path accepting a JWT parameter for creating the Supabase server client with the user's token for RLS enforcement

**Add CORS in `next.config.ts`:**

- Allow requests from Expo dev server and production mobile origins
- `Access-Control-Allow-Headers: Authorization, Content-Type`

### 4.2 Scaffold Expo app

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

### 4.3 Configure NativeWind

Set up `tailwind.config.ts` extending the web app's design tokens (colors, spacing, font sizes) from `@famfin/shared`. Configure the Babel/Metro NativeWind plugin.

### 4.4 Configure Expo Router

Set up tab-based navigation structure (see Architecture Overview).

### 4.5 Build API client layer

Create `apps/mobile/lib/api-client.ts`:

- Prepends Vercel-hosted base URL (`EXPO_PUBLIC_API_URL`)
- Attaches `Authorization: Bearer <token>` from `SecureStore`
- Handles 401 responses → clear auth state → redirect to login
- JSON parsing with error handling

### 4.6 Create mobile hooks

Port the 10 hooks from `src/hooks/`, replacing relative `/api/...` calls with the API client. Query keys imported from `@famfin/shared`.

### 4.7 Create auth provider

`apps/mobile/providers/auth-provider.tsx`:

- Initialize `@supabase/supabase-js` with `SecureStore` adapter for token persistence
- `onAuthStateChange` listener for session management
- Expose `signIn`, `signUp`, `signOut`, `resetPassword` methods
- Navigation gate: unauthenticated → `(auth)` stack, authenticated → `(tabs)` stack

---

## 5. Phase 2 — Core Features UI (Weeks 4–8)

### 5.1 Design System & Shared Components (Week 4)

**UI component library** in `apps/mobile/components/ui/`:

`Button`, `Input`, `Select`, `Card`, `Badge`, `Avatar`, `Modal`, `BottomSheet`, `Toast`, `Skeleton`, `EmptyState`, `ErrorBoundary`

- All styled with NativeWind, same color palette and design tokens as web
- Touch targets minimum 44×44px per iOS/Android HIG
- Dark/light mode support via NativeWind theme

**Layout components:**

- Bottom tab bar: Dashboard, Transactions, Add (FAB center), Budgets, More
- Pull-to-refresh wrapper (`RefreshControl`)
- Safe area handling (`expo-constants`)

### 5.2 Dashboard (Week 5)

Port the 7 dashboard widgets:

| Web Component           | Mobile Component                                   |
| ----------------------- | -------------------------------------------------- |
| `MetricCards`           | Horizontal scroll card strip                       |
| `BudgetProgress`        | Vertical list with progress bars (green/amber/red) |
| `RecentTransactions`    | FlatList (tap → detail)                            |
| `UpcomingBills`         | Card list with days-until-due badges               |
| `SavingsWidget`         | Goal progress rings                                |
| `AccountBalances`       | Card list                                          |
| `OverallBudgetWidget`   | Circular progress indicator                        |
| `IncomeVsExpense` chart | `victory-native` bar chart                         |

### 5.3 Transactions (Weeks 5–6)

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

### 5.4 Budgets (Week 7)

**List screen:**

- Month/year selector (horizontal scroll or picker)
- Overall budget card at top (circular progress)
- Per-category budget list with progress bars
- Color coding: green (<75%), amber (75–90%), red (>90%) via `getBudgetStatus()` from shared
- Expandable sub-category breakdown rows

**Create/edit (bottom sheet):**

- Category picker (parent categories only)
- Amount input
- Month/year pre-filled
- Copy-forward action (`POST /api/budgets/copy`)

### 5.5 Bills (Week 7)

- List of active bill reminders with due day, amount, category
- Days-until-due badge (`getDaysUntilDue()` from shared)
- Add/edit/delete bill reminders

### 5.6 More Tab & Settings (Week 8)

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

## 6. Phase 3 — Native Features (Weeks 9–11)

### 6.1 Push Notifications (Week 9)

**Infrastructure:**

- Register push tokens via `expo-notifications`
- New `push_tokens` table in Supabase (migration `00005_push_tokens.sql`): `user_id`, `token`, `platform`, `created_at`
- New API routes: `POST /api/users/me/push-token`, `DELETE /api/users/me/push-token`

**Server-side delivery:**

- Push service using Expo Push API (Edge Function or API route)
- Modify `createNotification()` in `src/lib/notifications.ts` to trigger push when user has registered tokens
- Types: budget threshold alerts, bill reminders (X days before due), savings milestones, recurring reminders

**In-app handling:**

- Foreground → in-app toast
- Tapped → deep link to relevant screen
- Badge count management

### 6.2 Biometric Auth (Week 9)

- `expo-local-authentication` for Face ID / Fingerprint
- First login → prompt to enable biometric unlock
- Preference stored in `SecureStore`
- App launch → biometric prompt before revealing content
- Fallback to email/password
- Auto-lock after configurable inactivity timeout

### 6.3 Camera & Receipt Scanning (Week 10)

- `expo-image-picker` with camera and gallery options
- Image preview with crop/rotate before upload
- Upload to existing `POST /api/transactions/upload-receipt` endpoint
- Link receipt to new or existing transaction

### 6.4 Offline Mode (Weeks 10–11)

**Read cache:**

- Cache GET responses in AsyncStorage (accounts, categories, dashboard, recent transactions)
- Stale-while-revalidate pattern

**Write queue:**

- When offline, queue mutations in AsyncStorage with timestamps
- Visual indicators: offline badge in header, sync-pending icons on queued items

**Sync on reconnect:**

- `@react-native-community/netinfo` connectivity listener triggers sync
- Replay queued operations against API in order
- Conflict resolution: last-write-wins with server timestamp comparison
- Background sync via `expo-background-fetch` (periodic)

### 6.5 Home Screen Widgets (Week 11)

**iOS Widgets** (`expo-widget` or `react-native-ios-widgets`):

- Small: Monthly spending summary (income, expenses, net)
- Medium: Budget progress (top 3 categories)
- Data updated via background fetch

**Android Widgets** (`react-native-android-widget`):

- Equivalent widgets matching iOS functionality
- Uses Android `AppWidgetProvider`

---

## 7. Phase 4 — Polish, Testing & Store Submission (Weeks 12–14)

### 7.1 Polish (Week 12)

- **Animations:** `react-native-reanimated` for smooth transitions, skeleton loading states, haptic feedback on key actions, pull-to-refresh animations
- **Accessibility:** `accessibilityLabel` on all interactive elements, screen reader support, dynamic font scaling, WCAG 2.1 AA contrast ratios
- **Error handling:** Global error boundary, network error retry UI, empty states for all lists, session expiry handling

### 7.2 Testing (Week 13)

- **Unit tests** (Jest): Shared validation schemas, API client (mock fetch), auth flow logic, offline queue/sync logic
- **Integration tests:** Screen-level component tests with `@testing-library/react-native`, navigation flow tests, form submission flows
- **E2E tests** (Detox or Maestro): Login → Dashboard → Add Transaction → Verify; budget creation + threshold alerts; offline create → online sync

### 7.3 Store Submission (Week 14)

- **EAS Build** (`eas.json`): dev, preview, production profiles; iOS provisioning + certificates; Android keystore
- **App Store assets:** Icons (1024×1024 + adaptive), screenshots (iPhone 6.7"/6.5"/5.5", Android phone + tablet), descriptions, privacy policy
- **Submissions:** Apple via EAS Submit → App Store Connect; Google via EAS Submit → Play Console
- **OTA updates:** `expo-updates` for post-launch patches
- **CI/CD:** GitHub Actions workflow: lint → typecheck → test → EAS Build (on tag/release)

---

## 8. Key Decisions

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

## 9. What Can Be Shared vs. Rewritten

### Fully Shareable (copy to `@famfin/shared`)

| Item                             | Why                                  |
| -------------------------------- | ------------------------------------ |
| Zod validation schemas           | Pure TypeScript, no web dependencies |
| Database types                   | Generated types, framework-agnostic  |
| Constants                        | Pure data                            |
| Utility functions (calculations) | Pure logic                           |
| TanStack Query key patterns      | Same library works in React Native   |
| API calling patterns (hooks)     | With `baseUrl` adjustment            |

### Needs Adaptation

| Item            | Web Approach              | Mobile Approach                               |
| --------------- | ------------------------- | --------------------------------------------- |
| Supabase client | `@supabase/ssr` + cookies | `@supabase/supabase-js` + `SecureStore`       |
| Auth flow       | Server actions + cookies  | Supabase SDK directly + navigation guards     |
| API fetch calls | Relative `/api/...`       | Absolute URL + `Authorization: Bearer` header |
| Notifications   | Polling every 60s         | Push notifications (Expo Push / FCM)          |
| Receipt upload  | `FormData` via `fetch`    | `expo-image-picker` + `FormData`              |

### Must Rewrite Completely

| Item              | Why                                  |
| ----------------- | ------------------------------------ |
| All UI components | React DOM → React Native primitives  |
| Navigation        | Next.js App Router → Expo Router     |
| Layout/Sidebar    | Web layout → Tab navigation / Drawer |
| Charts            | Recharts → `victory-native`          |
| CSS/Styling       | Tailwind CSS → NativeWind            |
| PDF export        | Different library needed for native  |
| CSV export/import | Different file system APIs           |

---

## 10. Risk Register

| Risk                                           | Severity | Mitigation                                                         |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------ |
| No service worker on web (PWA incomplete)      | Medium   | Separate concern — web PWA can be completed independently          |
| Cookie-based auth adaptation for Bearer tokens | High     | Modify `getAuthContext()` early (Phase 1); test thoroughly         |
| NativeWind v4 stability                        | Medium   | Pin version; fallback to StyleSheet if critical issues arise       |
| Expo managed workflow limitations              | Low      | EAS Build supports custom native modules via config plugins        |
| Home screen widgets platform fragmentation     | Medium   | Ship without widgets in MVP if blocked; add in subsequent release  |
| Offline sync conflict resolution               | Medium   | Start with simple last-write-wins; iterate based on user feedback  |
| App Store review rejection                     | Medium   | Review Apple/Google guidelines early; ensure privacy policy exists |
| Chart library compatibility (victory-native)   | Low      | `react-native-gifted-charts` as fallback option                    |
