# Dashboard Widget Customization — Feature Specification

**Drag-and-drop reordering + enable/disable for dashboard widgets**

---

| Field         | Value                                      |
| ------------- | ------------------------------------------ |
| Feature       | Dashboard Widget Customization             |
| Status        | APPROVED                                   |
| Date          | March 7, 2026                              |
| Scope         | Web App only (mobile will inherit via API) |
| Target Branch | `feat/dashboard-widget-customization`      |

---

## 1. Summary

Users can rearrange and toggle visibility of dashboard widgets according to their preferences. Preferences are persisted per-user in the database. The feature is accessible to all roles (admin + contributor) via a "Customize" button on the dashboard header.

---

## 2. Current Dashboard Layout

The dashboard page (`src/app/(dashboard)/dashboard/page.tsx`) renders 9 widgets in a fixed order across 5 rows:

| Row | Left Column                                                                             | Right Column                |
| --- | --------------------------------------------------------------------------------------- | --------------------------- |
| 1   | **Metric Cards** (full width, 4 cards: income, expenses, net savings, budget remaining) |                             |
| 2   | **Budget Progress** (Monthly Spending vs Budget)                                        | **Income vs Expense Chart** |
| 3   | **Recent Transactions**                                                                 | **Upcoming Bills**          |
| 4   | **Savings Goals**                                                                       | **Account Balances**        |
| 5   | **Overall Budget**                                                                      | **Budget vs Actual Chart**  |

### Widget Registry

Each widget must have a unique ID. Define these in a constant:

```typescript
// src/lib/constants.ts (or a new src/lib/dashboard-widgets.ts)
export const DASHBOARD_WIDGETS = [
  {
    id: 'metric-cards',
    label: 'Metric Cards',
    description: 'Income, expenses, net savings, budget remaining',
    icon: 'LayoutGrid',
    defaultOrder: 0,
    defaultEnabled: true,
    fullWidth: true,
  },
  {
    id: 'budget-progress',
    label: 'Budget Progress',
    description: 'Monthly spending vs budget by category',
    icon: 'BarChart3',
    defaultOrder: 1,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'income-vs-expense',
    label: 'Income vs Expense',
    description: 'Income and expense comparison chart',
    icon: 'TrendingUp',
    defaultOrder: 2,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'recent-transactions',
    label: 'Recent Transactions',
    description: 'Last 5 transactions',
    icon: 'Receipt',
    defaultOrder: 3,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'upcoming-bills',
    label: 'Upcoming Bills',
    description: 'Bills due soon with days remaining',
    icon: 'CalendarClock',
    defaultOrder: 4,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'savings-goals',
    label: 'Savings Goals',
    description: 'Progress toward savings targets',
    icon: 'PiggyBank',
    defaultOrder: 5,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'account-balances',
    label: 'Account Balances',
    description: 'All account balances at a glance',
    icon: 'Wallet',
    defaultOrder: 6,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'overall-budget',
    label: 'Overall Budget',
    description: 'Total spending vs overall budget cap',
    icon: 'Target',
    defaultOrder: 7,
    defaultEnabled: true,
    fullWidth: false,
  },
  {
    id: 'budget-vs-actual',
    label: 'Budget vs Actual',
    description: 'Budget vs actual spending chart',
    icon: 'BarChartBig',
    defaultOrder: 8,
    defaultEnabled: true,
    fullWidth: false,
  },
] as const;

export type WidgetId = (typeof DASHBOARD_WIDGETS)[number]['id'];
```

---

## 3. User Experience

### 3.1 Entry Point

Add a **"Customize"** button (gear/sliders icon) in the dashboard header, next to the month selector:

```
┌─────────────────────────────────────────────────────┐
│ Dashboard                           ◀ March 2026 ▶  │
│ Your financial overview...          [⚙ Customize]   │
└─────────────────────────────────────────────────────┘
```

### 3.2 Customize Panel

Clicking "Customize" opens a **modal/dialog** containing:

1. **A sortable list of all 9 widgets** — each row shows:
   - Drag handle (≡ grip icon) on the left
   - Widget name + short description
   - Up/Down arrow buttons for keyboard/accessible reordering
   - Toggle switch (enabled/disabled) on the right

2. **Footer buttons:**
   - **"Reset to Default"** — restores original order with all widgets enabled
   - **"Cancel"** — discards changes, closes modal
   - **"Save"** — persists preferences to database, closes modal, dashboard re-renders

### 3.3 Interaction Details

- **Drag and drop:** User grabs the drag handle and drags to reorder. Use `@dnd-kit/core` + `@dnd-kit/sortable` (already well-suited for React, accessible, lightweight).
- **Arrow buttons:** Up/Down buttons move the widget one position. Disabled at the top/bottom of the list respectively.
- **Toggle:** Disabling a widget grays out its row in the list and hides it from the dashboard. At least 1 widget must remain enabled (disable the toggle on the last enabled widget).
- **Visual preview (optional stretch):** Show a miniature live preview of the layout as widgets are reordered/toggled. If too complex, skip — the list order is sufficient.

### 3.4 Dashboard Rendering with Preferences

After saving, the dashboard:

1. Renders only **enabled** widgets
2. Renders them in the **saved order**
3. Pairs half-width widgets into 2-column rows (left-to-right, in order)
4. Full-width widgets (`metric-cards`) get their own row
5. If an odd number of half-width widgets are enabled, the last one renders full-width

### 3.5 Default Behavior (No Saved Preferences)

When no preferences exist (new user, or preferences never customized), render all 9 widgets in the default order — exactly as the dashboard looks today. No visual difference.

---

## 4. Data Model

### 4.1 Database Migration

Create migration `00005_dashboard_preferences.sql`:

```sql
-- Add dashboard_preferences JSONB column to users table
ALTER TABLE users
  ADD COLUMN dashboard_preferences JSONB DEFAULT NULL;

-- Optional: add a comment for documentation
COMMENT ON COLUMN users.dashboard_preferences IS
  'User dashboard widget preferences: [{id, order, enabled}]. NULL = default layout.';
```

**JSON shape stored in `dashboard_preferences`:**

```json
[
  { "id": "metric-cards", "order": 0, "enabled": true },
  { "id": "recent-transactions", "order": 1, "enabled": true },
  { "id": "budget-progress", "order": 2, "enabled": true },
  { "id": "income-vs-expense", "order": 3, "enabled": false },
  { "id": "upcoming-bills", "order": 4, "enabled": true },
  { "id": "savings-goals", "order": 5, "enabled": true },
  { "id": "account-balances", "order": 6, "enabled": true },
  { "id": "overall-budget", "order": 7, "enabled": true },
  { "id": "budget-vs-actual", "order": 8, "enabled": false }
]
```

- `NULL` means "use defaults" — no bloat for users who never customize.
- JSONB on the existing `users` table (no new table needed — this is a single user preference).

### 4.2 RLS

Existing `users` table RLS policies already restrict reads/writes to the user's own row. No new policies needed — the `dashboard_preferences` column inherits the existing row-level security.

### 4.3 Validation Schema

Add to validations (Zod):

```typescript
// src/lib/validations/dashboard.ts
import { z } from 'zod';
import { DASHBOARD_WIDGETS } from '@/lib/constants';

const widgetIds = DASHBOARD_WIDGETS.map((w) => w.id) as [string, ...string[]];

export const widgetPreferenceSchema = z.object({
  id: z.enum(widgetIds),
  order: z.number().int().min(0).max(20),
  enabled: z.boolean(),
});

export const dashboardPreferencesSchema = z
  .array(widgetPreferenceSchema)
  .min(1, 'At least one widget must be enabled')
  .refine((prefs) => prefs.some((p) => p.enabled), 'At least one widget must be enabled')
  .refine((prefs) => {
    const ids = prefs.map((p) => p.id);
    return new Set(ids).size === ids.length;
  }, 'Duplicate widget IDs are not allowed');

export type WidgetPreference = z.infer<typeof widgetPreferenceSchema>;
export type DashboardPreferences = z.infer<typeof dashboardPreferencesSchema>;
```

---

## 5. API

### 5.1 `GET /api/users/me/dashboard-preferences`

Returns the user's saved preferences or `null` (use defaults).

**Response:**

```json
{
  "preferences": [...] | null
}
```

### 5.2 `PUT /api/users/me/dashboard-preferences`

Saves the user's widget preferences.

**Request body:**

```json
{
  "preferences": [
    { "id": "metric-cards", "order": 0, "enabled": true },
    ...
  ]
}
```

**Validation:**

- Validate with `dashboardPreferencesSchema`
- Ensure all known widget IDs are present (no partial saves — always save the full list)
- At least one widget must be `enabled: true`

**Response:**

```json
{
  "preferences": [...]
}
```

### 5.3 `DELETE /api/users/me/dashboard-preferences`

Resets preferences to `null` (default layout). Used by the "Reset to Default" button.

**Response:**

```json
{
  "preferences": null
}
```

---

## 6. Frontend Implementation

### 6.1 New Files to Create

| File                                                  | Purpose                                        |
| ----------------------------------------------------- | ---------------------------------------------- |
| `src/lib/validations/dashboard.ts`                    | Zod schemas for widget preferences             |
| `src/lib/dashboard-widgets.ts`                        | Widget registry constant (`DASHBOARD_WIDGETS`) |
| `src/hooks/use-dashboard-preferences.ts`              | TanStack Query hook for CRUD preferences       |
| `src/components/dashboard/customize-dialog.tsx`       | Modal with sortable widget list                |
| `src/components/dashboard/sortable-widget-item.tsx`   | Single row in the sortable list                |
| `src/components/dashboard/widget-renderer.tsx`        | Renders widgets dynamically by ID + order      |
| `src/app/api/users/me/dashboard-preferences/route.ts` | API route (GET, PUT, DELETE)                   |

### 6.2 Files to Modify

| File                                     | Changes                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/app/(dashboard)/dashboard/page.tsx` | Replace hardcoded widget layout with dynamic rendering via `widget-renderer.tsx`; add Customize button to header |
| `src/lib/constants.ts`                   | Add `DASHBOARD_WIDGETS` (or import from new file)                                                                |
| `package.json`                           | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`                                                   |

### 6.3 `use-dashboard-preferences` Hook

```typescript
// src/hooks/use-dashboard-preferences.ts
// Query key: ['dashboard-preferences']

// useQuery:  GET /api/users/me/dashboard-preferences
// useMutation (save):  PUT /api/users/me/dashboard-preferences
// useMutation (reset): DELETE /api/users/me/dashboard-preferences

// On success: invalidate ['dashboard-preferences'] query
```

### 6.4 Widget Renderer Logic

The `widget-renderer.tsx` component:

1. Receives the full dashboard data (from `useDashboard`) and preferences (from `useDashboardPreferences`)
2. If preferences are `null`, uses `DASHBOARD_WIDGETS` default order with all enabled
3. Filters to only `enabled: true` widgets
4. Sorts by `order`
5. Renders widgets dynamically using a `switch` or map on `widget.id`:

```typescript
function renderWidget(id: WidgetId, data: DashboardData) {
  switch (id) {
    case 'metric-cards':
      return <MetricCards {...} />;
    case 'budget-progress':
      return <BudgetProgressSection {...} />;
    case 'income-vs-expense':
      return <IncomeVsExpenseChart {...} />;
    // ... etc
  }
}
```

6. Pairs half-width widgets into 2-column grid rows; full-width widgets get their own row.

### 6.5 Customize Dialog UX Flow

```
User clicks "Customize"
    → Modal opens with sortable list (current order + toggle states)
    → User drags widgets / clicks arrows / toggles switches
    → User clicks "Save"
        → PUT /api/users/me/dashboard-preferences
        → Modal closes
        → Dashboard re-renders with new layout
    → OR user clicks "Cancel"
        → Modal closes, no changes
    → OR user clicks "Reset to Default"
        → DELETE /api/users/me/dashboard-preferences
        → Modal updates to show default order, all enabled
        → User can then "Save" or "Cancel"
```

---

## 7. Dependencies

Install `@dnd-kit` packages:

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

These are lightweight, accessible, and React-first. No other new dependencies needed.

---

## 8. Testing Requirements

### 8.1 Unit Tests

| Test                                                                                         | Coverage   |
| -------------------------------------------------------------------------------------------- | ---------- |
| `dashboardPreferencesSchema` validation — valid input, missing IDs, duplicates, all disabled | Zod schema |
| Widget renderer — renders correct widgets in order, skips disabled, handles null preferences | Component  |
| Sortable list — reorder updates state, toggle updates state, minimum 1 enabled enforced      | Component  |

### 8.2 Integration Tests

| Test                                                                                                 | Coverage |
| ---------------------------------------------------------------------------------------------------- | -------- |
| `GET /api/users/me/dashboard-preferences` — returns `null` for new user, returns saved prefs         | API      |
| `PUT /api/users/me/dashboard-preferences` — saves valid prefs, rejects invalid, rejects all disabled | API      |
| `DELETE /api/users/me/dashboard-preferences` — resets to null                                        | API      |
| Auth: 401 for unauthenticated requests                                                               | API      |

### 8.3 E2E Tests (if Playwright exists)

| Test                                                                  | Coverage  |
| --------------------------------------------------------------------- | --------- |
| Open customize dialog → reorder → save → dashboard reflects new order | Full flow |
| Disable a widget → save → widget not visible on dashboard             | Toggle    |
| Reset to default → all widgets visible in original order              | Reset     |

---

## 9. Accessibility Requirements

- Drag-and-drop must have keyboard alternative (Up/Down arrow buttons satisfy this)
- All interactive elements must have `aria-label` or visible label
- Toggle switches must announce state ("Widget enabled" / "Widget disabled")
- Sortable list items must have `aria-roledescription="sortable"` (dnd-kit provides this)
- Focus management: focus moves logically when items are reordered
- Color is not the only indicator of enabled/disabled state (use opacity + strikethrough text)

---

## 10. Edge Cases

| Scenario                                                       | Behavior                                                                                             |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| New widget added in future code update                         | If saved preferences don't include a new widget ID, append it to the end as enabled. Migration-safe. |
| Widget removed in future code update                           | Filter out unknown IDs from saved preferences silently.                                              |
| All widgets disabled (should be impossible)                    | Validation prevents saving. UI disables the toggle on the last enabled widget.                       |
| User has preferences but data returns empty (e.g., no budgets) | Widget still renders with its empty state ("No budgets set"). Visibility ≠ data existence.           |
| Concurrent edits (two tabs)                                    | Last write wins. TanStack Query refetch on window focus handles sync.                                |

---

## 11. Implementation Order

1. **Database:** Create migration `00005_dashboard_preferences.sql`
2. **Constants:** Add `DASHBOARD_WIDGETS` registry and `WidgetId` type
3. **Validation:** Create `src/lib/validations/dashboard.ts`
4. **API route:** Create `src/app/api/users/me/dashboard-preferences/route.ts` (GET, PUT, DELETE)
5. **Hook:** Create `src/hooks/use-dashboard-preferences.ts`
6. **Widget renderer:** Create `src/components/dashboard/widget-renderer.tsx`
7. **Customize dialog:** Create `src/components/dashboard/customize-dialog.tsx` + `sortable-widget-item.tsx`
8. **Dashboard page:** Refactor `page.tsx` to use widget renderer + add Customize button
9. **Tests:** Unit + integration tests for all new code
10. **Install deps:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

---

## 12. Out of Scope

- Widget resizing (half-width vs full-width toggle) — not included
- Per-household shared layout — preferences are per-user only
- Mobile app widget customization — will be addressed in mobile sprint plan
- Widget-specific settings (e.g., "show 10 recent transactions instead of 5")
- Drag-and-drop directly on the dashboard (only in the customize modal)
