# UI Component Patterns — FamFin

## Overview

This prompt defines conventions for building UI components in FamFin, including shadcn/ui usage, form patterns with React Hook Form + Zod, TanStack Query data fetching hooks, and responsive design patterns.

## References

- Specification Document: `Documentation/Specification Document.md` §8 (UI/UX), Appendix D (Design Tokens)
- Implementation Plan: `Documentation/Implementation Plan.md` §1 (Technical Decisions)

---

## Component Organization

```
src/components/
├── ui/                  # shadcn/ui primitives (auto-generated, do not edit)
├── forms/               # Form components (transaction form, budget form, etc.)
├── charts/              # Recharts wrapper components
├── dashboard/           # Dashboard widget components
└── layout/              # Header, Sidebar, Footer, PageHeader
```

---

## shadcn/ui Usage

### Adding New Components

```bash
pnpm dlx shadcn-ui@latest add [component-name]
```

### Do NOT edit files in `src/components/ui/`

These are shadcn/ui primitives. Instead, create wrapper components in the appropriate folder.

### Commonly Used Components

| Component                     | Usage                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| `Button`                      | All actions, variants: default, destructive, outline, ghost |
| `Card`                        | Dashboard widgets, data display containers                  |
| `Dialog`                      | Modals for create/edit forms                                |
| `Table`                       | Transaction list, data tables                               |
| `Form`                        | Wraps React Hook Form for accessible forms                  |
| `Input`, `Select`, `Textarea` | Form fields                                                 |
| `Toast`                       | Success/error notifications                                 |
| `Badge`                       | Status indicators, tags                                     |
| `Progress`                    | Budget progress bars                                        |
| `Skeleton`                    | Loading states                                              |
| `Sheet`                       | Mobile sidebar                                              |
| `Tabs`                        | Settings page, reports page                                 |

---

## Form Pattern (React Hook Form + Zod)

### Standard Form Component

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountSchema, type CreateAccountInput } from '@/lib/validations/account';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface AccountFormProps {
  defaultValues?: Partial<CreateAccountInput>;
  onSubmit: (data: CreateAccountInput) => Promise<void>;
  isEditing?: boolean;
}

export function AccountForm({ defaultValues, onSubmit, isEditing }: AccountFormProps) {
  const { toast } = useToast();

  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: '',
      type: 'bank',
      balance: 0,
      ...defaultValues,
    },
  });

  async function handleSubmit(data: CreateAccountInput) {
    try {
      await onSubmit(data);
      toast({
        title: isEditing ? 'Account updated' : 'Account created',
        description: `${data.name} has been ${isEditing ? 'updated' : 'created'}.`,
      });
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Joint Account" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money (M-Pesa)</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starting Balance (KES)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Account'
              : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## TanStack Query Hooks

### Query Hook Pattern

```typescript
// src/hooks/use-accounts.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { CreateAccountInput, UpdateAccountInput } from '@/lib/validations/account';

const ACCOUNTS_KEY = ['accounts'];

export function useAccounts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: async () => {
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const json = await response.json();
      return json.data;
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAccountInput) => {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAccountInput }) => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}
```

### Query Provider Setup

```tsx
// src/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Responsive Design Patterns

### Breakpoints (Tailwind defaults)

| Breakpoint | Min Width | Usage          |
| ---------- | --------- | -------------- |
| `sm`       | 640px     | Large phones   |
| `md`       | 768px     | Tablets        |
| `lg`       | 1024px    | Small desktops |
| `xl`       | 1280px    | Desktops       |
| `2xl`      | 1536px    | Large screens  |

### Layout Behavior

```
Mobile (< 768px):
  - Sidebar hidden → hamburger menu (Sheet component)
  - Bottom navigation bar for primary actions
  - Single column layout
  - Stack dashboard widgets vertically

Tablet (768px – 1023px):
  - Sidebar → icon-only rail
  - 2-column grid for dashboard widgets

Desktop (≥ 1024px):
  - Full sidebar with text labels
  - Multi-column grid for dashboard
```

### Responsive Component Example

```tsx
// Dashboard grid layout
<div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
  {/* Metric cards */}
</div>

<div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-4">
  {/* Chart widgets */}
</div>
```

---

## Currency & Date Formatting

### KES Currency Formatter

```typescript
// src/lib/utils.ts
export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

### Date Formatter

```typescript
// src/lib/utils.ts
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}
```

---

## Design Tokens (from Spec Appendix D)

Use CSS variables configured via shadcn/ui theming:

```css
/* Light mode */
--primary: 217 91% 60%; /* #2563EB */
--success: 142 76% 36%; /* #16A34A — Under Budget */
--warning: 32 95% 44%; /* #D97706 — Near Budget */
--destructive: 0 84% 60%; /* #DC2626 — Over Budget */

/* Dark mode */
--primary: 217 91% 60%; /* #3B82F6 */
--success: 142 71% 45%; /* #22C55E */
--warning: 38 92% 50%; /* #F59E0B */
--destructive: 0 84% 60%; /* #EF4444 */
```

---

## Budget Progress Bar Component

```tsx
// src/components/dashboard/budget-progress.tsx
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BudgetProgressProps {
  categoryName: string;
  spent: number;
  budget: number;
}

export function BudgetProgress({ categoryName, spent, budget }: BudgetProgressProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  const colorClass =
    percentage < 70
      ? 'text-green-600 dark:text-green-400'
      : percentage < 90
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{categoryName}</span>
        <span className={cn('font-medium', colorClass)}>
          {formatKES(spent)} / {formatKES(budget)}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          percentage < 70 && '[&>div]:bg-green-500',
          percentage >= 70 && percentage < 90 && '[&>div]:bg-amber-500',
          percentage >= 90 && '[&>div]:bg-red-500',
        )}
      />
    </div>
  );
}
```

---

## Conventions

- All client components start with `'use client';`
- Server components are the default — only add `'use client'` when needed (forms, interactivity, hooks)
- Use `data-testid` attributes on interactive elements for Playwright tests
- All user-facing text uses sentence case
- Loading states: use `<Skeleton />` components matching the layout of loaded content
- Error states: use shadcn `Alert` component with `variant="destructive"`
- Empty states: friendly message with action button (e.g., "No transactions yet. Add your first one.")
