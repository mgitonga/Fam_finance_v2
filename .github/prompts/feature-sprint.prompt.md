# Feature Sprint Workflow — FamFin

## Overview

This prompt defines the standard workflow for implementing a feature within a sprint. Every feature follows the same sequence: schema → API → UI → tests → PR. Use this as a checklist for each sprint task.

## References

- Implementation Plan: `Documentation/Implementation Plan.md` §5 (Sprint Breakdown)
- All other prompt files in `.github/prompts/`

---

## Feature Development Sequence

```
1. DATABASE  →  2. VALIDATION  →  3. API ROUTE  →  4. QUERY HOOK  →  5. UI PAGE  →  6. TESTS  →  7. PR
```

Each step builds on the previous. Do not skip ahead.

---

## Step 1: Database Changes (if needed)

**When:** The feature requires new tables, columns, or indexes.

1. Create a new migration file:

   ```bash
   pnpm exec supabase migration new <descriptive-name>
   ```

2. Write SQL in `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`
   - Follow patterns in `database-schema.prompt.md`
   - Include indexes for columns used in WHERE/JOIN clauses
   - Add RLS policies following `supabase-rls.prompt.md`

3. Apply migration:

   ```bash
   pnpm exec supabase db push    # Push to cloud
   # OR
   pnpm exec supabase db reset   # Reset local with all migrations
   ```

4. Regenerate TypeScript types:
   ```bash
   pnpm run db:generate-types
   ```

---

## Step 2: Zod Validation Schemas

**When:** The feature involves user input (forms, API payloads).

1. Create/update schema file in `src/lib/validations/<resource>.ts`
2. Export both `create` and `update` schemas
3. Export TypeScript types from the schema

```typescript
// src/lib/validations/<resource>.ts
import { z } from 'zod';

export const createResourceSchema = z.object({
  // ... fields with validation rules from spec
});

export const updateResourceSchema = createResourceSchema.partial();

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
```

Follow patterns in `api-route.prompt.md` (Zod Schemas section).

---

## Step 3: API Route

**When:** The feature exposes data or actions via HTTP endpoints.

1. Create route file(s) in `src/app/api/<resource>/route.ts`
2. Follow the template in `api-route.prompt.md`
3. Include:
   - Auth check via `getAuthContext()`
   - Role check (admin-only for CRUD on settings-type resources)
   - Zod validation for request body
   - Proper HTTP status codes
   - Household-scoped queries

---

## Step 4: TanStack Query Hooks

**When:** The UI needs to fetch/mutate data from the API.

1. Create hook file in `src/hooks/use-<resource>.ts`
2. Follow the query hook pattern in `ui-component.prompt.md`
3. Include:
   - `useQuery` for data fetching
   - `useMutation` for create/update/delete
   - Cache invalidation on mutation success
   - Proper query keys

---

## Step 5: UI Components & Pages

**When:** The feature has user-facing UI.

1. Create page in `src/app/(dashboard)/<route>/page.tsx` (Server Component)
2. Create client components in `src/components/<category>/`
3. Follow conventions in `ui-component.prompt.md`:
   - Use shadcn/ui primitives
   - React Hook Form + Zod for forms
   - TanStack Query hooks for data
   - Responsive design (mobile-first)
   - `data-testid` on interactive elements
   - Loading skeletons
   - Error states
   - Empty states
   - Toast notifications on CRUD actions

---

## Step 6: Tests

**When:** Always. Every feature must have tests.

### Unit Tests (required)

- Zod schema validation (valid/invalid inputs)
- Utility functions (calculations, formatting)
- Component rendering with mock data
- Located in `tests/unit/`

### Integration Tests (required for API routes)

- API route handlers with mocked Supabase
- Role-based access control verification
- Error handling (400, 401, 403, 404)
- Located in `tests/integration/`

### E2E Tests (required for user-facing features)

- Full user flow: navigate → interact → verify
- Use Playwright fixtures from `testing.prompt.md`
- Located in `tests/e2e/`

Follow patterns in `testing.prompt.md`.

---

## Step 7: Pull Request

### Branch Naming

```
feature/sprint-{N}-{description}
fix/sprint-{N}-{description}
chore/{description}
```

Examples:

- `feature/sprint-2-category-crud`
- `feature/sprint-3-transaction-form`
- `fix/sprint-5-budget-calculation`

### PR Checklist

Before opening a PR, verify:

- [ ] All new code has TypeScript types (no `any`)
- [ ] Zod schemas validate all user input
- [ ] API routes include auth + role checks
- [ ] RLS policies cover new tables (if any)
- [ ] Unit tests pass: `pnpm test`
- [ ] E2E tests pass: `pnpm test:e2e`
- [ ] Lint passes: `pnpm lint`
- [ ] Format passes: `pnpm format:check`
- [ ] Type-check passes: `pnpm type-check`
- [ ] Responsive design tested at 320px, 768px, 1024px
- [ ] Loading, error, and empty states implemented
- [ ] Toast notifications for CRUD operations
- [ ] `data-testid` attributes on key interactive elements
- [ ] No console.log left in code (use proper error handling)
- [ ] No hardcoded strings that should be in constants

### PR Title Format

```
[Sprint N] Feature: Brief description
```

Examples:

- `[Sprint 2] Feature: Category CRUD with sub-categories`
- `[Sprint 3] Feature: Transaction list with pagination`
- `[Sprint 5] Fix: Budget progress bar color thresholds`

### PR Description Template

```markdown
## Summary

Brief description of what this PR implements.

## Sprint Reference

Sprint N, Tasks: N.1, N.2, N.3

## Spec Reference

FR-XX.X, FR-XX.X (from Specification Document)

## Changes

- Added/Modified/Removed: [description]
- Added/Modified/Removed: [description]

## Tests

- [ ] Unit tests added: X new tests
- [ ] Integration tests added: X new tests
- [ ] E2E tests added: X new tests

## Screenshots / Demo

[Add screenshots for UI changes]

## Definition of Done

- [ ] [Sprint DoD item 1]
- [ ] [Sprint DoD item 2]
```

---

## Common Patterns Reference

### Quick Links

| Need                        | Prompt File                 |
| --------------------------- | --------------------------- |
| Database table or migration | `database-schema.prompt.md` |
| RLS policy                  | `supabase-rls.prompt.md`    |
| API route                   | `api-route.prompt.md`       |
| UI component or form        | `ui-component.prompt.md`    |
| Test pattern                | `testing.prompt.md`         |
| CI/CD config                | `ci-cd-pipeline.prompt.md`  |
| Project setup               | `project-setup.prompt.md`   |

### File Naming Conventions

| Type             | Location                                  | Naming                          |
| ---------------- | ----------------------------------------- | ------------------------------- |
| Page             | `src/app/(dashboard)/<route>/page.tsx`    | `page.tsx` (Next.js convention) |
| Layout           | `src/app/(dashboard)/<route>/layout.tsx`  | `layout.tsx`                    |
| API Route        | `src/app/api/<resource>/route.ts`         | `route.ts`                      |
| Component        | `src/components/<category>/<name>.tsx`    | `kebab-case.tsx`                |
| Hook             | `src/hooks/use-<resource>.ts`             | `use-<resource>.ts`             |
| Validation       | `src/lib/validations/<resource>.ts`       | `<resource>.ts`                 |
| Unit Test        | `tests/unit/<path>/<name>.test.ts(x)`     | `<name>.test.ts`                |
| Integration Test | `tests/integration/<path>/<name>.test.ts` | `<name>.test.ts`                |
| E2E Test         | `tests/e2e/<name>.spec.ts`                | `<name>.spec.ts`                |

### Sprint Velocity Tracking

After each sprint, note:

| Metric          | Value                              |
| --------------- | ---------------------------------- |
| Tasks planned   | X                                  |
| Tasks completed | X                                  |
| Tests added     | X unit, X integration, X E2E       |
| Bugs found      | X                                  |
| Rollover items  | [list any incomplete tasks]        |
| Notes           | [blockers, learnings, adjustments] |

This helps calibrate future sprint planning and identifies patterns.
