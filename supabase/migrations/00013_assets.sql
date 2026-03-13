-- ============================================================
-- Migration: Asset Management
-- Creates assets and asset_valuations tables, RLS policies,
-- triggers, indexes, and seeds "Asset Sales" income category.
-- ============================================================

-- 1. Create assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  classification TEXT NOT NULL CHECK (classification IN ('fixed', 'current')),
  type TEXT NOT NULL CHECK (type IN (
    'real_estate', 'vehicle', 'furniture_equipment', 'land',
    'investment', 'money_market', 'cash_equivalent', 'inventory', 'other'
  )),
  purchase_price NUMERIC NOT NULL CHECK (purchase_price >= 0),
  current_value NUMERIC NOT NULL CHECK (current_value >= 0),
  purchase_date DATE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  disposed_at TIMESTAMPTZ,
  disposal_amount NUMERIC CHECK (disposal_amount IS NULL OR disposal_amount >= 0),
  disposal_transaction_id UUID REFERENCES public.transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create asset_valuations table
CREATE TABLE public.asset_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL CHECK (value >= 0),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_assets_household ON public.assets(household_id);
CREATE INDEX idx_assets_household_classification ON public.assets(household_id, classification);
CREATE INDEX idx_assets_household_active ON public.assets(household_id, is_active);
CREATE INDEX idx_asset_valuations_asset_date ON public.asset_valuations(asset_id, date);

-- 4. Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_valuations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for assets
CREATE POLICY "Users can view own household assets"
  ON public.assets FOR SELECT
  USING (household_id = public.get_household_id(auth.uid()));

CREATE POLICY "Admins can insert assets"
  ON public.assets FOR INSERT
  WITH CHECK (
    household_id = public.get_household_id(auth.uid())
    AND public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update assets"
  ON public.assets FOR UPDATE
  USING (
    household_id = public.get_household_id(auth.uid())
    AND public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete assets"
  ON public.assets FOR DELETE
  USING (
    household_id = public.get_household_id(auth.uid())
    AND public.get_user_role(auth.uid()) = 'admin'
  );

-- 6. RLS Policies for asset_valuations
CREATE POLICY "Users can view own household asset valuations"
  ON public.asset_valuations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_valuations.asset_id
        AND assets.household_id = public.get_household_id(auth.uid())
    )
  );

CREATE POLICY "Admins can insert asset valuations"
  ON public.asset_valuations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_valuations.asset_id
        AND assets.household_id = public.get_household_id(auth.uid())
        AND public.get_user_role(auth.uid()) = 'admin'
    )
  );

CREATE POLICY "Admins can update asset valuations"
  ON public.asset_valuations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_valuations.asset_id
        AND assets.household_id = public.get_household_id(auth.uid())
        AND public.get_user_role(auth.uid()) = 'admin'
    )
  );

CREATE POLICY "Admins can delete asset valuations"
  ON public.asset_valuations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.assets
      WHERE assets.id = asset_valuations.asset_id
        AND assets.household_id = public.get_household_id(auth.uid())
        AND public.get_user_role(auth.uid()) = 'admin'
    )
  );

-- 7. Trigger: auto-update updated_at on assets
CREATE TRIGGER set_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. Trigger: auto-insert initial valuation when asset is created
CREATE OR REPLACE FUNCTION public.handle_new_asset_valuation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.asset_valuations (asset_id, value, date)
  VALUES (NEW.id, NEW.purchase_price, NEW.purchase_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_initial_asset_valuation
  AFTER INSERT ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_asset_valuation();

-- 9. Add "Asset Sales" to the seed_default_categories function
-- We insert directly for existing households and update the seed function
CREATE OR REPLACE FUNCTION public.seed_asset_sales_category()
RETURNS void AS $$
BEGIN
  -- Add Asset Sales category to all existing households that don't have it
  INSERT INTO public.categories (household_id, name, type, icon, color, sort_order)
  SELECT h.id, 'Asset Sales', 'income', 'landmark', '#10b981', 99
  FROM public.households h
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.household_id = h.id
      AND c.name = 'Asset Sales'
      AND c.type = 'income'
  );
END;
$$ LANGUAGE plpgsql;

-- Run immediately to seed existing households
SELECT public.seed_asset_sales_category();

-- Update the seed_default_categories function to include Asset Sales for new households
-- We add it by inserting after the function runs via a wrapper approach:
-- Actually, we modify the trigger so new households also get it.
-- The simplest approach: add Asset Sales to the existing seed function body.
-- Since we can't easily ALTER the function body, we create a trigger on households
-- that adds the Asset Sales category.

CREATE OR REPLACE FUNCTION public.handle_new_household_asset_category()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (household_id, name, type, icon, color, sort_order)
  VALUES (NEW.id, 'Asset Sales', 'income', 'landmark', '#10b981', 99);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER seed_asset_sales_on_household
  AFTER INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_household_asset_category();
