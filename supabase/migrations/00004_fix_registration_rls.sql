-- ============================================
-- Fix: Allow authenticated users to create households (registration flow)
-- and update their own user profile to link to a household
-- ============================================

-- Allow any authenticated user to create a household (needed during registration)
CREATE POLICY "Authenticated users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own profile (needed to link household_id after creation)
-- This may already exist but we use CREATE OR REPLACE pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update own profile to link household'
  ) THEN
    CREATE POLICY "Users can update own profile to link household"
      ON users FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Allow the seed_default_categories function to insert categories
-- when called during registration (user may not have household_id linked yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Authenticated users can seed categories'
  ) THEN
    CREATE POLICY "Authenticated users can seed categories"
      ON categories FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
