# Feature Change: Budget vs Actual — Bullet Chart

**Status:** Pending Review  
**Author:** GitHub Copilot  
**Date:** 2026-03-07

---

## 1. Summary

Replace the current side-by-side horizontal bar chart in the **Budget vs Actual** dashboard widget with a **bullet chart**. A bullet chart is a compact, information-dense visualization where each category's actual spending is shown as a bar layered on top of a target marker (the allocated budget), making it immediately clear whether spending is under, at, or over budget.

---

## 2. Current State

The existing `BudgetVsActualChart` component renders a **Recharts horizontal `BarChart`** with two separate bars per category:

- A gray bar for **Budget** (allocated amount)
- A blue bar for **Spent** (actual spending)

**Issues with the current approach:**

- Two bars per category consume vertical space — scales poorly with many categories
- Comparison requires visual back-and-forth between bar endpoints
- The category `color` from the data is accepted but never used (hardcoded fills)
- No visual urgency indicator when spending exceeds budget

---

## 3. Proposed Design

A **horizontal bullet chart** where each row represents one budget category:

```
┌─────────────────────────────────────────────────────────┐
│  Food & Groceries                                       │
│  ██████████████████████▓▓▓▓▓▓▓░░░░░░░░░  │ ▼ 15,000    │
│  ├── Spent: 12,400 ──┤├─ Remaining ─┤                   │
│                       ▲ Budget: 15,000                   │
│                                                         │
│  Transport                                              │
│  ████████████████████████████████████████  │ ▼ 8,000     │
│  ├───────── Spent: 9,200 (OVER) ────────┤                │
│                       ▲ Budget: 8,000                    │
└─────────────────────────────────────────────────────────┘
```

### Visual Elements Per Row

| Element                | Description                                                    | Visual                                                        |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| **Background range**   | Full bar width = 120% of budget (gives room to show overspend) | Light gray band                                               |
| **Spent bar**          | Actual spending amount, drawn as a filled bar                  | Colored by status: green (≤75%), amber (75–100%), red (>100%) |
| **Budget target line** | Vertical marker at the budget amount                           | Dark line/triangle marker                                     |
| **Category label**     | Category name on the left                                      | Text                                                          |
| **Values**             | Spent / Budget amounts on the right                            | Text with KES formatting                                      |

### Color Logic (Status-Based)

| Spent % of Budget | Bar Color         | Label             |
| ----------------- | ----------------- | ----------------- |
| 0–75%             | Green (`#22c55e`) | On track          |
| 75–100%           | Amber (`#f59e0b`) | Approaching limit |
| >100%             | Red (`#ef4444`)   | Over budget       |

This reuses the same thresholds already used in the `BudgetProgress` component's `getBudgetStatus()` function.

---

## 4. Technical Approach

### Option A: Custom SVG/CSS (Recommended)

Build the bullet chart with pure CSS/Tailwind `<div>` elements — no Recharts dependency for this widget. Each row is:

- An outer container (the range background)
- An inner `<div>` for the spent bar (width derived from percentage)
- A positioned marker `<div>` for the budget target line

**Pros:** Lightweight, pixel-perfect control, dark-mode friendly, no extra bundle size  
**Cons:** No built-in tooltips (can add with Tailwind `group`/`hover`)

### Option B: Recharts Composite Bar

Use a single `BarChart` with a `ReferenceLine` per category to mark the budget target, and a single colored bar for spending.

**Pros:** Consistent with other chart components, built-in tooltips  
**Cons:** Recharts doesn't natively support per-bar reference lines in a vertical layout; would require workarounds

### Recommendation: **Option A** — The bullet chart pattern maps naturally to CSS, is more responsive, and avoids Recharts limitations with reference markers.

---

## 5. Component Changes

### Modified File: `src/components/charts/budget-vs-actual.tsx`

- Replace the entire `BarChart` with a custom bullet chart layout
- Same data type `BudgetItem[]` (no API changes needed)
- Same props interface `BudgetVsActualChartProps`
- Same wrapper card with `data-testid="budget-actual-chart"`
- Same empty-state handling

### No Other Changes Required

- Dashboard API (`/api/dashboard`) — unchanged, already returns `{ category, color, budget, spent, percentage }`
- Widget renderer — unchanged, already passes `data.budgetVsActual`
- Widget registration — unchanged
- Types/validations — unchanged

---

## 6. Interaction Details

- **Hover on a spent bar**: Show tooltip with "Spent: KES X,XXX / Budget: KES X,XXX (XX%)"
- **Budget target marker**: Always visible as a vertical line with a small label
- **Overspend**: The bar extends past the target line; the background range is scaled to accommodate up to 150% of budget
- **Zero budget**: Show "No budget set" text for that category (edge case)
- **Dark mode**: Background range uses `dark:bg-gray-800`, bar colors remain vivid

---

## 7. Scope

| In Scope                                | Out of Scope                                          |
| --------------------------------------- | ----------------------------------------------------- |
| Replace chart in `budget-vs-actual.tsx` | Changing the Budget Progress widget (separate widget) |
| Status-based color coding               | Adding new data fields to the API                     |
| Hover tooltips                          | Click-through to budget detail page                   |
| Dark mode support                       | Animation/transitions                                 |
| Responsive layout                       | Mobile-specific layout                                |

---

## 8. Mockup (Tailwind Structure)

```tsx
{
  /* Per category row */
}
<div className="group relative">
  <div className="mb-1 flex items-center justify-between text-sm">
    <span className="font-medium">{category}</span>
    <span className="text-gray-500">
      {formatKES(spent)} / {formatKES(budget)}
    </span>
  </div>
  {/* Bullet chart bar */}
  <div className="relative h-6 w-full rounded bg-gray-100 dark:bg-gray-800">
    {/* Spent bar */}
    <div
      className="absolute inset-y-0 left-0 rounded"
      style={{ width: `${spentPct}%`, backgroundColor: statusColor }}
    />
    {/* Budget target marker */}
    <div
      className="absolute top-0 h-full w-0.5 bg-gray-800 dark:bg-gray-200"
      style={{ left: `${targetPct}%` }}
    />
  </div>
</div>;
```
