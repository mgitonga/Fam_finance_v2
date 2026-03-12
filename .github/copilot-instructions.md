# Copilot Instructions for Family Finance

## Project Overview

**Family Finance (FamFin)** is a monorepo-in-progress Next.js web application for personal financial management. Currently, the entire app is at the repository root in `src/` (pre-Sprint 1). After Sprint 1, it will restructure into:

- `apps/web/` - Next.js application
- `apps/mobile/` - Expo React Native app
- `packages/shared/` - Shared types and utilities

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase (auth + database), TanStack React Query, Tailwind CSS + UI components, Zod validation

---

## Build, Test, and Lint Commands

### Development

```bash
pnpm dev          # Start Next.js dev server (localhost:3000)
pnpm build        # Build for production
pnpm start        # Run production build locally
```

### Testing

```bash
pnpm test                 # Run unit & integration tests once
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Generate coverage report
pnpm test:e2e             # Run Playwright E2E tests (requires built app)
pnpm test:e2e:ui          # Run E2E tests with UI browser
```

**Test Location:** Unit & integration tests in `tests/unit/**/*.test.{ts,tsx}` and `tests/integration/**/*.test.{ts,tsx}`. E2E tests in `tests/e2e/`. Vitest is configured in `vitest.config.ts` with jsdom environment.

### Code Quality

```bash
pnpm lint              # Run ESLint
pnpm lint:fix          # Fix linting errors
pnpm format            # Format with Prettier
pnpm format:check      # Check if files are formatted
pnpm type-check        # Run TypeScript type checking
```

**Pre-commit Hook:** Husky + lint-staged automatically runs ESLint + Prettier on staged `.ts/.tsx` files and Prettier on `.json`, `.md`, `.css`, `.mjs` files.

---

## High-Level Architecture

### Directory Structure

```
src/
  app/              → Next.js App Router routes
    (auth)/         → Public auth pages (login, signup)
    (dashboard)/    → Protected dashboard pages
    api/            → API routes
  components/       → React components (grouped by domain: charts, forms, layout, ui)
  hooks/            → Custom React hooks (use-accounts, use-transactions, etc.)
  lib/              → Utilities & libraries
    supabase/       → Supabase client instances & auth helpers
    validations/    → Zod schemas
  providers/        → Context providers (auth, query, theme, toast)
  types/            → TypeScript type definitions (database.ts)
  middleware.ts     → Next.js middleware for route protection

tests/
  unit/             → Unit tests for hooks, utilities
  integration/      → Integration tests for API routes
  e2e/              → Playwright end-to-end tests
  setup.ts          → Vitest setup (mocks Next.js navigation)
  utils/            → Test utilities
```

### Data Flow & State Management

- **Server Actions & API Routes:** `src/app/api/` handles CRUD operations. Supabase queries use `src/lib/supabase/` client instances.
- **Client State:** TanStack React Query manages server state with custom hooks (e.g., `useAccounts()` fetches from `/api/accounts`).
- **Client Context:** `src/providers/` includes AuthProvider (user session), QueryProvider (React Query), ThemeProvider, and ToastProvider.
- **Authentication:** Supabase SSR pattern with auth-helpers and middleware-based route protection.

### Key Components & Patterns

- **Custom Hooks** follow a consistent pattern: `useXXX()` queries data, `useCreateXXX()`, `useUpdateXXX()`, `useDeleteXXX()` mutations handle mutations with optimistic invalidation.
- **Validation:** Zod schemas in `src/lib/validations/` are used for form validation and type generation.
- **Forms:** React Hook Form + Zod resolver pattern.
- **API Responses:** Standard shape: `{ data?: T, error?: string }`.

---

## Key Conventions

### Naming

- **Files:** Kebab-case for files (`use-accounts.ts`, `query-provider.tsx`), camelCase for exports.
- **Branches:** Follow `feat/`, `fix/`, `chore/` prefixes with kebab-case names. Group related tasks in one branch per sprint.
- **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/) (feat, fix, chore, docs, test, refactor, perf).

### TypeScript & Types

- Strict mode enabled. Import types from `src/types/database.ts` or define inline with Zod.
- Use `'use client'` directive in components that need client-side interactivity.
- Prefer type inference; only define explicit types when needed for clarity.

### Custom Hooks

All custom hooks:

1. Use TanStack React Query (`useQuery`, `useMutation`)
2. Define `queryKey` constants at module level
3. Fetch from API routes (e.g., `/api/accounts`)
4. Handle errors and return JSON
5. Invalidate queries on mutation success
6. Export as separate named exports (e.g., `useAccounts`, `useCreateAccount`, `useUpdateAccount`, `useDeleteAccount`)

Example pattern from `use-accounts.ts`:

```typescript
const ACCOUNTS_KEY = ['accounts'];

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: async () => {
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json().then((json) => json.data);
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAccountInput) => {
      /* ... */
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}
```

### Testing

- **Vitest** for unit & integration tests with jsdom environment.
- **Playwright** for E2E tests (configured in `playwright.config.ts`).
- Mock Next.js navigation in `tests/setup.ts`.
- Test files colocated with code (in `tests/` directory, not alongside source files).
- Include coverage: exclude UI components and type definitions.

### API Routes

- Located in `src/app/api/`.
- Handle errors with consistent response format: `{ error: string }`.
- Use Supabase clients from `src/lib/supabase/` (server.ts for server-side, client.ts for client-side).
- Validate input with Zod schemas before processing.

### Security Headers

- Configured in `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (camera, microphone, geolocation disabled).

### MCP Servers

- **Playwright MCP** is configured in `.vscode/settings.json`. Use it to develop and debug E2E tests. Run `pnpm test:e2e:ui` to test interactively.

### Styling

- **Tailwind CSS** with Prettier plugin (`prettier-plugin-tailwindcss`).
- **UI Components** in `src/components/ui/` (class-variance-authority for variants).
- **Dark Mode:** Supported via `next-themes`. Test UI in both light and dark modes.

### Monorepo Post-Sprint 1

After restructuring, use pnpm workspace filters:

```bash
pnpm --filter web dev          # Run web app
pnpm --filter mobile test      # Test mobile app
pnpm -r test                   # Run all tests across workspaces
```

---

## Before Committing

1. Run `pnpm test` to ensure tests pass.
2. Run `pnpm type-check` for TypeScript validation.
3. Run `pnpm lint` and `pnpm format:check` (pre-commit hooks will auto-fix).
4. Test dark mode and light mode if UI changes are made.
5. Verify no regressions in the dashboard by running the dev server.

---

## Important Notes

- **Node.js 24.x** required (see `.nvmrc`). Use `nvm use` to switch versions.
- **pnpm 10+** required instead of npm or yarn.
- **Supabase CLI** needed for local database setup.
- Vercel automatically deploys from `main` branch. Always ensure `main` is production-ready.
- Pre-commit hooks run automatically; commits that fail linting/formatting will be rejected.
