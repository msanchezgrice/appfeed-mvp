-- Extend user_app_state with opened/update timestamps for app home views and notifications

ALTER TABLE user_app_state
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_update_at TIMESTAMPTZ;

-- Backfill last_update_at from updated_at for existing rows
UPDATE user_app_state
SET last_update_at = updated_at
WHERE last_update_at IS NULL;

