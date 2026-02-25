# Testing Patterns — FamFin

## Overview

This prompt defines testing conventions for FamFin, covering Vitest unit/integration tests, React Testing Library component tests, and Playwright E2E tests.

## References

- Implementation Plan: `Documentation/Implementation Plan.md` §4 (Testing Strategy)
- Target: ~160-200 unit/integration tests, ~45-60 E2E tests

---

## Test Directory Structure

```
tests/
├── setup.ts                          # Global test setup (jest-dom matchers)
├── utils/                            # Shared test utilities
│   ├── render.tsx                    # Custom render with providers
│   ├── mocks.ts                     # Mock data factories
│   └── supabase-mock.ts             # Supabase client mock
├── unit/                             # Vitest unit tests
│   ├── lib/
│   │   ├── utils.test.ts            # Utility function tests
│   │   └── validations/
│   │       ├── account.test.ts      # Zod schema tests
│   │       ├── transaction.test.ts
│   │       └── budget.test.ts
│   └── components/
│       ├── layout/
│       │   ├── header.test.tsx
│       │   └── sidebar.test.tsx
│       ├── forms/
│       │   ├── account-form.test.tsx
│       │   └── transaction-form.test.tsx
│       └── dashboard/
│           ├── budget-progress.test.tsx
│           └── metric-card.test.tsx
├── integration/                      # Vitest integration tests (API routes)
│   ├── api/
│   │   ├── accounts.test.ts
│   │   ├── categories.test.ts
│   │   ├── transactions.test.ts
│   │   ├── budgets.test.ts
│   │   └── auth.test.ts
│   └── hooks/
│       └── use-accounts.test.tsx
└── e2e/                              # Playwright E2E tests
    ├── fixtures/
    │   ├── auth.fixture.ts           # Auth page object & fixtures
    │   └── test-data.ts              # E2E test data factory
    ├── auth.spec.ts
    ├── transactions.spec.ts
    ├── budgets.spec.ts
    ├── dashboard.spec.ts
    └── reports.spec.ts
```

---

## Vitest Configuration

### `vitest.config.ts`

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
      exclude: ['src/**/*.d.ts', 'src/components/ui/**', 'src/types/**'],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### `tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
```

---

## Unit Test Patterns

### 1. Utility Function Tests

```typescript
// tests/unit/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatKES, formatDate } from '@/lib/utils';

describe('formatKES', () => {
  it('formats a positive number as KES currency', () => {
    expect(formatKES(1500)).toBe('KES 1,500.00');
  });

  it('formats zero', () => {
    expect(formatKES(0)).toBe('KES 0.00');
  });

  it('formats decimal amounts', () => {
    expect(formatKES(1234.56)).toBe('KES 1,234.56');
  });

  it('formats large numbers with comma separators', () => {
    expect(formatKES(150000)).toBe('KES 150,000.00');
  });
});

describe('formatDate', () => {
  it('formats a date string to DD/MM/YYYY', () => {
    expect(formatDate('2026-01-15')).toBe('15/01/2026');
  });

  it('formats a Date object to DD/MM/YYYY', () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe('15/01/2026');
  });
});
```

### 2. Zod Schema Tests

```typescript
// tests/unit/lib/validations/account.test.ts
import { describe, it, expect } from 'vitest';
import { createAccountSchema } from '@/lib/validations/account';

describe('createAccountSchema', () => {
  it('accepts valid account data', () => {
    const result = createAccountSchema.safeParse({
      name: 'Joint Account',
      type: 'bank',
      balance: 50000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createAccountSchema.safeParse({
      name: '',
      type: 'bank',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it('rejects invalid account type', () => {
    const result = createAccountSchema.safeParse({
      name: 'Test',
      type: 'crypto',
    });
    expect(result.success).toBe(false);
  });

  it('defaults balance to 0', () => {
    const result = createAccountSchema.safeParse({
      name: 'Cash',
      type: 'cash',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.balance).toBe(0);
    }
  });
});
```

### 3. Component Tests (React Testing Library)

```typescript
// tests/unit/components/dashboard/budget-progress.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetProgress } from '@/components/dashboard/budget-progress';

describe('BudgetProgress', () => {
  it('renders category name', () => {
    render(<BudgetProgress categoryName="Groceries" spent={500} budget={2000} />);
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('shows green when under 70%', () => {
    const { container } = render(
      <BudgetProgress categoryName="Groceries" spent={1000} budget={2000} />,
    );
    // 50% -> green
    expect(container.querySelector('[class*="green"]')).toBeInTheDocument();
  });

  it('shows amber when between 70-90%', () => {
    const { container } = render(
      <BudgetProgress categoryName="Transport" spent={1600} budget={2000} />,
    );
    // 80% -> amber
    expect(container.querySelector('[class*="amber"]')).toBeInTheDocument();
  });

  it('shows red when over 90%', () => {
    const { container } = render(
      <BudgetProgress categoryName="Entertainment" spent={1900} budget={2000} />,
    );
    // 95% -> red
    expect(container.querySelector('[class*="red"]')).toBeInTheDocument();
  });
});
```

### Custom Render with Providers

```tsx
// tests/utils/render.tsx
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}
```

---

## Integration Test Patterns

### API Route Tests

```typescript
// tests/integration/api/accounts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { GET, POST } from '@/app/api/accounts/route';
import { NextRequest } from 'next/server';

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  })),
};

beforeEach(() => {
  vi.clearAllMocks();
  (createClient as any).mockResolvedValue(mockSupabase);
});

describe('GET /api/accounts', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest('http://localhost:3000/api/accounts');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns accounts for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    // Mock profile lookup
    const fromMock = vi
      .fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { household_id: 'hh-1', role: 'admin' },
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [{ id: 'acc-1', name: 'Joint Account', type: 'bank' }],
          count: 1,
          error: null,
        }),
      });

    mockSupabase.from = fromMock;

    const request = new NextRequest('http://localhost:3000/api/accounts');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(1);
  });
});

describe('POST /api/accounts', () => {
  it('returns 403 for non-admin users', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-2' } },
      error: null,
    });

    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { household_id: 'hh-1', role: 'contributor' },
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', type: 'bank' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid data', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { household_id: 'hh-1', role: 'admin' },
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ name: '', type: 'invalid' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

---

## Playwright E2E Patterns

### Auth Fixture

```typescript
// tests/e2e/fixtures/auth.fixture.ts
import { test as base, type Page } from '@playwright/test';

type AuthFixtures = {
  adminPage: Page;
  contributorPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password').fill('TestPass1!');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL('/dashboard');

    await use(page);
    await context.close();
  },

  contributorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');
    await page.getByLabel('Email').fill('contributor@test.com');
    await page.getByLabel('Password').fill('TestPass1!');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL('/dashboard');

    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
```

### E2E Test Example

```typescript
// tests/e2e/transactions.spec.ts
import { test, expect } from './fixtures/auth.fixture';

test.describe('Transactions', () => {
  test('admin can add a new transaction', async ({ adminPage }) => {
    await adminPage.goto('/transactions');
    await adminPage.getByRole('button', { name: 'Add Transaction' }).click();

    // Fill form
    await adminPage.getByLabel('Amount').fill('2500');
    await adminPage.getByLabel('Description').fill('Weekly groceries');
    await adminPage.getByLabel('Merchant').fill('Naivas');

    // Select category
    await adminPage.getByLabel('Category').click();
    await adminPage.getByRole('option', { name: 'Food & Groceries' }).click();

    // Select account
    await adminPage.getByLabel('Account').click();
    await adminPage.getByRole('option', { name: 'Joint Account' }).click();

    // Submit
    await adminPage.getByRole('button', { name: 'Save Transaction' }).click();

    // Verify toast
    await expect(adminPage.getByText('Transaction created')).toBeVisible();

    // Verify it appears in the list
    await expect(adminPage.getByText('Weekly groceries')).toBeVisible();
    await expect(adminPage.getByText('KES 2,500.00')).toBeVisible();
  });

  test("contributor cannot delete another user's transaction", async ({ contributorPage }) => {
    await contributorPage.goto('/transactions');

    // Find a transaction by admin
    const adminTransaction = contributorPage
      .getByTestId('transaction-row')
      .filter({ hasText: 'admin@test.com' })
      .first();

    // Delete button should not be visible
    await expect(adminTransaction.getByRole('button', { name: 'Delete' })).not.toBeVisible();
  });

  test('transaction list paginates at 20 items', async ({ adminPage }) => {
    await adminPage.goto('/transactions');

    // Check pagination controls exist
    await expect(adminPage.getByTestId('pagination')).toBeVisible();

    // Verify max 20 rows visible
    const rows = adminPage.getByTestId('transaction-row');
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(20);
  });
});
```

### Accessibility E2E Test

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/login', '/dashboard', '/transactions', '/budgets', '/reports', '/settings'];

for (const pagePath of pages) {
  test(`${pagePath} has no accessibility violations`, async ({ page }) => {
    await page.goto(pagePath);
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
}
```

---

## Mock Data Factories

```typescript
// tests/utils/mocks.ts
import { v4 as uuid } from 'uuid';

export function createMockAccount(overrides = {}) {
  return {
    id: uuid(),
    household_id: 'hh-test',
    name: 'Test Account',
    type: 'bank' as const,
    balance: 50000,
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockTransaction(overrides = {}) {
  return {
    id: uuid(),
    household_id: 'hh-test',
    account_id: uuid(),
    category_id: uuid(),
    user_id: uuid(),
    type: 'expense' as const,
    amount: 1500,
    date: '2026-02-20',
    description: 'Test transaction',
    merchant: 'Test Merchant',
    payment_method: 'mobile_money' as const,
    tags: [],
    receipt_url: null,
    is_recurring: false,
    recurring_id: null,
    split_with: null,
    split_ratio: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockCategory(overrides = {}) {
  return {
    id: uuid(),
    household_id: 'hh-test',
    name: 'Test Category',
    parent_id: null,
    icon: null,
    color: '#2563EB',
    type: 'expense' as const,
    is_active: true,
    sort_order: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
```

---

## Conventions

- **Test file naming:** `[name].test.ts` for unit/integration, `[name].spec.ts` for E2E
- **Test IDs:** Use `data-testid="descriptive-name"` on interactive elements
- **Each test is independent:** No shared mutable state between tests
- **Arrange-Act-Assert:** Structure every test with clear setup, action, and verification
- **Descriptive test names:** Use `it('should ...')` or `it('returns 401 when ...')` format
- **Mock at boundaries:** Mock Supabase client, not internal functions
- **E2E tests use real flows:** Login → navigate → perform action → verify result
