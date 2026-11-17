-- Migration 003: Cascade tracking table
-- Creates table for tracking cascade execution
-- Generated from specs/sqlite.spec.dir/migrations.spec.md
-- Source: @speclang/sqlite @ref:specs/sqlite#migrations
--
-- Column set is the UNION of what the code actually reads and writes:
--   cascade_id, depth, status          (all consumers)
--   root_trigger, created_at           (specs/mcp.spec.dir/src/tools/cascade.ts)
--   started_at, converged_at           (specs/mcp.spec.dir/src/sse.ts, mcp server polling)
--   root_trigger_file                  (original spec-side DDL)

CREATE TABLE IF NOT EXISTS cascades (
  cascade_id TEXT PRIMARY KEY,
  depth INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  started_at INTEGER,
  created_at INTEGER,
  converged_at INTEGER,
  root_trigger TEXT,
  root_trigger_file TEXT
);

-- Indexes for cascade queries
CREATE INDEX IF NOT EXISTS idx_cascades_status ON cascades(status);
CREATE INDEX IF NOT EXISTS idx_cascades_started_at ON cascades(started_at);
CREATE INDEX IF NOT EXISTS idx_cascades_converged_at ON cascades(converged_at);
CREATE INDEX IF NOT EXISTS idx_cascades_root_trigger_file ON cascades(root_trigger_file);
