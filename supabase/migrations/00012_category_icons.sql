-- ============================================
-- Migration: 00012_category_icons
-- Adds Lucide icon names to all categories
-- and updates seed function with new categories
-- ============================================

-- 1. Update existing categories with icons (only where icon is NULL)
UPDATE categories SET icon = 'shopping-cart'       WHERE name = 'Food & Groceries'        AND icon IS NULL;
UPDATE categories SET icon = 'package'             WHERE name = 'Household Goods'          AND icon IS NULL;
UPDATE categories SET icon = 'apple'               WHERE name = 'Fruit & Veg'              AND icon IS NULL;
UPDATE categories SET icon = 'utensils'            WHERE name = 'Dining'                   AND icon IS NULL;
UPDATE categories SET icon = 'truck'               WHERE name = 'Order In'                 AND icon IS NULL;
UPDATE categories SET icon = 'chef-hat'            WHERE name = 'Eating Out'               AND icon IS NULL;
UPDATE categories SET icon = 'users'               WHERE name = 'Hosting'                  AND icon IS NULL;
UPDATE categories SET icon = 'home'                WHERE name = 'Housing'                  AND icon IS NULL;
UPDATE categories SET icon = 'key-round'           WHERE name = 'Rent'                     AND icon IS NULL;
UPDATE categories SET icon = 'hammer'              WHERE name = 'House Repairs'             AND icon IS NULL;
UPDATE categories SET icon = 'car'                 WHERE name = 'Transport'                AND icon IS NULL;
UPDATE categories SET icon = 'bus'                 WHERE name = 'Matatu Fare'              AND icon IS NULL;
UPDATE categories SET icon = 'car-taxi-front'      WHERE name = 'Taxi Hailing'             AND icon IS NULL;
UPDATE categories SET icon = 'fuel'                WHERE name = 'Fuel'                     AND icon IS NULL;
UPDATE categories SET icon = 'wrench'              WHERE name = 'Car Maintenance'          AND icon IS NULL;
UPDATE categories SET icon = 'zap'                 WHERE name = 'Utilities & Subscriptions' AND icon IS NULL;
UPDATE categories SET icon = 'zap'                 WHERE name = 'Utilities'                AND icon IS NULL;
UPDATE categories SET icon = 'droplets'            WHERE name = 'Water'                    AND icon IS NULL;
UPDATE categories SET icon = 'plug-zap'            WHERE name = 'Electricity'              AND icon IS NULL;
UPDATE categories SET icon = 'wifi'                WHERE name = 'Broadband Internet'       AND icon IS NULL;
UPDATE categories SET icon = 'film'                WHERE name = 'Entertainment'            AND icon IS NULL;
UPDATE categories SET icon = 'heart-pulse'         WHERE name = 'Healthcare'               AND icon IS NULL;
UPDATE categories SET icon = 'pill'                WHERE name = 'Medicine'                 AND icon IS NULL;
UPDATE categories SET icon = 'baby'                WHERE name = 'Children'                 AND icon IS NULL;
UPDATE categories SET icon = 'piggy-bank'          WHERE name = 'Stipend / Pocket Money'   AND icon IS NULL;
UPDATE categories SET icon = 'hand-heart'          WHERE name = 'Child Care'               AND icon IS NULL;
UPDATE categories SET icon = 'graduation-cap'      WHERE name = 'School Fees'              AND icon IS NULL;
UPDATE categories SET icon = 'book-open'           WHERE name = 'School Supplies'          AND icon IS NULL;
UPDATE categories SET icon = 'dumbbell'            WHERE name = 'Sports'                   AND icon IS NULL;
UPDATE categories SET icon = 'trophy'              WHERE name = 'Sports Equipment'         AND icon IS NULL;
UPDATE categories SET icon = 'gift'                WHERE name = 'Giving'                   AND icon IS NULL;
UPDATE categories SET icon = 'church'              WHERE name = 'EBC Giving'               AND icon IS NULL;
UPDATE categories SET icon = 'landmark'            WHERE name = 'Loans'                    AND icon IS NULL;
UPDATE categories SET icon = 'banknote'            WHERE name = 'Qona Loan Repayment'      AND icon IS NULL;
UPDATE categories SET icon = 'receipt'             WHERE name = 'Stima Loan Repayment'     AND icon IS NULL;
UPDATE categories SET icon = 'hand-coins'          WHERE name = 'Lending'                  AND icon IS NULL;
UPDATE categories SET icon = 'trending-up'         WHERE name = 'Investment'               AND icon IS NULL;
UPDATE categories SET icon = 'file-text'           WHERE name = 'Treasury Bills'           AND icon IS NULL;
UPDATE categories SET icon = 'briefcase'           WHERE name = 'Salary'                   AND icon IS NULL;
UPDATE categories SET icon = 'coins'               WHERE name = 'Side Income'              AND icon IS NULL;
UPDATE categories SET icon = 'circle-dollar-sign'  WHERE name = 'Dividends'                AND icon IS NULL;
UPDATE categories SET icon = 'building'            WHERE name = 'RS 4 Rental Income'       AND icon IS NULL;
UPDATE categories SET icon = 'percent'             WHERE name = 'Interest Earned'          AND icon IS NULL;
UPDATE categories SET icon = 'wallet'              WHERE name = 'Other Income'             AND icon IS NULL;
UPDATE categories SET icon = 'circle-dot'          WHERE name = 'Other'                    AND icon IS NULL;

-- 2. Replace seed function with updated version (new categories + icons)
CREATE OR REPLACE FUNCTION seed_default_categories(p_household_id UUID)
RETURNS VOID AS $$
DECLARE
  v_food_id UUID;
  v_dining_id UUID;
  v_housing_id UUID;
  v_transport_id UUID;
  v_utilities_id UUID;
  v_healthcare_id UUID;
  v_children_id UUID;
  v_sports_id UUID;
  v_giving_id UUID;
  v_loans_id UUID;
  v_investment_id UUID;
  v_side_income_id UUID;
BEGIN
  -- ========== EXPENSE parent categories with sub-categories ==========

  -- Food & Groceries
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Food & Groceries', 'shopping-cart', 'expense', 1)
  RETURNING id INTO v_food_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Household Goods', 'package', v_food_id, 'expense', 1),
    (p_household_id, 'Fruit & Veg', 'apple', v_food_id, 'expense', 2);

  -- Dining
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Dining', 'utensils', 'expense', 2)
  RETURNING id INTO v_dining_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Order In', 'truck', v_dining_id, 'expense', 0),
    (p_household_id, 'Eating Out', 'chef-hat', v_dining_id, 'expense', 1),
    (p_household_id, 'Hosting', 'users', v_dining_id, 'expense', 3);

  -- Housing
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Housing', 'home', 'expense', 3)
  RETURNING id INTO v_housing_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Rent', 'key-round', v_housing_id, 'expense', 1),
    (p_household_id, 'House Repairs', 'hammer', v_housing_id, 'expense', 2);

  -- Transport
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Transport', 'car', 'expense', 4)
  RETURNING id INTO v_transport_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Matatu Fare', 'bus', v_transport_id, 'expense', 0),
    (p_household_id, 'Taxi Hailing', 'car-taxi-front', v_transport_id, 'expense', 0),
    (p_household_id, 'Fuel', 'fuel', v_transport_id, 'expense', 1),
    (p_household_id, 'Car Maintenance', 'wrench', v_transport_id, 'expense', 2);

  -- Utilities & Subscriptions
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Utilities & Subscriptions', 'zap', 'expense', 5)
  RETURNING id INTO v_utilities_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Water', 'droplets', v_utilities_id, 'expense', 0),
    (p_household_id, 'Electricity', 'plug-zap', v_utilities_id, 'expense', 0),
    (p_household_id, 'Broadband Internet', 'wifi', v_utilities_id, 'expense', 0);

  -- Entertainment (standalone)
  INSERT INTO categories (household_id, name, icon, type, sort_order) VALUES
    (p_household_id, 'Entertainment', 'film', 'expense', 6);

  -- Healthcare
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Healthcare', 'heart-pulse', 'expense', 7)
  RETURNING id INTO v_healthcare_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Medicine', 'pill', v_healthcare_id, 'expense', 1);

  -- Children
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Children', 'baby', 'expense', 8)
  RETURNING id INTO v_children_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Stipend / Pocket Money', 'piggy-bank', v_children_id, 'expense', 0),
    (p_household_id, 'Child Care', 'hand-heart', v_children_id, 'expense', 1),
    (p_household_id, 'School Fees', 'graduation-cap', v_children_id, 'expense', 2),
    (p_household_id, 'School Supplies', 'book-open', v_children_id, 'expense', 3);

  -- Sports
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Sports', 'dumbbell', 'expense', 9)
  RETURNING id INTO v_sports_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Sports Equipment', 'trophy', v_sports_id, 'expense', 1);

  -- Giving
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Giving', 'gift', 'expense', 10)
  RETURNING id INTO v_giving_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'EBC Giving', 'church', v_giving_id, 'expense', 1);

  -- Loans
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Loans', 'landmark', 'expense', 11)
  RETURNING id INTO v_loans_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Qona Loan Repayment', 'banknote', v_loans_id, 'expense', 1),
    (p_household_id, 'Stima Loan Repayment', 'receipt', v_loans_id, 'expense', 2),
    (p_household_id, 'Lending', 'hand-coins', v_loans_id, 'expense', 3);

  -- Investment
  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Investment', 'trending-up', 'expense', 12)
  RETURNING id INTO v_investment_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Treasury Bills', 'file-text', v_investment_id, 'expense', 0);

  -- ========== INCOME categories ==========

  INSERT INTO categories (household_id, name, icon, type, sort_order) VALUES
    (p_household_id, 'Salary', 'briefcase', 'income', 1);

  INSERT INTO categories (id, household_id, name, icon, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Side Income', 'coins', 'income', 2)
  RETURNING id INTO v_side_income_id;

  INSERT INTO categories (household_id, name, icon, parent_id, type, sort_order) VALUES
    (p_household_id, 'Dividends', 'circle-dollar-sign', v_side_income_id, 'income', 0),
    (p_household_id, 'RS 4 Rental Income', 'building', v_side_income_id, 'income', 0),
    (p_household_id, 'Interest Earned', 'percent', v_side_income_id, 'income', 0);

  INSERT INTO categories (household_id, name, icon, type, sort_order) VALUES
    (p_household_id, 'Other Income', 'wallet', 'income', 3);

  -- ========== BOTH type ==========

  INSERT INTO categories (household_id, name, icon, type, sort_order) VALUES
    (p_household_id, 'Other', 'circle-dot', 'both', 99);
END;
$$ LANGUAGE plpgsql;
