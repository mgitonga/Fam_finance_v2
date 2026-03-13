# Plan: Asset Management & Net Worth Reporting

## TL;DR

Add a full asset management feature to FamFin — users track fixed assets (property, vehicles, land, furniture) and current assets (investments, money market, cash equivalents, inventory), view valuation history, dispose of assets (auto-creating income transactions), and see an updated net worth calculation that includes assets. The feature follows existing patterns (accounts feature as primary template) with a new `assets` table, `asset_valuations` table, Zod schemas, hooks, API routes, dashboard page, detail page, dashboard widgets, and updated net worth report.

---

## Phase 1: Database & Backend Foundation

### Step 1 — Supabase Migration (`00013_assets.sql`)

Create two new tables plus seed an "Asset Sales" income category.

**`assets` table:**

- `id` UUID PK DEFAULT gen_random_uuid()
- `household_id` UUID FK → households(id) NOT NULL
- `name` TEXT NOT NULL (1-100 chars)
- `classification` TEXT NOT NULL CHECK ('fixed' | 'current')
- `type` TEXT NOT NULL CHECK ('real_estate' | 'vehicle' | 'furniture_equipment' | 'land' | 'investment' | 'money_market' | 'cash_equivalent' | 'inventory' | 'other')
- `purchase_price` NUMERIC NOT NULL (≥ 0)
- `current_value` NUMERIC NOT NULL (≥ 0)
- `purchase_date` DATE NOT NULL
- `description` TEXT (nullable)
- `is_active` BOOLEAN DEFAULT true (soft delete; false = disposed)
- `disposed_at` TIMESTAMPTZ (nullable — set on disposal)
- `disposal_amount` NUMERIC (nullable — sale price)
- `disposal_transaction_id` UUID FK → transactions(id) (nullable — links to auto-created income txn)
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now()

**`asset_valuations` table:**

- `id` UUID PK DEFAULT gen_random_uuid()
- `asset_id` UUID FK → assets(id) ON DELETE CASCADE NOT NULL
- `value` NUMERIC NOT NULL (≥ 0)
- `date` DATE NOT NULL
- `notes` TEXT (nullable)
- `created_at` TIMESTAMPTZ DEFAULT now()

**Indexes:**

- `assets(household_id)` — for RLS and listing
- `assets(household_id, classification)` — for filtered listing
- `assets(household_id, is_active)` — for active assets listing
- `asset_valuations(asset_id, date)` — for history queries

**RLS Policies** (same household isolation pattern as other tables):

- SELECT: `household_id = get_household_id(auth.uid())`
- INSERT/UPDATE/DELETE: admin role check via `get_user_role(auth.uid()) = 'admin'`
- asset_valuations: SELECT via join to assets, INSERT/UPDATE/DELETE via admin check

**Triggers:**

- `updated_at` auto-update trigger on assets
- On INSERT into `assets`, auto-insert initial valuation row into `asset_valuations` with `purchase_price` as value and `purchase_date` as date

**Seed "Asset Sales" category:**

- Insert into `categories` within `seed_default_categories()` function: `('Asset Sales', 'income', NULL, 'landmark', '#10b981')` — top-level income category

### Step 2 — TypeScript Types (`src/types/database.ts`)

Add `assets` and `asset_valuations` table types to the Database interface, following exact pattern of existing tables (Row, Insert, Update types).

### Step 3 — Zod Validation Schemas (`src/lib/validations/asset.ts`)

- `assetClassificationEnum`: `z.enum(['fixed', 'current'])`
- `assetTypeEnum`: `z.enum(['real_estate', 'vehicle', 'furniture_equipment', 'land', 'investment', 'money_market', 'cash_equivalent', 'inventory', 'other'])`
- `createAssetSchema`: name (1-100), classification, type, purchase_price (≥ 0), current_value (≥ 0), purchase_date, description?
  - `superRefine`: validate type matches classification (e.g., 'real_estate' only valid for 'fixed')
- `updateAssetSchema`: `createAssetSchema.partial()`
- `addValuationSchema`: value (≥ 0), date, notes?
- `disposeAssetSchema`: disposal_amount (≥ 0), account_id (UUID — which account receives the income), date, description?
- Type exports: `CreateAssetInput`, `UpdateAssetInput`, `AddValuationInput`, `DisposeAssetInput`

**Classification-to-type mapping:**

- fixed: real_estate, vehicle, furniture_equipment, land, other
- current: investment, money_market, cash_equivalent, inventory, other

---

## Phase 2: API Routes

### Step 4 — Assets CRUD API (`src/app/api/assets/route.ts`)

- **GET**: List active assets for household, ordered by `created_at DESC`. Return with latest valuation.
- **POST**: Validate with `createAssetSchema`, require admin, insert asset + initial valuation. Return created asset.

### Step 5 — Asset by ID API (`src/app/api/assets/[id]/route.ts`)

- **GET**: Fetch single asset with all valuations (ordered by date DESC). Include computed fields: `value_change` (current_value - purchase_price), `value_change_pct`.
- **PUT**: Validate with `updateAssetSchema`, require admin, update asset. If `current_value` changed, auto-insert new valuation row.
- **DELETE**: Soft delete (set `is_active = false`), require admin.

### Step 6 — Asset Valuations API (`src/app/api/assets/[id]/valuations/route.ts`)

- **POST**: Add a manual valuation entry. Validate with `addValuationSchema`, require admin. Also updates `assets.current_value` to the new value.

### Step 7 — Asset Disposal API (`src/app/api/assets/[id]/dispose/route.ts`)

- **POST**: Validate with `disposeAssetSchema`, require admin.
  1. Look up "Asset Sales" category (by name + type='income' for the household)
  2. Create income transaction: type='income', amount=disposal_amount, account_id from input, category_id=Asset Sales, description="Sale of {asset.name}", date from input
  3. Update asset: `is_active=false`, `disposed_at=now()`, `disposal_amount`, `disposal_transaction_id=txn.id`
  4. Return disposed asset + created transaction

### Step 8 — Update Net Worth API (`src/app/api/reports/net-worth/route.ts`)

Update formula to: **Assets (sum of current_value where is_active=true) + Account Balances (sum of balance where is_active=true) - Debts (sum of outstanding_balance where is_active=true)**

For historical months: query asset_valuations to find the most recent valuation on or before that month's end date for each asset that was active at that time.

---

## Phase 3: Frontend Hooks & Components

### Step 9 — Custom Hooks (`src/hooks/use-assets.ts`)

Following the pattern from `use-accounts.ts`:

- `ASSETS_KEY = ['assets']`
- `useAssets()` — GET /api/assets
- `useAsset(id)` — GET /api/assets/{id}
- `useCreateAsset()` — POST /api/assets, invalidates ASSETS_KEY
- `useUpdateAsset()` — PUT /api/assets/{id}, invalidates ASSETS_KEY
- `useDeleteAsset()` — DELETE /api/assets/{id}, invalidates ASSETS_KEY
- `useAddValuation()` — POST /api/assets/{id}/valuations, invalidates ASSETS_KEY
- `useDisposeAsset()` — POST /api/assets/{id}/dispose, invalidates ASSETS_KEY + ['transactions'] + ['accounts']

### Step 10 — Asset Form Component (`src/components/forms/asset-form.tsx`)

- React Hook Form + Zod resolver
- Fields: name, classification (select), type (select — filtered by classification), purchase_price, current_value, purchase_date, description
- Dynamic type dropdown: when classification changes, filter type options
- Mode: create vs edit (uses `defaultValues`)

### Step 11 — Dispose Asset Dialog (`src/components/forms/dispose-asset-dialog.tsx`)

- Modal dialog with: disposal_amount (pre-filled with current_value), account_id (select from active accounts), date, description
- Confirmation warning: "This will mark the asset as disposed and create an income transaction of KES {amount}"

### Step 12 — Valuation History Chart (`src/components/charts/asset-valuation-chart.tsx`)

- Line chart (Recharts) showing valuation over time
- X-axis: date, Y-axis: value
- Purchase price shown as dashed reference line
- Green line if current > purchase, red if depreciating

### Step 13 — Assets List Page (`src/app/(dashboard)/assets/page.tsx`)

Following accounts page pattern:

- Summary cards: Total Assets Value, Fixed Assets Value, Current Assets Value, Asset Count
- Filter tabs: All | Fixed | Current
- Card grid (sm:2, lg:3) with: asset name, type badge, current value, purchase price, value change %, sparkline
- Modal for create/edit
- Click card → navigate to detail page
- `data-testid` attributes for all interactive elements

### Step 14 — Asset Detail Page (`src/app/(dashboard)/assets/[id]/page.tsx`)

Following accounts detail pattern:

- Header: asset name, type, classification badge
- Key metrics: purchase price, current value, value change (amount + %)
- Valuation history chart
- Valuation entries table (date, value, notes) with "Add Valuation" button
- Dispose button (opens dispose dialog)
- Edit button (opens asset form modal)
- If disposed: show disposal info (date, amount, link to transaction)

---

## Phase 4: Navigation, Dashboard & Reports Integration

### Step 15 — Add to Sidebar Navigation (`src/components/layout/sidebar.tsx`)

Add "Assets" nav item between Debts and Bills:

- Icon: `Landmark` (Lucide) — appropriate for assets/property
- Path: `/assets`
- Label: "Assets"

### Step 16 — Dashboard Widgets

**Add two new widget IDs** to `src/lib/dashboard-widgets.ts` and `src/lib/validations/dashboard.ts`:

1. **`net-worth-summary`** — Shows current net worth with breakdown (assets, accounts, debts) as a compact card
2. **`asset-overview`** — Shows total asset value, top 3 assets by value, value change trend

**Widget components** in `src/components/widgets/`:

- `net-worth-widget.tsx` — Net worth number + mini donut (assets vs debts)
- `asset-overview-widget.tsx` — Total value + mini list of top assets

**Update** `widget-renderer.tsx` to render these new widgets.

**Dashboard API** (`src/app/api/dashboard/route.ts`): Add assets summary data to the dashboard response.

### Step 17 — Update Net Worth Report Chart

Update the Net Worth tab in Reports to show the new formula breakdown:

- Stacked area or line showing: Assets line, Account Balances line, Debts line (negative), Net Worth total line
- Legend explaining the components

---

## Phase 5: Testing

### Step 18 — Unit Tests (`tests/unit/`)

- `tests/unit/validations/asset.test.ts` — Zod schema validation (classification-type mapping, required fields, edge cases)
- `tests/unit/hooks/use-assets.test.ts` — Hook query/mutation behavior

### Step 19 — Integration Tests (`tests/integration/`)

- `tests/integration/api/assets.test.ts` — API route CRUD, disposal flow, valuation addition, auth/role checks

### Step 20 — E2E Tests (`tests/e2e/assets.spec.ts`)

- Display assets page with summary cards
- Create a fixed asset
- Create a current asset
- View asset detail page
- Add a valuation
- Dispose an asset (verify income transaction created)
- Verify net worth report reflects assets

---

## Relevant Files

### New Files

- `supabase/migrations/00013_assets.sql` — Migration for assets + asset_valuations tables + RLS + triggers + seed category
- `src/lib/validations/asset.ts` — Zod schemas
- `src/hooks/use-assets.ts` — TanStack Query hooks
- `src/app/api/assets/route.ts` — List + Create
- `src/app/api/assets/[id]/route.ts` — Get + Update + Delete
- `src/app/api/assets/[id]/valuations/route.ts` — Add valuation
- `src/app/api/assets/[id]/dispose/route.ts` — Dispose asset
- `src/app/(dashboard)/assets/page.tsx` — Assets list page
- `src/app/(dashboard)/assets/[id]/page.tsx` — Asset detail page
- `src/components/forms/asset-form.tsx` — Create/edit form
- `src/components/forms/dispose-asset-dialog.tsx` — Disposal confirmation dialog
- `src/components/charts/asset-valuation-chart.tsx` — Valuation history line chart
- `src/components/widgets/net-worth-widget.tsx` — Dashboard widget
- `src/components/widgets/asset-overview-widget.tsx` — Dashboard widget
- `tests/unit/validations/asset.test.ts`
- `tests/integration/api/assets.test.ts`
- `tests/e2e/assets.spec.ts`

### Modified Files

- `src/types/database.ts` — Add `assets` and `asset_valuations` table types
- `src/components/layout/sidebar.tsx` — Add "Assets" nav item
- `src/lib/dashboard-widgets.ts` — Add `net-worth-summary` and `asset-overview` widget definitions
- `src/lib/validations/dashboard.ts` — Add new widget IDs to enum
- `src/components/dashboard/widget-renderer.tsx` — Render new widgets
- `src/app/api/reports/net-worth/route.ts` — Updated formula including assets
- `src/app/api/dashboard/route.ts` — Add assets summary to dashboard data
- `src/app/(dashboard)/reports/page.tsx` — Enhanced net worth chart with asset breakdown

---

## Verification

1. Run `pnpm type-check` — no TypeScript errors
2. Run `pnpm lint` — no lint errors
3. Run `pnpm test` — all unit and integration tests pass including new asset tests
4. Run `pnpm test:e2e` — all E2E tests pass including new assets spec
5. Manual: Create a fixed asset (real estate), verify it appears in assets list
6. Manual: Add a valuation, verify chart updates on detail page
7. Manual: Dispose an asset, verify income transaction created in transactions list
8. Manual: Check net worth report reflects assets in the formula
9. Manual: Verify dashboard widgets show asset data
10. Manual: Test as Contributor role — can view but not create/edit/dispose assets
11. Manual: Test in both light and dark modes

---

## Decisions

- **Net Worth formula**: Assets (current_value, active) + Account Balances - Debts (outstanding_balance, active). Replaces the old income-minus-expense formula.
- **Disposal**: Auto-creates income transaction categorized under "Asset Sales" (seeded via migration). No user override of category.
- **Valuation tracking**: Manual updates only — no automatic depreciation schedules.
- **Classification constraint**: Asset type must match classification (e.g., 'real_estate' is only valid for 'fixed').
- **Permissions**: Admin-only for CRUD + dispose. Contributors can view.
- **Soft delete**: Same `is_active` pattern as accounts. Disposed assets have `is_active=false` + disposal metadata.
- **"Other" type**: Allowed for both fixed and current classifications.

## Further Considerations

1. **Historical net worth accuracy**: For months before valuation history exists, use purchase_price as the initial value. Assets created/disposed mid-month use the asset's creation/disposal date as the boundary — this may need refinement if users want retroactive net worth.
2. **Asset Sales category uniqueness**: The migration creates one "Asset Sales" category per household. If a user deletes this category, disposal will fail gracefully with an error message asking them to restore it. Consider making it undeletable.
3. **Bulk valuation updates**: Currently one-at-a-time. If users manage many investments, a bulk update UI could be added later but is out of scope for this plan.
