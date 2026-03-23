-- Migration: Add OAuth support to existing databases
-- Run this against your existing database if you are NOT starting fresh.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(20) NOT NULL DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_provider_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_provider_check CHECK (provider IN ('local', 'google', 'facebook'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_provider_id_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_provider_id_unique UNIQUE (provider, provider_id);
  END IF;
END$$;
