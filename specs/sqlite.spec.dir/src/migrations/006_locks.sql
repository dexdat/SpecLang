-- Migration 006: File locks table
-- Creates table for file locking mechanism
-- Generated from specs/sqlite.spec.dir/migrations.spec.md
-- Source: @speclang/sqlite @ref:specs/sqlite#migrations

-- Note: locks table already created in initial schema (001_initial.sql)
-- This migration adds additional indexes for performance.

CREATE INDEX IF NOT EXISTS idx_locks_session_id ON locks(session_id);
CREATE INDEX IF NOT EXISTS idx_locks_expires_at ON locks(expires_at);