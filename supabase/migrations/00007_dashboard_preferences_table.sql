-- Create a dedicated dashboard_preferences table
-- (PostgREST picks up new tables immediately, unlike new columns on existing tables)

CREATE TABLE dashboard_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON dashboard_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON dashboard_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON dashboard_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own preferences"
  ON dashboard_preferences FOR DELETE
  USING (user_id = auth.uid());

-- Clean up: drop the column and functions from previous migrations
-- (they work at DB level but PostgREST schema cache won't see them)
ALTER TABLE users DROP COLUMN IF EXISTS dashboard_preferences;
DROP FUNCTION IF EXISTS get_dashboard_preferences(UUID);
DROP FUNCTION IF EXISTS set_dashboard_preferences(UUID, JSONB);
