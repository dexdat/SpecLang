-- Migration 003: Cascade tracking table
-- Creates table for tracking cascade execution
-- Generated from specs/sqlite.spec.dir/migrations.spec.md
-- Source: @speclang/sqlite @ref:specs/sqlite#migrations

CREATE TABLE IF NOT EXISTS cascades (
  cascade_id TEXT PRIMARY KEY,
  depth INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  started_at INTEGER,
  converged_at INTEGER,
  root_trigger_file TEXT
);

-- Indexes for cascade queries
CREATE INDEX IF NOT EXISTS idx_cascades_status ON cascades(status);
CREATE INDEX IF NOT EXISTS idx_cascades_started_at ON cascades(started_at);
CREATE INDEX IF NOT EXISTS idx_cascades_root_trigger_file ON cascades(root_trigger_file);