# Category Icon Picker — Implementation Plan

## Objective

Display Lucide icons next to each category in the Settings > Categories page and allow users to select/change an icon when creating or editing a category.

---

## Current State

- **DB column**: `categories.icon VARCHAR(50)` — stores Lucide icon names in kebab-case (e.g., `shopping-cart`, `home`)
- **Existing data**: All 45 categories have icons populated (migration `00012_category_icons.sql`)
- **Validation schema**: `icon: z.string().max(50).nullable().optional()` — already accepts icon strings
- **API & hooks**: Create/update already pass `icon` field through — no backend changes needed
- **Categories page**: Stores `icon` in `CategoryWithChildren` type and passes it during edit, but **never renders it or lets user pick one**

---

## Changes Required

### 1. New Component: `src/components/ui/icon-picker.tsx`

A reusable icon picker popover that lets users search and select a Lucide icon.

**Design:**

- Button showing the currently selected icon (or a placeholder)
- On click, opens a popover/dropdown with:
  - Search input (filters icons by name)
  - Scrollable grid of icon buttons (6 columns)
  - Curated subset of ~80-100 finance-relevant Lucide icons (not all 1500+)
- On select, calls `onSelect(iconName: string)`

**Curated icon list** (grouped by relevance to personal finance):

| Group             | Icons                                                                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Money & Finance   | `wallet`, `banknote`, `coins`, `credit-card`, `piggy-bank`, `landmark`, `circle-dollar-sign`, `hand-coins`, `receipt`, `percent`, `trending-up`, `trending-down`, `bar-chart-3`, `chart-pie` |
| Shopping          | `shopping-cart`, `shopping-bag`, `package`, `store`, `tag`, `tags`, `gift`, `basket`                                                                                                         |
| Food & Drink      | `apple`, `utensils`, `chef-hat`, `coffee`, `wine`, `beer`, `cake`, `cookie`, `salad`, `egg`, `sandwich`, `pizza`, `ice-cream-cone`                                                           |
| Home              | `home`, `key-round`, `sofa`, `lamp`, `hammer`, `wrench`, `paint-bucket`, `bed`, `bath`, `door-open`                                                                                          |
| Transport         | `car`, `car-taxi-front`, `bus`, `train-front`, `plane`, `bike`, `fuel`, `map-pin`, `navigation`                                                                                              |
| Utilities         | `zap`, `plug-zap`, `droplets`, `wifi`, `phone`, `smartphone`, `monitor`, `tv`, `radio`                                                                                                       |
| Health            | `heart-pulse`, `pill`, `stethoscope`, `syringe`, `activity`, `thermometer`                                                                                                                   |
| Education         | `graduation-cap`, `book-open`, `library`, `pencil`, `notebook-pen`, `school`                                                                                                                 |
| People            | `baby`, `users`, `user`, `hand-heart`, `heart-handshake`                                                                                                                                     |
| Entertainment     | `film`, `music`, `gamepad-2`, `ticket`, `drama`, `palette`, `camera`, `headphones`                                                                                                           |
| Sports            | `dumbbell`, `trophy`, `medal`, `bike`, `running`                                                                                                                                             |
| Work              | `briefcase`, `building`, `building-2`, `laptop`, `printer`                                                                                                                                   |
| Religion & Giving | `church`, `heart`, `hand-helping`                                                                                                                                                            |
| Travel            | `globe`, `luggage`, `tent`, `mountain`, `palm-tree`                                                                                                                                          |
| General           | `circle-dot`, `star`, `flag`, `bookmark`, `file-text`, `folder`, `clock`, `calendar`, `bell`, `shield`, `lock`, `eye`, `search`, `settings`, `truck`, `archive`                              |

**Props:**

```tsx
interface IconPickerProps {
  value: string | null; // current icon name
  onChange: (icon: string) => void;
  className?: string;
}
```

**Behavior:**

- Shows selected icon + name as trigger button
- Popover closes on selection
- Search is case-insensitive, filters on icon name
- Keyboard accessible (tab, enter, escape)

---

### 2. New Component: `src/components/ui/dynamic-icon.tsx`

A utility component to render a Lucide icon from its kebab-case string name.

```tsx
interface DynamicIconProps {
  name: string;
  className?: string;
  fallback?: React.ReactNode;
}
```

**Approach:** Use a static map of icon-name → component for the curated set (same list as the picker). This avoids dynamic imports and keeps the bundle predictable.

---

### 3. Update: Categories Settings Page

**File:** `src/app/(dashboard)/settings/categories/page.tsx`

#### 3a. Category list — show icon

In the parent category row, render the icon before the color dot:

```
[icon] [color-dot] Category Name [type-badge]
```

In sub-category rows, render the icon before the name:

```
  > [icon] Sub-category Name
```

If a category has no icon, show nothing (graceful fallback).

#### 3b. Create/Edit form — add icon picker

Add `<IconPicker>` to the modal form, in a new row below the Name/Type/Color fields:

```
| Name        | Type     | Color  |
| Icon  [icon-picker-button]       |
```

Wire it to `setValue('icon', selectedIcon)` and read from the form's current `icon` value.

---

### 4. API Routes — Add `icon` to category select joins

Every Supabase query that joins `categories(name, color)` needs `icon` added so the frontend can render it. The following files need `categories(name, color)` → `categories(name, color, icon)`:

| File                                          | Line(s) | Current Select                                 |
| --------------------------------------------- | ------- | ---------------------------------------------- |
| `src/app/api/transactions/route.ts`           | 25, 204 | `categories(name, color)`                      |
| `src/app/api/transactions/[id]/route.ts`      | 21, 136 | `categories(name, color)`                      |
| `src/app/api/bills/route.ts`                  | 14, 54  | `categories(name, color)`                      |
| `src/app/api/bills/[id]/route.ts`             | 33      | `categories(name, color)`                      |
| `src/app/api/recurring/route.ts`              | 15, 58  | `categories(name, color)`                      |
| `src/app/api/recurring/[id]/route.ts`         | 38      | `categories(name, color)`                      |
| `src/app/api/recurring/[id]/confirm/route.ts` | 48      | `categories(name, color)`                      |
| `src/app/api/budgets/route.ts`                | 155     | `categories(name, color, type)`                |
| `src/app/api/budgets/[id]/route.ts`           | 33      | `categories(name, color, type)`                |
| `src/app/api/dashboard/route.ts`              | 64, 85  | `categories(name)` / `categories(name, color)` |

**Not changed** (export-only, no UI rendering):

- `api/export/csv/route.ts` — CSV text export
- `api/export/pdf/route.ts` — PDF export
- `api/reports/account-statement/route.ts` — text export
- `api/accounts/[id]/statement-export/route.ts` — text export

---

### 5. Transactions Page — Show icon in table

**File:** `src/app/(dashboard)/transactions/page.tsx`

In the transaction table row (around line 357), the category cell currently shows:

```
[color-dot] Category Name
```

Change to:

```
[icon] [color-dot] Category Name
```

Using `<DynamicIcon name={tx.categories?.icon} />` before the color dot.

Also in the **category filter dropdown** (around line 240), show the icon next to each category name. Since native `<select>/<option>` elements don't support icons, this stays as text-only for now (switching to a custom dropdown is a future enhancement).

---

### 6. Recurring Page — Show icon beside category

**File:** `src/app/(dashboard)/recurring/page.tsx`

Where `rule.categories?.name` is displayed (line 271), add the icon:

```
[icon] Category Name
```

---

### 7. Bills Page — Show icon beside category

**File:** `src/app/(dashboard)/bills/page.tsx`

Where `bill.categories.name` is displayed (line 235), add the icon:

```
• [icon] Category Name
```

---

### 8. Budgets Page — Show icon beside category

**File:** `src/app/(dashboard)/budgets/page.tsx`

Where budget items show category names, add the icon beside the name.

---

### 9. Dashboard — Show icon in recent transactions

**File:** `src/app/(dashboard)/page.tsx` (or the dashboard component)

The dashboard shows recent transactions and upcoming bills with category names — add the icon there too.

---

## Summary: No Validation/Hook Changes Needed

- Validation schema already accepts `icon` field
- API routes already persist `icon` on create/update
- Category hooks already pass `icon` through
- Only the **select joins** in read queries need `icon` added

---

## Files to Create / Edit

| File                                               | Action     | Description                                                   |
| -------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| `src/components/ui/dynamic-icon.tsx`               | **Create** | Static map + component to render Lucide icon from string name |
| `src/components/ui/icon-picker.tsx`                | **Create** | Searchable popover grid for selecting an icon                 |
| `src/app/(dashboard)/settings/categories/page.tsx` | **Edit**   | Show icons in list + add picker to form                       |
| `src/app/api/transactions/route.ts`                | **Edit**   | Add `icon` to categories select                               |
| `src/app/api/transactions/[id]/route.ts`           | **Edit**   | Add `icon` to categories select                               |
| `src/app/api/bills/route.ts`                       | **Edit**   | Add `icon` to categories select                               |
| `src/app/api/bills/[id]/route.ts`                  | **Edit**   | Add `icon` to categories select                               |
| `src/app/api/recurring/route.ts`                   | **Edit**   | Add `icon` to categories select                               |
| `src/app/api/recurring/[id]/route.ts`              | **Edit**   | Add `icon` to categories select                               |
| `src/app/api/recurring/[id]/confirm/route.ts`      | **Edit**   | Add `icon` to categories select                               |
| `src/app/api/budgets/route.ts`                     | **Edit**   | Add `icon` to categories select                               |
| `src/app/api/budgets/[id]/route.ts`                | **Edit**   | Add `icon` to categories select                               |
| `src/app/api/dashboard/route.ts`                   | **Edit**   | Add `icon` to categories select                               |
| `src/app/(dashboard)/transactions/page.tsx`        | **Edit**   | Show icon in table rows                                       |
| `src/app/(dashboard)/recurring/page.tsx`           | **Edit**   | Show icon beside category name                                |
| `src/app/(dashboard)/bills/page.tsx`               | **Edit**   | Show icon beside category name                                |
| `src/app/(dashboard)/budgets/page.tsx`             | **Edit**   | Show icon beside category name                                |
| `src/components/forms/transaction-form.tsx`        | **Edit**   | Show icon in category select (if custom dropdown)             |

---

## UX Details

- **Trigger button**: Shows current icon (24px) + icon name in muted text. If no icon, shows dashed outline with "Select icon" text
- **Popover**: ~320px wide, max 300px tall scrollable area
- **Search**: Debounced filtering as user types
- **Grid**: 6-column grid of icon buttons (40px each), hover highlights
- **Selected state**: Currently selected icon has a blue ring/highlight
- **Dark mode**: Fully themed — works in both light and dark modes
- **Mobile**: Popover positioned to stay in viewport

---

## Testing Notes

- Existing E2E tests for category CRUD should still pass (icon field is optional)
- New behavior to verify:
  - Icon picker opens, search filters icons
  - Selecting an icon updates the form
  - Created/edited category shows the icon in the list
  - Icons render correctly in both light/dark mode
