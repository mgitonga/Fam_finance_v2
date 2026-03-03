# Category Import/Export — Implementation Plan

**Feature:** Export and Import categories using CSV files
**Date:** March 3, 2026
**Status:** APPROVED

---

## Overview

Users (Admin only) can export the current category hierarchy to a CSV file and import categories from a CSV file. This enables:

- Backing up category structures before making changes
- Sharing category templates between households (future scope)
- Bulk editing categories in a spreadsheet tool and re-importing

---

## Decisions

| Decision     | Choice                                                                         |
| ------------ | ------------------------------------------------------------------------------ |
| CSV format   | Flat CSV with `parent_category` text column (empty for top-level)              |
| Import mode  | Merge — add new categories, skip existing (matched by name case-insensitively) |
| Access       | Admin only (consistent with existing category CRUD permissions)                |
| Export scope | Active categories only (`is_active = true`)                                    |

---

## CSV Format

### Export Template

```csv
name,type,parent_category,color,icon,sort_order
Food & Groceries,expense,,#2563EB,,1
Household Goods,expense,Food & Groceries,,,2
Fruit & Veg,expense,Food & Groceries,,,3
Dining,expense,,#f97316,,4
Eating Out,expense,Dining,,,1
Salary,income,,#22c55e,,1
Other,both,,#888888,,99
```

**Column definitions:**

| Column            | Required | Description                                 |
| ----------------- | -------- | ------------------------------------------- |
| `name`            | Yes      | Category name (max 100 chars)               |
| `type`            | Yes      | `expense`, `income`, or `both`              |
| `parent_category` | No       | Name of parent category (empty = top-level) |
| `color`           | No       | Hex color code (e.g., `#2563EB`)            |
| `icon`            | No       | Icon identifier string                      |
| `sort_order`      | No       | Display order (integer, defaults to 0)      |

### Rules

1. Parent categories must appear **before** their children in the CSV (top-down ordering)
2. Only **one level** of nesting is allowed (consistent with MVP spec §FR-03.5)
3. Category names are matched **case-insensitively** for duplicate detection
4. `type` must be one of: `expense`, `income`, `both`
5. `color` must be a valid hex code (`#RRGGBB`) or empty

---

## API Endpoints

### `GET /api/categories/export`

**Auth:** Admin only

**Response:** CSV file download containing all active categories with hierarchy.

**Logic:**

1. Fetch all active categories for the household (`is_active = true`)
2. Sort: parent categories first (by `sort_order`), then children grouped under their parent
3. For each child, populate `parent_category` with the parent's name
4. Return as `text/csv` with `Content-Disposition: attachment`

### `GET /api/categories/import/template`

**Auth:** Admin only

**Response:** Empty CSV template with headers + 2 sample rows.

### `POST /api/categories/import/preview`

**Auth:** Admin only

**Request:** `multipart/form-data` with CSV file

**Response:** Preview of parsed rows with validation status

```json
{
  "data": {
    "rows": [
      {
        "row": 2,
        "name": "Groceries",
        "type": "expense",
        "parent_category": "",
        "color": "#2563EB",
        "action": "create",
        "errors": [],
        "valid": true
      },
      {
        "row": 3,
        "name": "Food & Groceries",
        "type": "expense",
        "parent_category": "",
        "action": "skip",
        "errors": [],
        "valid": true
      }
    ],
    "summary": {
      "total": 10,
      "toCreate": 5,
      "toSkip": 4,
      "errors": 1
    }
  }
}
```

**Validation rules:**

- `name` is required and non-empty
- `type` must be `expense`, `income`, or `both`
- `parent_category` (if provided) must match an existing category or a category earlier in the CSV
- `color` (if provided) must be valid hex (`#RRGGBB`)
- Duplicate detection: if a category with the same name already exists (case-insensitive), mark as `skip`
- A sub-category referencing a non-existent parent → error

### `POST /api/categories/import/confirm`

**Auth:** Admin only

**Request:**

```json
{
  "rows": [
    { "name": "...", "type": "...", "parent_category": "...", "color": "...", "sort_order": 0 }
  ]
}
```

**Logic:**

1. Process rows in order (parents first, then children)
2. For each row with `action: "create"`:
   - If no `parent_category`: insert as top-level category
   - If `parent_category`: look up parent ID by name, insert with `parent_id`
3. Skip rows with `action: "skip"` (already exist)
4. Return success/error count

**Response:**

```json
{
  "data": {
    "created": 5,
    "skipped": 4,
    "errors": 1,
    "errorDetails": [{ "row": 8, "error": "Parent 'NonExistent' not found" }]
  }
}
```

---

## UI Changes

### Settings → Categories page

Add two buttons next to the existing "Add Category" button:

1. **Export CSV** — Downloads the current category hierarchy as CSV
2. **Import CSV** — Opens a 3-step import flow (same pattern as transaction import):
   - Step 1: Download template + upload CSV file
   - Step 2: Preview table showing each row with create/skip/error status
   - Step 3: Confirm import → results summary

### Wireframe

```
┌──────────────────────────────────────────────────┐
│ Categories                                        │
│ Manage expense and income categories...           │
│                                                    │
│ [+ Add Category]  [↓ Export CSV]  [↑ Import CSV]  │
│                                                    │
│ ... existing category list ...                     │
└──────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

### New Files

| File                                              | Purpose                           |
| ------------------------------------------------- | --------------------------------- |
| `src/app/api/categories/export/route.ts`          | CSV export endpoint               |
| `src/app/api/categories/import/template/route.ts` | Template download endpoint        |
| `src/app/api/categories/import/preview/route.ts`  | CSV preview/validation endpoint   |
| `src/app/api/categories/import/confirm/route.ts`  | Confirm & execute import endpoint |

### Modified Files

| File                                               | Change                                     |
| -------------------------------------------------- | ------------------------------------------ |
| `src/app/(dashboard)/settings/categories/page.tsx` | Add Export/Import buttons + import flow UI |
| `src/lib/validations/category.ts`                  | Add CSV row validation schema              |

### Test Files

| File                                                 | Tests                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| `tests/unit/lib/validations/category-import.test.ts` | CSV parsing, validation rules, duplicate detection, parent matching |

---

## Validation Schema (Zod)

```typescript
export const categoryImportRowSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['expense', 'income', 'both']),
  parent_category: z.string().max(100).optional().default(''),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .default(''),
  icon: z.string().max(50).optional().default(''),
  sort_order: z.number().int().optional().default(0),
});
```

---

## Test Cases

1. **Export:** Verify CSV output contains all active categories with correct parent mapping
2. **Import — valid file:** All new categories created successfully
3. **Import — duplicates:** Existing categories skipped, new ones created
4. **Import — invalid type:** Row rejected with error
5. **Import — missing parent:** Row rejected with "parent not found" error
6. **Import — parent in same file:** Parent defined earlier in CSV, child resolves correctly
7. **Import — invalid color:** Row rejected with "invalid hex color" error
8. **Import — empty name:** Row rejected with "name required" error
9. **Import — case-insensitive matching:** "food & groceries" matches "Food & Groceries"
10. **Import — second-level nesting rejected:** If a child tries to be parent of another child → error

---

## Verification

- [ ] Admin can export categories to CSV
- [ ] CSV contains correct hierarchy (parent_category column populated)
- [ ] Admin can download import template
- [ ] Preview shows create/skip/error status per row
- [ ] Confirm creates new categories, skips existing
- [ ] Parent-child relationships preserved after import
- [ ] Non-admin users cannot access import/export endpoints
- [ ] Unit tests pass for all validation rules
