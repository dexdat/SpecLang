-- Migration 007: Command Queue Tables
-- Creates tables for command queue management

-- Commands table for cascade command queue
CREATE TABLE IF NOT EXISTS commands (
    command_id TEXT PRIMARY KEY,
    cascade_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_file TEXT,
    session_id TEXT,
    payload TEXT,
    priority INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
    error TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Indexes for command queries
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
CREATE INDEX IF NOT EXISTS idx_commands_cascade ON commands(cascade_id);
CREATE INDEX IF NOT EXISTS idx_commands_priority ON commands(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_commands_session ON commands(session_id);
CREATE INDEX IF NOT EXISTS idx_commands_updated ON commands(updated_at);
