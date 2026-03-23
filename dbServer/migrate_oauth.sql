-- Migration: Add OAuth support to existing databases
-- Run this against your existing database if you are NOT starting fresh.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_oauth'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_id);
  END IF;
END$$;
