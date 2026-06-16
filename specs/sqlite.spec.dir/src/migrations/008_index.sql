-- Migration 008: Search index tables
-- Creates virtual tables for full-text and vector search
-- Generated from specs/sqlite.spec.dir/migrations.spec.md
-- Source: @speclang/sqlite @ref:specs/sqlite#migrations

-- Note: specs_fts virtual table already created in initial schema (001_initial.sql)
-- This migration adds vector search table (optional) and additional indexes.

-- Vector search virtual table (requires sqlite-vss extension)
-- CREATE VIRTUAL TABLE IF NOT EXISTS specs_vec USING vss0(
--   content_embedding(1536)
-- );

-- Additional indexes for search performance
CREATE INDEX IF NOT EXISTS idx_specs_depends_on ON specs(depends_on);
CREATE INDEX IF NOT EXISTS idx_specs_refs ON specs(refs);
CREATE INDEX IF NOT EXISTS idx_commands_target ON commands(target);
CREATE INDEX IF NOT EXISTS idx_events_path ON events(path);