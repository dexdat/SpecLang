-- Migration 002: Cascade support for events and commands
-- Adds cascade_id columns to link events and commands to cascades
-- Generated from specs/sqlite.spec.dir/migrations.spec.md
-- Source: @speclang/sqlite @ref:specs/sqlite#migrations

-- Note: cascade_id columns already added in initial schema (001_initial.sql)
-- This migration ensures they exist and adds indexes for performance.

-- Add cascade_id column to events table (if not already present)
-- SQLite doesn't support IF NOT EXISTS for ADD COLUMN, so we use a try-catch in application code.
-- For now, this migration is a no-op because columns already exist.

-- Add cascade_id column to commands table (if not already present)
-- Similarly, already exists.

-- Create indexes for cascade_id columns (if not already present)
CREATE INDEX IF NOT EXISTS idx_events_cascade_id ON events(cascade_id);
CREATE INDEX IF NOT EXISTS idx_commands_cascade_id ON commands(cascade_id);