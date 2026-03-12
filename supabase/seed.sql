-- ============================================
-- FamFin Seed Data
-- Default categories function + test data
-- Synced with production DB 2026-03-12
-- ============================================

-- Function to seed default categories for a household
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
