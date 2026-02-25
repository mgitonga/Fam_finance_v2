# CI/CD Pipeline — FamFin

## Overview

This prompt provides the complete GitHub Actions workflow configurations for FamFin's CI/CD pipeline, plus Vercel integration setup.

## References

- Implementation Plan: `Documentation/Implementation Plan.md` §3 (CI/CD Pipeline)
- Spec: `Documentation/Specification Document.md` §12 (Deployment Strategy)

---

## Pipeline Architecture

```
Developer pushes code to GitHub
        │
        ├── All branches / PRs
        │   └── ci.yml: Lint → Type-check → Unit/Integration Tests
        │
        ├── PRs targeting main
        │   └── e2e.yml: Build → Start local → Playwright E2E Tests
        │
        ├── PR created/updated
        │   └── Vercel auto-deploys to Preview URL
        │
        └── Merge to main
            └── Vercel auto-deploys to Production
```

---

## Workflow 1: CI (`ci.yml`)

Runs on every push and PR. Gates: lint, format, type-check, unit/integration tests.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-test:
    name: Lint, Type-check & Test
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Check formatting
        run: pnpm format:check

      - name: Lint
        run: pnpm lint

      - name: Type-check
        run: pnpm type-check

      - name: Run unit & integration tests
        run: pnpm test -- --coverage

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7
```

---

## Workflow 2: E2E Tests (`e2e.yml`)

Runs Playwright E2E tests on PRs targeting main. Uses Supabase local via Docker.

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  pull_request:
    branches: [main]

concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

jobs:
  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    timeout-minutes: 30

    env:
      NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_LOCAL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY_LOCAL }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase local
        run: |
          supabase start
          supabase db reset

      - name: Build application
        run: pnpm build

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
          retention-days: 7

      - name: Stop Supabase
        if: always()
        run: supabase stop
```

---

## Workflow 3: Lighthouse CI (optional, Sprint 11)

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    name: Lighthouse Audit
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v12
        with:
          uploadArtifacts: true
          configPath: '.lighthouserc.json'
```

### Lighthouse config (`.lighthouserc.json`)

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm start",
      "url": ["http://localhost:3000/login"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.95 }]
      }
    }
  }
}
```

---

## Vercel Integration Setup

### 1. Link Repository

```bash
pnpm exec vercel link
```

### 2. Environment Variables (Vercel Dashboard)

Set these in Vercel project settings → Environment Variables:

| Variable                        | Environments        | Description                             |
| ------------------------------- | ------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Production, Preview | Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Supabase anon/public key                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Production, Preview | Supabase service role key (server-only) |
| `RESEND_API_KEY`                | Production, Preview | Resend email API key                    |

### 3. Vercel Project Settings

| Setting          | Value                            |
| ---------------- | -------------------------------- |
| Framework Preset | Next.js                          |
| Build Command    | `pnpm build`                     |
| Output Directory | `.next`                          |
| Install Command  | `pnpm install --frozen-lockfile` |
| Node.js Version  | 20.x                             |

### 4. Branch Deploy Configuration

| Branch      | Deploy Target                    |
| ----------- | -------------------------------- |
| `main`      | Production (`famfin.vercel.app`) |
| PR branches | Preview (auto-generated URL)     |

---

## GitHub Repository Settings

### Branch Protection Rules (for `main`)

- [x] Require pull request reviews before merging (1 reviewer)
- [x] Require status checks to pass before merging:
  - `Lint, Type-check & Test` (ci.yml)
  - `Playwright E2E` (e2e.yml)
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

### Secrets to Configure

Navigate to Repository → Settings → Secrets and variables → Actions:

| Secret                            | Description                                     |
| --------------------------------- | ----------------------------------------------- |
| `SUPABASE_ANON_KEY_LOCAL`         | Anon key for local Supabase (E2E tests)         |
| `SUPABASE_SERVICE_ROLE_KEY_LOCAL` | Service role key for local Supabase (E2E tests) |

> **Note:** The local Supabase keys are deterministic and the same for all `supabase start` instances. They can be retrieved via `supabase status` after starting.

---

## PR Workflow Summary

```
1. Developer creates feature branch: feature/sprint-2-categories
2. Developer pushes commits
3. ci.yml runs: lint → format → type-check → unit tests
4. Vercel auto-deploys to preview URL
5. Developer opens PR to main
6. e2e.yml runs: build → Supabase local → Playwright tests
7. All checks pass → reviewer approves → merge to main
8. Vercel auto-deploys to production
```
