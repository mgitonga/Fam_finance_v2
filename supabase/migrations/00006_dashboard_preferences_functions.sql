-- Database functions for dashboard preferences
-- These bypass PostgREST schema cache issues with new columns

CREATE OR REPLACE FUNCTION get_dashboard_preferences(p_user_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT dashboard_preferences FROM public.users WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION set_dashboard_preferences(p_user_id UUID, p_preferences JSONB)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.users SET dashboard_preferences = p_preferences WHERE id = p_user_id;
$$;
