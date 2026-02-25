-- ============================================
-- FamFin Seed Data
-- Default categories function + test data
-- ============================================

-- Function to seed default categories for a household
CREATE OR REPLACE FUNCTION seed_default_categories(p_household_id UUID)
RETURNS VOID AS $$
DECLARE
  v_food_id UUID;
  v_dining_id UUID;
  v_housing_id UUID;
  v_transport_id UUID;
  v_healthcare_id UUID;
  v_children_id UUID;
  v_sports_id UUID;
  v_giving_id UUID;
  v_loans_id UUID;
BEGIN
  -- EXPENSE parent categories with sub-categories
  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Food & Groceries', 'expense', 1)
  RETURNING id INTO v_food_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Household Goods', v_food_id, 'expense', 1),
    (p_household_id, 'Fruit & Veg', v_food_id, 'expense', 2);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Dining', 'expense', 2)
  RETURNING id INTO v_dining_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Eating Out', v_dining_id, 'expense', 1);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Housing', 'expense', 3)
  RETURNING id INTO v_housing_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Rent', v_housing_id, 'expense', 1),
    (p_household_id, 'House Repairs', v_housing_id, 'expense', 2),
    (p_household_id, 'Hosting', v_housing_id, 'expense', 3);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Transport', 'expense', 4)
  RETURNING id INTO v_transport_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Fuel', v_transport_id, 'expense', 1),
    (p_household_id, 'Car Maintenance', v_transport_id, 'expense', 2);

  -- Standalone expense categories
  INSERT INTO categories (household_id, name, type, sort_order) VALUES
    (p_household_id, 'Utilities', 'expense', 5),
    (p_household_id, 'Entertainment', 'expense', 6);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Healthcare', 'expense', 7)
  RETURNING id INTO v_healthcare_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Medicine', v_healthcare_id, 'expense', 1);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Children', 'expense', 8)
  RETURNING id INTO v_children_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Child Care', v_children_id, 'expense', 1),
    (p_household_id, 'School Fees', v_children_id, 'expense', 2),
    (p_household_id, 'School Supplies', v_children_id, 'expense', 3);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Sports', 'expense', 9)
  RETURNING id INTO v_sports_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Sports Equipment', v_sports_id, 'expense', 1);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Giving', 'expense', 10)
  RETURNING id INTO v_giving_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'EBC Giving', v_giving_id, 'expense', 1);

  INSERT INTO categories (id, household_id, name, type, sort_order)
  VALUES (gen_random_uuid(), p_household_id, 'Loans', 'expense', 11)
  RETURNING id INTO v_loans_id;

  INSERT INTO categories (household_id, name, parent_id, type, sort_order) VALUES
    (p_household_id, 'Qona Loan Repayment', v_loans_id, 'expense', 1),
    (p_household_id, 'Stima Loan Repayment', v_loans_id, 'expense', 2),
    (p_household_id, 'Lending', v_loans_id, 'expense', 3);

  INSERT INTO categories (household_id, name, type, sort_order) VALUES
    (p_household_id, 'Investment', 'expense', 12);

  -- INCOME categories
  INSERT INTO categories (household_id, name, type, sort_order) VALUES
    (p_household_id, 'Salary', 'income', 1),
    (p_household_id, 'Side Income', 'income', 2),
    (p_household_id, 'Other Income', 'income', 3);

  -- BOTH type
  INSERT INTO categories (household_id, name, type, sort_order) VALUES
    (p_household_id, 'Other', 'both', 99);
END;
$$ LANGUAGE plpgsql;
