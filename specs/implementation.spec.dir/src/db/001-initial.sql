CREATE TABLE specs (
  file_path TEXT PRIMARY KEY,
  id TEXT,
  parent_id TEXT,
  children TEXT,           -- JSON array
  owner_session TEXT,
  depends_on TEXT,         -- JSON array
  tags TEXT,               -- JSON array
  short_desc TEXT,
  header_raw TEXT,
  content_raw TEXT,
  content_embedding BLOB, -- optional; NULL if embedding generation fails
  parsed_json TEXT,
  part INTEGER DEFAULT 1,
  total_parts INTEGER DEFAULT 1,
  last_edited INTEGER,
  git_commit TEXT
);

CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  agent TEXT,
  status TEXT,
  current_file TEXT,
  created INTEGER,
  last_active INTEGER
);

CREATE TABLE events (
  event_pk INTEGER PRIMARY KEY,
  cascade_id TEXT,
  depth INTEGER,
  trigger_file TEXT,
  agent TEXT,
  output_files TEXT, -- JSON array
  timestamp INTEGER,
  processed BOOLEAN DEFAULT 0,
  claimed_by TEXT
);

CREATE TABLE commands (
  command_id TEXT PRIMARY KEY,
  cascade_id TEXT,
  action TEXT,
  target_file TEXT,
  session_id TEXT,
  payload TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT,
  created_at INTEGER
);

CREATE TABLE cascades (
  cascade_id TEXT PRIMARY KEY,
  depth INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  started_at INTEGER,
  converged_at INTEGER,
  root_trigger_file TEXT
);

CREATE TABLE file_locks (
  file_path TEXT PRIMARY KEY,
  session_id TEXT,
  lock_token TEXT,
  acquired_at INTEGER DEFAULT (strftime('%s','now')),
  expires_at INTEGER
);

CREATE TABLE recovery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER,
  operation TEXT,
  state TEXT,             -- JSON
  recovered BOOLEAN DEFAULT 0
);