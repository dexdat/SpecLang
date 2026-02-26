-- Ralph Loop tables (extends existing schema)
-- Generated from specs/ralph-loop.spec.md
-- Source: @speclang/ralph-loop @ref:specs/ralph-loop#ralph/sqlite

-- Ralph Tasks table
CREATE TABLE IF NOT EXISTS ralph_tasks (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  depends_on TEXT,  -- JSON array
  estimated_complexity TEXT,
  priority INTEGER DEFAULT 5,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER,
  started_at INTEGER,
  completed_at INTEGER
);

-- Steering Packets table
CREATE TABLE IF NOT EXISTS steering_packets (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  type TEXT,
  content TEXT,  -- JSON
  created_at INTEGER,
  processed_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
);

-- Validation Results table
CREATE TABLE IF NOT EXISTS validation_results (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  stage TEXT,
  passed INTEGER,  -- Boolean as integer
  details TEXT,  -- JSON
  created_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ralph_tasks_status ON ralph_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ralph_tasks_priority ON ralph_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_steering_packets_task_id ON steering_packets(task_id);
CREATE INDEX IF NOT EXISTS idx_steering_packets_type ON steering_packets(type);
CREATE INDEX IF NOT EXISTS idx_validation_results_task_id ON validation_results(task_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_stage ON validation_results(stage);
