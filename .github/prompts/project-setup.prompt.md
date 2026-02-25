# Project Setup — FamFin

## Overview

This prompt guides the initial scaffolding of the FamFin application. Follow these steps in order to create a fully configured Next.js 14+ project with all required dependencies and tooling.

## References

- Specification Document: `Documentation/Specification Document.md` §3.1 (Technology Stack)
- Implementation Plan: `Documentation/Implementation Plan.md` Sprint 0

---

## Step 1: Initialize Next.js Project

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

Expected configuration:

- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Import alias: `@/*`

---

## Step 2: Install Core Dependencies

### Production Dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr @tanstack/react-query react-hook-form @hookform/resolvers zod recharts @radix-ui/react-icons lucide-react class-variance-authority clsx tailwind-merge next-themes
```

| Package                    | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `@supabase/supabase-js`    | Supabase client SDK                         |
| `@supabase/ssr`            | Supabase SSR helpers for Next.js App Router |
| `@tanstack/react-query`    | Server state management                     |
| `react-hook-form`          | Form state management                       |
| `@hookform/resolvers`      | Zod resolver for react-hook-form            |
| `zod`                      | Schema validation                           |
| `recharts`                 | Charting library                            |
| `lucide-react`             | Icon library                                |
| `class-variance-authority` | Variant styling (shadcn/ui dependency)      |
| `clsx` + `tailwind-merge`  | Utility class merging                       |
| `next-themes`              | Dark/light mode                             |

### Dev Dependencies

```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test prettier prettier-plugin-tailwindcss husky lint-staged supabase @types/node
```

| Package                       | Purpose                      |
| ----------------------------- | ---------------------------- |
| `vitest`                      | Unit/integration test runner |
| `@vitejs/plugin-react`        | React plugin for Vitest      |
| `@testing-library/react`      | React component testing      |
| `@testing-library/jest-dom`   | DOM matchers                 |
| `@testing-library/user-event` | User interaction simulation  |
| `jsdom`                       | DOM environment for Vitest   |
| `@playwright/test`            | E2E testing framework        |
| `prettier`                    | Code formatter               |
| `prettier-plugin-tailwindcss` | Tailwind class sorting       |
| `husky`                       | Git hooks                    |
| `lint-staged`                 | Run linters on staged files  |
| `supabase`                    | Supabase CLI                 |

---

## Step 3: Initialize shadcn/ui

```bash
pnpm dlx shadcn-ui@latest init
```

Configuration:

- Style: Default
- Base color: Slate
- CSS variables: Yes
- `tailwind.config.ts` path: `tailwind.config.ts`
- Components path: `@/components/ui`
- Utils path: `@/lib/utils`
- React Server Components: Yes

Install commonly used components:

```bash
pnpm dlx shadcn-ui@latest add button card input label select textarea dialog dropdown-menu table tabs toast badge progress separator sheet avatar popover command calendar checkbox radio-group scroll-area skeleton switch tooltip form
```

---

## Step 4: Configure Code Quality Tooling

### Prettier (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### ESLint (`.eslintrc.json`)

Extend the default Next.js ESLint config. Ensure it includes:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Husky + lint-staged

```bash
pnpm exec husky init
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

Update `.husky/pre-commit`:

```bash
pnpm exec lint-staged
```

---

## Step 5: Configure Vitest

Create `vitest.config.ts` at project root:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/components/ui/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

---

## Step 6: Configure Playwright

Create `playwright.config.ts` at project root:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

Install Playwright browsers:

```bash
pnpm exec playwright install --with-deps chromium firefox
```

---

## Step 7: Create Folder Structure

```bash
# Source directories
mkdir -p src/components/{ui,forms,charts,dashboard,layout}
mkdir -p src/hooks
mkdir -p src/lib/{supabase,validations}
mkdir -p src/types
mkdir -p src/providers

# App Router directories
mkdir -p "src/app/(auth)/login"
mkdir -p "src/app/(auth)/register"
mkdir -p "src/app/(auth)/forgot-password"
mkdir -p "src/app/(dashboard)/dashboard"
mkdir -p "src/app/(dashboard)/transactions"
mkdir -p "src/app/(dashboard)/budgets"
mkdir -p "src/app/(dashboard)/recurring"
mkdir -p "src/app/(dashboard)/savings"
mkdir -p "src/app/(dashboard)/debts"
mkdir -p "src/app/(dashboard)/bills"
mkdir -p "src/app/(dashboard)/reports"
mkdir -p "src/app/(dashboard)/import"
mkdir -p "src/app/(dashboard)/settings"
mkdir -p "src/app/(dashboard)/notifications"
mkdir -p src/app/api

# Test directories
mkdir -p tests/{unit,integration,e2e}

# Supabase
mkdir -p supabase/migrations
```

---

## Step 8: Initialize Supabase

```bash
pnpm exec supabase init
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

---

## Step 9: Create Supabase Client Utilities

### Server Client (`src/lib/supabase/server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    },
  );
}
```

### Browser Client (`src/lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

---

## Step 10: Add npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:generate-types": "supabase gen types typescript --project-id your-project-id > src/types/database.ts",
    "db:migration:new": "supabase migration new",
    "db:push": "supabase db push",
    "db:reset": "supabase db reset",
    "prepare": "husky"
  }
}
```

---

## Step 11: Configure `.gitignore`

Ensure `.gitignore` includes:

```
node_modules/
.next/
.env*.local
.vercel
coverage/
test-results/
playwright-report/
*.tsbuildinfo
```

---

## Verification Checklist

- [ ] `pnpm dev` starts without errors at `localhost:3000`
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm format:check` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` runs (even if no tests yet)
- [ ] Supabase local dev starts with `supabase start`
- [ ] Husky pre-commit hook fires on `git commit`
- [ ] Folder structure matches the project structure in the Implementation Plan
