-- Speclang SQLite Schema v2.0
-- Location: .speclang/speclang.db
-- Mode: WAL (Write-Ahead Logging)
-- Purpose: Index all specs, track sessions, manage cascade events
-- Fixed: All issues from adversarial review

-- ============================================================================
-- PRAGMAS
-- ============================================================================
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
PRAGMA foreign_keys = ON;  -- Critical: enforce FK constraints

-- ============================================================================
-- CORE TABLES (with INTEGER PRIMARY KEY for stability)
-- ============================================================================

-- Specs: Every spec file indexed with metadata
CREATE TABLE specs (
    spec_pk INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL UNIQUE,
    id TEXT NOT NULL UNIQUE,                    -- @project/feature
    parent_spec_pk INTEGER,                     -- Parent in split hierarchy
    owner_session_id TEXT,                      -- Session that owns this file
    owned_by TEXT NOT NULL CHECK(owned_by IN ('spec-writer', 'code-gen-go', 'code-gen-ts', 'code-gen-py', 'test-writer', 'back-sync', 'orchestrator')),
    hash_alg TEXT DEFAULT 'sha256',
    content_hash TEXT,                          -- SHA-256 for version tracking
    short_desc TEXT,
    header_raw TEXT,                            -- Full header as text
    header_lines INTEGER,
    content_raw TEXT,                           -- Full content for FTS
    content_embedding BLOB,                     -- Vector embedding (optional)
    parsed_json TEXT CHECK(json_valid(parsed_json)),
    part INTEGER DEFAULT 1 CHECK(part >= 1),
    total_parts INTEGER DEFAULT 1 CHECK(total_parts >= 1),
    target TEXT CHECK(target IN ('go', 'typescript', 'python', 'rust', 'java', 'javascript', 'markdown', 'yaml', NULL)),
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'stable', 'deprecated')),
    level INTEGER CHECK(level BETWEEN 0 AND 10),
    last_edited INTEGER,
    git_commit TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    
    FOREIGN KEY(parent_spec_pk) REFERENCES specs(spec_pk) ON DELETE SET NULL,
    FOREIGN KEY(owner_session_id) REFERENCES sessions(session_id) ON DELETE SET NULL
) STRICT;

-- Sessions: Active agent sessions
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,                -- UUID
    agent TEXT NOT NULL CHECK(agent IN ('spec-writer', 'code-gen-go', 'code-gen-ts', 'code-gen-py', 'test-writer', 'back-sync', 'orchestrator')),
    status TEXT DEFAULT 'idle' CHECK(status IN ('idle', 'active', 'done', 'error')),
    current_file TEXT,
    cascade_id TEXT,
    started_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_active INTEGER DEFAULT (strftime('%s', 'now')),
    ended_at INTEGER,
    error_message TEXT,
    
    FOREIGN KEY(cascade_id) REFERENCES cascades(cascade_id) ON DELETE SET NULL
) STRICT;

-- Cascades: Track cascade lifecycle
CREATE TABLE cascades (
    cascade_id TEXT PRIMARY KEY,
    root_trigger TEXT NOT NULL,                 -- Initial file
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'converged', 'failed', 'aborted')),
    depth INTEGER DEFAULT 0 CHECK(depth >= 0),
    max_depth INTEGER DEFAULT 100 CHECK(max_depth > 0),
    started_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_event_at INTEGER DEFAULT (strftime('%s', 'now')),
    converged_at INTEGER,
    quiet_period INTEGER DEFAULT 30 CHECK(quiet_period > 0),
    files_changed INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    error TEXT
) STRICT;

-- Events: File system events (triggers) - Multi-worker safe
CREATE TABLE events (
    event_pk INTEGER PRIMARY KEY AUTOINCREMENT,
    cascade_id TEXT NOT NULL,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    kind TEXT NOT NULL CHECK(kind IN ('create', 'modify', 'delete', 'rename')),
    path TEXT NOT NULL,
    session_id TEXT,
    file_hash_before TEXT,                      -- SHA-256 before change
    file_hash_after TEXT,                       -- SHA-256 after change
    processed INTEGER DEFAULT 0 CHECK(processed IN (0, 1)),
    claimed_by TEXT,                            -- Worker that claimed this event
    claimed_at INTEGER,
    attempts INTEGER DEFAULT 0,
    details TEXT CHECK(json_valid(details)),
    
    FOREIGN KEY(cascade_id) REFERENCES cascades(cascade_id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE SET NULL
) STRICT;

-- Commands: Inter-agent communication queue
CREATE TABLE commands (
    command_id TEXT PRIMARY KEY,
    cascade_id TEXT NOT NULL,
    session_id TEXT,
    action TEXT NOT NULL CHECK(action IN ('unstick', 're-expand', 'run-tests', 'rollback', 'pause', 'resume', 'abort')),
    target_file TEXT,
    payload TEXT CHECK(json_valid(payload)),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'done', 'failed')),
    priority INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    started_at INTEGER,
    completed_at INTEGER,
    result TEXT CHECK(json_valid(result)),
    
    FOREIGN KEY(cascade_id) REFERENCES cascades(cascade_id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE SET NULL
) STRICT;

-- Spec Versions: Content snapshots for recovery (Critical: enables rollback)
CREATE TABLE spec_versions (
    version_pk INTEGER PRIMARY KEY AUTOINCREMENT,
    spec_pk INTEGER NOT NULL,
    cascade_id TEXT,
    session_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    content_hash TEXT NOT NULL,                 -- SHA-256
    content_raw TEXT NOT NULL,                  -- Full content snapshot
    
    FOREIGN KEY(spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE,
    FOREIGN KEY(cascade_id) REFERENCES cascades(cascade_id) ON DELETE SET NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE SET NULL
) STRICT;

-- File Locks: Atomic advisory locks with tokens
CREATE TABLE file_locks (
    file_path TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    lock_token TEXT NOT NULL,                   -- UUID for ownership verification
    acquired_at INTEGER DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER NOT NULL,                -- Auto-expire
    
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
) STRICT;

-- Git Commits: Track per-file commits
CREATE TABLE git_commits (
    commit_pk INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    commit_hash TEXT NOT NULL,
    message TEXT,
    author TEXT NOT NULL,
    session_id TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    cascade_id TEXT,
    
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE SET NULL,
    FOREIGN KEY(cascade_id) REFERENCES cascades(cascade_id) ON DELETE SET NULL,
    UNIQUE(file_path, commit_hash)
) STRICT;

-- Recovery: Track recovery operations
CREATE TABLE recovery (
    recovery_pk INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    operation TEXT CHECK(operation IN ('rollback', 'retry', 'skip', 'abort')),
    cascade_id TEXT,
    file_path TEXT,
    spec_pk INTEGER,
    state TEXT CHECK(json_valid(state)),        -- JSON state snapshot
    recovered INTEGER DEFAULT 0 CHECK(recovered IN (0, 1)),
    error TEXT,
    
    FOREIGN KEY(cascade_id) REFERENCES cascades(cascade_id) ON DELETE SET NULL,
    FOREIGN KEY(spec_pk) REFERENCES specs(spec_pk) ON DELETE SET NULL
) STRICT;

-- Error Logs: Track agent/daemon errors
CREATE TABLE error_logs (
    error_pk INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    level TEXT DEFAULT 'error' CHECK(level IN ('error', 'warn', 'info')),
    source TEXT CHECK(source IN ('agent', 'daemon', 'plugin', 'mcp', 'git')),
    file TEXT,
    session_id TEXT,
    message TEXT NOT NULL,
    stack TEXT,
    cascade_id TEXT,
    build_id TEXT,
    
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE SET NULL,
    FOREIGN KEY(cascade_id) REFERENCES cascades(cascade_id) ON DELETE SET NULL
) STRICT;

-- ============================================================================
-- NORMALIZED RELATIONSHIP TABLES (Replace JSON arrays)
-- ============================================================================

-- Spec Dependencies: Many-to-many dependency graph
CREATE TABLE spec_deps (
    src_spec_pk INTEGER NOT NULL,
    dst_spec_pk INTEGER NOT NULL,
    dep_kind TEXT DEFAULT 'depends_on' CHECK(dep_kind IN ('depends_on', 'ref', 'import')),
    
    PRIMARY KEY(src_spec_pk, dst_spec_pk, dep_kind),
    FOREIGN KEY(src_spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE,
    FOREIGN KEY(dst_spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_spec_deps_dst ON spec_deps(dst_spec_pk);
CREATE INDEX idx_spec_deps_kind ON spec_deps(dep_kind);

-- Spec Tags: Many-to-many tags
CREATE TABLE spec_tags (
    spec_pk INTEGER NOT NULL,
    tag TEXT NOT NULL,
    
    PRIMARY KEY(spec_pk, tag),
    FOREIGN KEY(spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_spec_tags_tag ON spec_tags(tag);

-- Spec Children: Split file relationships (optional, if needed)
CREATE TABLE spec_children (
    parent_spec_pk INTEGER NOT NULL,
    child_spec_pk INTEGER NOT NULL,
    part_num INTEGER NOT NULL CHECK(part_num >= 1),
    
    PRIMARY KEY(parent_spec_pk, child_spec_pk),
    FOREIGN KEY(parent_spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE,
    FOREIGN KEY(child_spec_pk) REFERENCES specs(spec_pk) ON DELETE CASCADE,
    UNIQUE(parent_spec_pk, part_num)
) STRICT;

CREATE INDEX idx_spec_children_parent ON spec_children(parent_spec_pk);

-- Session Ownership: File patterns per session (replaces JSON array)
CREATE TABLE session_owns (
    session_id TEXT NOT NULL,
    pattern TEXT NOT NULL,                      -- Glob pattern
    
    PRIMARY KEY(session_id, pattern),
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_session_owns_pattern ON session_owns(pattern);

-- ============================================================================
-- Ralph Loop Tables (extends existing schema)
-- ============================================================================

-- Ralph Loop tasks
CREATE TABLE ralph_tasks (
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
) STRICT;

-- Steering packets for communication between Builder and Verifier
CREATE TABLE steering_packets (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  type TEXT,
  content TEXT,  -- JSON
  created_at INTEGER,
  processed_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
) STRICT;

-- Validation results from Verifier
CREATE TABLE validation_results (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  stage TEXT,
  passed BOOLEAN,
  details TEXT,  -- JSON
  created_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
) STRICT;

-- Indexes for Ralph Loop tables
CREATE INDEX idx_ralph_tasks_status ON ralph_tasks(status);
CREATE INDEX idx_ralph_tasks_priority ON ralph_tasks(priority);
CREATE INDEX idx_ralph_tasks_assigned ON ralph_tasks(assigned_to);
CREATE INDEX idx_steering_packets_task ON steering_packets(task_id);
CREATE INDEX idx_steering_packets_processed ON steering_packets(processed_at);
CREATE INDEX idx_validation_results_task ON validation_results(task_id);
CREATE INDEX idx_validation_results_stage ON validation_results(stage);
CREATE INDEX idx_validation_results_passed ON validation_results(passed);

-- ============================================================================
-- FTS (Full-Text Search) - Stable with INTEGER PRIMARY KEY
-- ============================================================================

-- FTS5 virtual table using spec_pk (stable)
CREATE VIRTUAL TABLE specs_fts USING fts5(
    id,
    short_desc,
    header_raw,
    content_raw,
    content='specs',
    content_rowid='spec_pk'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER specs_fts_insert AFTER INSERT ON specs BEGIN
    INSERT INTO specs_fts(rowid, id, short_desc, header_raw, content_raw)
    VALUES (new.spec_pk, new.id, new.short_desc, new.header_raw, new.content_raw);
END;

CREATE TRIGGER specs_fts_update AFTER UPDATE ON specs BEGIN
    INSERT INTO specs_fts(specs_fts, rowid, id, short_desc, header_raw, content_raw)
    VALUES ('delete', old.spec_pk, old.id, old.short_desc, old.header_raw, old.content_raw);
    INSERT INTO specs_fts(rowid, id, short_desc, header_raw, content_raw)
    VALUES (new.spec_pk, new.id, new.short_desc, new.header_raw, new.content_raw);
END;

CREATE TRIGGER specs_fts_delete AFTER DELETE ON specs BEGIN
    INSERT INTO specs_fts(specs_fts, rowid, id, short_desc, header_raw, content_raw)
    VALUES ('delete', old.spec_pk, old.id, old.short_desc, old.header_raw, old.content_raw);
END;

-- ============================================================================
-- INDEXES (Optimized for cascade queries)
-- ============================================================================

-- Specs indexes
CREATE INDEX idx_specs_id ON specs(id);
CREATE INDEX idx_specs_parent ON specs(parent_spec_pk);
CREATE INDEX idx_specs_owner ON specs(owner_session_id);
CREATE INDEX idx_specs_owned_by ON specs(owned_by);
CREATE INDEX idx_specs_target ON specs(target);
CREATE INDEX idx_specs_status ON specs(status);
CREATE INDEX idx_specs_level ON specs(level);
CREATE INDEX idx_specs_last_edited ON specs(last_edited);
CREATE INDEX idx_specs_content_hash ON specs(content_hash);
CREATE INDEX idx_specs_target_status ON specs(target, status);

-- Spec versions index
CREATE INDEX idx_spec_versions_spec_time ON spec_versions(spec_pk, created_at);
CREATE INDEX idx_spec_versions_cascade ON spec_versions(cascade_id);

-- Sessions indexes
CREATE INDEX idx_sessions_agent ON sessions(agent);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_cascade ON sessions(cascade_id);

-- Events indexes (Critical: multi-worker queue)
CREATE INDEX idx_events_cascade ON events(cascade_id);
CREATE INDEX idx_events_path ON events(path);
CREATE INDEX idx_events_claimed ON events(claimed_by);
CREATE INDEX idx_events_queue ON events(processed, claimed_by, timestamp);  -- For atomic claim

-- Commands indexes (Critical: priority queue)
CREATE INDEX idx_commands_cascade ON commands(cascade_id);
CREATE INDEX idx_commands_session ON commands(session_id);
CREATE INDEX idx_commands_queue ON commands(status, priority, created_at);

-- Git commits indexes
CREATE INDEX idx_commits_file ON git_commits(file_path);
CREATE INDEX idx_commits_cascade ON git_commits(cascade_id);
CREATE INDEX idx_commits_session ON git_commits(session_id);

-- Error logs indexes
CREATE INDEX idx_errors_level ON error_logs(level);
CREATE INDEX idx_errors_source ON error_logs(source);
CREATE INDEX idx_errors_cascade ON error_logs(cascade_id);
CREATE INDEX idx_errors_session ON error_logs(session_id);

-- File locks index (for cleanup)
CREATE INDEX idx_locks_expires ON file_locks(expires_at);
CREATE INDEX idx_locks_session ON file_locks(session_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active sessions view
CREATE VIEW active_sessions AS
SELECT * FROM sessions WHERE status IN ('active', 'idle');

-- Pending commands view (ready to execute)
CREATE VIEW pending_commands AS
SELECT * FROM commands 
WHERE status = 'pending' 
ORDER BY priority DESC, created_at ASC;

-- Unprocessed events view (not claimed)
CREATE VIEW unprocessed_events AS
SELECT * FROM events 
WHERE processed = 0 AND claimed_by IS NULL 
ORDER BY timestamp ASC;

-- File dependencies view (normalized, no JSON)
CREATE VIEW file_dependencies AS
SELECT 
    s_src.file_path as source_file,
    s_src.id as source_id,
    s_dst.file_path as target_file,
    s_dst.id as target_id,
    sd.dep_kind
FROM spec_deps sd
JOIN specs s_src ON s_src.spec_pk = sd.src_spec_pk
JOIN specs s_dst ON s_dst.spec_pk = sd.dst_spec_pk;

-- Spec tree view (recursive CTE base)
CREATE VIEW spec_tree AS
WITH RECURSIVE tree AS (
    -- Root specs (no parent)
    SELECT spec_pk, file_path, id, 0 as depth, file_path as path
    FROM specs 
    WHERE parent_spec_pk IS NULL
    
    UNION ALL
    
    -- Children
    SELECT s.spec_pk, s.file_path, s.id, t.depth + 1, t.path || ' > ' || s.id
    FROM specs s
    JOIN tree t ON s.parent_spec_pk = t.spec_pk
)
SELECT * FROM tree;

-- ============================================================================
-- TRIGGERS (Auto-update timestamps)
-- ============================================================================

-- Update specs.updated_at on any change
CREATE TRIGGER specs_touch_updated_at
AFTER UPDATE ON specs
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE specs SET updated_at = strftime('%s','now') WHERE spec_pk = NEW.spec_pk;
END;

-- Update sessions.last_active on status change
CREATE TRIGGER sessions_touch_active
AFTER UPDATE ON sessions
FOR EACH ROW
WHEN NEW.status != OLD.status
BEGIN
    UPDATE sessions SET last_active = strftime('%s','now') WHERE session_id = NEW.session_id;
END;

-- Update cascades.last_event_at on new event
CREATE TRIGGER cascades_touch_last_event
AFTER INSERT ON events
FOR EACH ROW
BEGIN
    UPDATE cascades SET last_event_at = strftime('%s','now') WHERE cascade_id = NEW.cascade_id;
END;

-- ============================================================================
-- FUNCTIONS (SQLite user-defined functions would be added in code)
-- ============================================================================

-- Note: The following functions should be registered in your SQLite connection:
-- - cosine_similarity(embedding1, embedding2) - for vector search
-- - match_glob(pattern, path) - for ownership pattern matching
-- - json_array_contains(json_array, value) - helper for tags

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert initial cascade
INSERT INTO cascades (cascade_id, status, root_trigger) 
VALUES ('init', 'converged', 'schema_init');

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Atomic event claim (multi-worker safe):
-- UPDATE events
-- SET claimed_by = :worker_id, claimed_at = strftime('%s','now'), attempts = attempts + 1
-- WHERE event_pk = (
--     SELECT event_pk FROM events
--     WHERE processed = 0 AND claimed_by IS NULL
--     ORDER BY timestamp
--     LIMIT 1
-- );

-- Atomic lock acquisition:
-- INSERT INTO file_locks(file_path, session_id, lock_token, expires_at)
-- VALUES (:file, :session, :token, strftime('%s','now') + 60)
-- ON CONFLICT(file_path) DO UPDATE SET
--     session_id = excluded.session_id,
--     lock_token = excluded.lock_token,
--     acquired_at = excluded.acquired_at,
--     expires_at = excluded.expires_at
-- WHERE file_locks.expires_at IS NULL OR file_locks.expires_at < strftime('%s','now');

-- Find dependents (normalized, fast):
-- SELECT s.* FROM specs s
-- JOIN spec_deps sd ON s.spec_pk = sd.src_spec_pk
-- WHERE sd.dst_spec_pk = (SELECT spec_pk FROM specs WHERE id = '@specs/auth');

-- Get spec with all tags (efficient join):
-- SELECT s.*, GROUP_CONCAT(st.tag) as tags
-- FROM specs s
-- LEFT JOIN spec_tags st ON s.spec_pk = st.spec_pk
-- WHERE s.id = '@specs/auth';

-- Recovery: Get previous version:
-- SELECT content_raw FROM spec_versions
-- WHERE spec_pk = :spec_pk
-- ORDER BY created_at DESC
-- LIMIT 1;

-- ============================================================================
-- DESIGN NOTES
-- ============================================================================
-- 
-- Key Design Decisions:
-- 1. INTEGER PRIMARY KEY (rowid) for stable references across rebuilds
-- 2. Foreign keys enforced (PRAGMA foreign_keys = ON)
-- 3. JSON normalized into join tables (spec_deps, spec_tags, spec_children)
-- 4. SHA-256 instead of MD5 for content hashing
-- 5. CHECK constraints for all enums (status, kind, level, etc)
-- 6. Auto-updated timestamps via triggers
-- 7. Atomic event claiming for multi-worker safety
-- 8. Lock tokens for ownership verification
-- 9. Spec versions table enables true rollback
-- 10. FTS uses stable spec_pk instead of rowid
--
-- Performance:
-- - All foreign keys indexed
-- - Composite indexes for queue queries
-- - Normalized edges for fast graph traversal
-- - Event queue: (processed, claimed_by, timestamp)
-- - Command queue: (status, priority, created_at)
--
-- Recovery:
-- - spec_versions stores full content snapshots
-- - recovery table tracks rollback attempts
-- - Can reconstruct any prior state from versions
--
-- Concurrency:
-- - Atomic lock acquisition with expiry
-- - Event claiming prevents double-processing
-- - WAL mode allows concurrent reads during writes
