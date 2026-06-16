-- Migration 004: Agent sessions table
-- Creates table for tracking agent sessions
-- Generated from specs/sqlite.spec.dir/migrations.spec.md
-- Source: @speclang/sqlite @ref:specs/sqlite#migrations

-- Note: sessions table already created in initial schema (001_initial.sql)
-- This migration adds additional indexes for performance.

CREATE INDEX IF NOT EXISTS idx_sessions_agent ON sessions(agent);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);