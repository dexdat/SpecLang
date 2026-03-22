-- Initial database schema for SpecLang
-- Generated from specs/sqlite.spec.dir/migrations.spec.md
-- Source: @speclang/sqlite @ref:specs/sqlite#migrations

-- Schema version tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);

-- Specs table - stores all spec files
CREATE TABLE IF NOT EXISTS specs (
  file_path TEXT PRIMARY KEY,
  id TEXT,
  parent_id TEXT,
  children TEXT DEFAULT '[]',           -- JSON array
  owner_session TEXT,
  depends_on TEXT DEFAULT '[]',        -- JSON array
  refs TEXT DEFAULT '[]',              -- JSON array of outgoing @ref links
  tags TEXT DEFAULT '[]',              -- JSON array
  short_desc TEXT,
  header_raw TEXT DEFAULT '',
  header_lines INTEGER DEFAULT 0,
  content_raw TEXT DEFAULT '',
  content_embedding BLOB,              -- optional vector embedding
  parsed_json TEXT,                    -- parsed YAML as JSON
  part INTEGER DEFAULT 1,
  total_parts INTEGER DEFAULT 1,
  last_edited INTEGER,
  git_commit TEXT
);

-- Indexes for specs table
CREATE INDEX IF NOT EXISTS idx_specs_id ON specs(id);
CREATE INDEX IF NOT EXISTS idx_specs_parent_id ON specs(parent_id);
CREATE INDEX IF NOT EXISTS idx_specs_owner_session ON specs(owner_session);
CREATE INDEX IF NOT EXISTS idx_specs_last_edited ON specs(last_edited);
CREATE INDEX IF NOT EXISTS idx_specs_tags ON specs(tags);

-- Sessions table - active agent sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  owns TEXT DEFAULT '[]',              -- JSON array of owned file paths
  status TEXT DEFAULT 'active',
  last_active INTEGER NOT NULL
);

-- Events table - file system events
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  kind TEXT NOT NULL,
  path TEXT,
  session TEXT,
  cascade_id TEXT,                     -- optional, links events to a cascade
  details TEXT                         -- JSON details
);

-- Indexes for events table
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session);
CREATE INDEX IF NOT EXISTS idx_events_cascade_id ON events(cascade_id);

-- Commands table - agent commands queue
CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  cascade_id TEXT,                     -- optional, links commands to a cascade
  action TEXT NOT NULL,
  target TEXT,
  payload TEXT,                       -- JSON payload
  status TEXT DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

-- Indexes for commands table
CREATE INDEX IF NOT EXISTS idx_commands_session_id ON commands(session_id);
CREATE INDEX IF NOT EXISTS idx_commands_cascade_id ON commands(cascade_id);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);

-- Locks table - file locks for agent ownership
CREATE TABLE IF NOT EXISTS locks (
  file_path TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  locked_at INTEGER NOT NULL,
  expires_at INTEGER
);

-- Recovery table - system recovery state
CREATE TABLE IF NOT EXISTS recovery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  operation TEXT NOT NULL,
  state TEXT NOT NULL,                -- JSON state
  recovered INTEGER DEFAULT 0
);

-- Full-text search virtual table for specs
CREATE VIRTUAL TABLE IF NOT EXISTS specs_fts USING fts5(
  file_path,
  id,
  short_desc,
  header_raw,
  content_raw,
  content='specs',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync with specs table
CREATE TRIGGER IF NOT EXISTS specs_ai AFTER INSERT ON specs BEGIN
  INSERT INTO specs_fts(rowid, file_path, id, short_desc, header_raw, content_raw)
  VALUES (NEW.rowid, NEW.file_path, NEW.id, NEW.short_desc, NEW.header_raw, NEW.content_raw);
END;

CREATE TRIGGER IF NOT EXISTS specs_ad AFTER DELETE ON specs BEGIN
  INSERT INTO specs_fts(specs_fts, rowid, file_path, id, short_desc, header_raw, content_raw)
  VALUES ('delete', OLD.rowid, OLD.file_path, OLD.id, OLD.short_desc, OLD.header_raw, OLD.content_raw);
END;

CREATE TRIGGER IF NOT EXISTS specs_au AFTER UPDATE ON specs BEGIN
  INSERT INTO specs_fts(specs_fts, rowid, file_path, id, short_desc, header_raw, content_raw)
  VALUES ('delete', OLD.rowid, OLD.file_path, OLD.id, OLD.short_desc, OLD.header_raw, OLD.content_raw);
  INSERT INTO specs_fts(rowid, file_path, id, short_desc, header_raw, content_raw)
  VALUES (NEW.rowid, NEW.file_path, NEW.id, NEW.short_desc, NEW.header_raw, NEW.content_raw);
END;