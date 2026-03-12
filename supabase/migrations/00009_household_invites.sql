-- ============================================
-- Household Invites: invite lifecycle tracking
-- Migration: 00009_household_invites
-- ============================================

-- ============================================
-- 1. HOUSEHOLD_INVITES TABLE
-- ============================================
CREATE TABLE household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'contributor'
    CHECK (role IN ('admin', 'contributor')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Only one pending invite per email per household
CREATE UNIQUE INDEX idx_invites_one_pending
  ON household_invites (household_id, email)
  WHERE status = 'pending';

CREATE INDEX idx_invites_household ON household_invites(household_id);
CREATE INDEX idx_invites_email ON household_invites(email);
CREATE INDEX idx_invites_status ON household_invites(household_id, status);

-- ============================================
-- 2. RLS POLICIES
-- ============================================
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

-- Members can view invites in their household
CREATE POLICY "Members can view household invites"
  ON household_invites FOR SELECT
  USING (household_id = public.get_household_id());

-- Admins can create invites
CREATE POLICY "Admins can create invites"
  ON household_invites FOR INSERT
  WITH CHECK (
    household_id = public.get_household_id()
    AND public.get_user_role() = 'admin'
  );

-- Admins can update invite status (cancel, expire, accept)
CREATE POLICY "Admins can update invites"
  ON household_invites FOR UPDATE
  USING (
    household_id = public.get_household_id()
    AND public.get_user_role() = 'admin'
  );

-- Admins can delete invites
CREATE POLICY "Admins can delete invites"
  ON household_invites FOR DELETE
  USING (
    household_id = public.get_household_id()
    AND public.get_user_role() = 'admin'
  );

-- ============================================
-- 3. ADMIN CAN REMOVE HOUSEHOLD MEMBERS
-- (update household_id to NULL)
-- ============================================
CREATE POLICY "Admins can remove household members"
  ON users FOR UPDATE
  USING (
    household_id = public.get_household_id()
    AND public.get_user_role() = 'admin'
  )
  WITH CHECK (true);

-- ============================================
-- 4. UPDATE handle_new_user() TRIGGER
-- to link invited users to their household
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, household_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'contributor'),
    (NEW.raw_user_meta_data->>'household_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
