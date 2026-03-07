-- Add dashboard_preferences JSONB column to users table
ALTER TABLE users
  ADD COLUMN dashboard_preferences JSONB DEFAULT NULL;

COMMENT ON COLUMN users.dashboard_preferences IS
  'User dashboard widget preferences: [{id, order, enabled}]. NULL = default layout.';
