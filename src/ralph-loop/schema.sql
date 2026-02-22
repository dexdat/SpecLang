-- Generated from specs/implementation.spec.dir/ralph-loop-implementation.spec.md
-- DO NOT EDIT MANUALLY
-- Source: @speclang/implementation.ralph-loop

-- Ralph Loop SQL Schema
-- Tables for task management and steering packets

-- Task management table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Steering packets table for error reporting and fixes
CREATE TABLE IF NOT EXISTS steering_packets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'error_report', 'fix_suggestion', 'priority_change'
  payload TEXT NOT NULL, -- JSON
  created_at INTEGER NOT NULL,
  processed BOOLEAN DEFAULT 0,
  processed_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_steering_packets_task_id ON steering_packets(task_id);
CREATE INDEX IF NOT EXISTS idx_steering_packets_processed ON steering_packets(processed);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Example tasks for Ralph Loop testing
INSERT OR IGNORE INTO tasks (id, title, description, created_at, updated_at) VALUES
  ('task-001', 'Write SQLite schema implementation spec', 'Create layer 3+ implementation spec for SQLite schema', 1740038400, 1740038400),
  ('task-002', 'Write MCP server implementation spec', 'Create layer 3+ implementation spec for MCP server', 1740038400, 1740038400),
  ('task-003', 'Write Ralph Loop implementation spec', 'Create layer 3+ implementation spec for Ralph Loop system', 1740038400, 1740038400);
