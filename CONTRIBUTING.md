# Contributing to FamFin

**Solo Developer Workflow · GitHub Flow (Simplified)**

---

## Branching Strategy

### Branch Model

```
main (production — always deployable to Vercel)
 │
 ├── feat/<short-name>     → new features
 ├── fix/<short-name>      → bug fixes
 └── chore/<short-name>    → tooling, CI, config, tests
```

### Rules

| Rule                       | Detail                                                |
| -------------------------- | ----------------------------------------------------- |
| `main` is protected        | Always deployable. Vercel auto-deploys from it.       |
| Branch per task group      | Group logically related sprint tasks into one branch. |
| Squash-merge to `main`     | One clean commit per feature/task in `main` history.  |
| Delete branch after merge  | Keep the repo clean — no stale branches.              |
| Tests pass before merge    | `pnpm test` + `pnpm type-check` must be green.        |
| No direct pushes to `main` | Always go through a PR (even solo — CI must run).     |

### Branch Naming

```
feat/<short-name>     → feat/monorepo-restructure, feat/dashboard-widgets
fix/<short-name>      → fix/token-refresh, fix/auth-session-expiry
chore/<short-name>    → chore/sprint0-tests, chore/ci-update-paths
```

Use lowercase, kebab-case. Keep names short but descriptive.

### Sprint Branch Grouping

You don't need a branch per subtask. Group by logical unit per sprint:

| Sprint | Suggested Branches                                         |
| ------ | ---------------------------------------------------------- |
| S0     | `chore/sprint0-api-tests`, `chore/sprint0-e2e-tests`       |
| S1     | `feat/monorepo-restructure` (one branch — big restructure) |
| S2     | `feat/bearer-auth`, `feat/expo-scaffold`                   |
| S3     | `feat/api-client-hooks`, `feat/auth-provider`              |
| S4+    | One branch per screen or feature area                      |

### Hotfix Process

If production (`main`) breaks while you have an in-progress feature branch:

1. Create `fix/<issue>` from `main`
2. Fix, test, squash-merge to `main` immediately
3. Rebase your feature branch onto updated `main`

---

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

Types: feat, fix, chore, docs, refactor, test, style, perf
```

Examples:

```
feat: add Bearer token auth to getAuthContext
fix: handle expired refresh token in api-client
chore: configure NativeWind v4 with Babel plugin
test: add integration tests for dashboard API
docs: update mobile app sprint plan for S2
```

---

## Development Workflow

### Prerequisites

- **Node.js** ≥ 20 (see `.nvmrc`)
- **pnpm** 10+
- **Supabase CLI** for local database

### Setup

```bash
pnpm install
```

### Running the Web App

```bash
pnpm dev
```

### Running Tests

```bash
# Unit & integration tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests (requires built app)
pnpm build && pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui

# Type checking
pnpm type-check

# Lint
pnpm lint
```

### Pre-commit Hooks

Husky + lint-staged runs automatically on `git commit`:

- ESLint + Prettier on `*.ts`, `*.tsx`
- Prettier on `*.json`, `*.md`, `*.css`, `*.mjs`

### CI Pipeline

**On push to `main` and all PRs:**

1. Format check (`pnpm format:check`)
2. Lint (`pnpm lint`)
3. Type-check (`pnpm type-check`)
4. Unit & integration tests (`pnpm test`)

**On PRs only (additional):**

5. Playwright E2E tests (`pnpm test:e2e`)

---

## PR Checklist

Before merging any PR:

- [ ] Code compiles with zero TypeScript errors
- [ ] No console errors or warnings in development
- [ ] All tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Dark mode and light mode tested (if UI changes)
- [ ] No regressions in web app (`pnpm test`)
- [ ] Commit messages follow conventional commits

---

## Post-Monorepo Commands (Sprint 1+)

After the monorepo restructure, use workspace filters:

```bash
# Web app
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web test

# Mobile app
pnpm --filter mobile start
pnpm --filter mobile test

# Shared package
pnpm --filter shared test

# All workspaces
pnpm -r test
pnpm -r type-check
```

---

## Project Structure (Current → Post-Restructure)

**Current:**

```
Family-Finance/
├── src/              ← Next.js app (root-level)
├── tests/
├── supabase/
└── Documentation/
```

**After Sprint 1:**

```
Family-Finance/
├── apps/
│   ├── web/          ← Next.js app (moved here)
│   └── mobile/       ← Expo React Native app
├── packages/
│   └── shared/       ← @famfin/shared (types, validations, utils)
├── supabase/
└── Documentation/
```
