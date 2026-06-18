/**
 * SPECLANG-GENERATED: MCP Message Database
 * Source: @speclang/mcp/messages
 */

import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';

// ============================================================================
// SCHEMA INITIALIZATION
// ============================================================================

/**
 * Initialize the message database tables and indexes
 */
export function initMessageDB(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('ambiguity', 'incompleteness', 'validation_failure', 'question', 'suggestion')),
      priority TEXT NOT NULL CHECK (priority IN ('blocking', 'high', 'medium', 'low', 'informational')),

      source_agent TEXT NOT NULL,
      source_session_id TEXT NOT NULL,
      source_change_id TEXT,

      target_spec_id TEXT NOT NULL,
      target_file_path TEXT NOT NULL,
      target_line_start INTEGER,
      target_line_end INTEGER,

      title TEXT NOT NULL,
      description TEXT NOT NULL,
      suggested_fix TEXT,
      code_snippet TEXT,

      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('new', 'in_progress', 'resolved', 'dismissed')),
      resolved_by TEXT,
      resolved_at INTEGER,
      resolution_notes TEXT,

      cascade_id TEXT,
      parent_message_id TEXT,

      FOREIGN KEY (parent_message_id) REFERENCES messages(id)
    );

    CREATE TABLE IF NOT EXISTS message_responses (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      agent TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (message_id) REFERENCES messages(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
    CREATE INDEX IF NOT EXISTS idx_messages_spec ON messages(target_spec_id);
    CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_message_responses_message ON message_responses(message_id);
  `);
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new message
 */
export function createMessage(
  db: Database.Database,
  args: {
    type: string;
    priority: string;
    spec_id: string;
    file_path: string;
    title: string;
    description: string;
    suggested_fix?: string;
    code_snippet?: string;
    line_range?: [number, number];
    source_agent?: string;
    source_session_id?: string;
    source_change_id?: string;
    cascade_id?: string;
    parent_message_id?: string;
  }
): { message_id: string; created_at: number } {
  const messageId = randomUUID();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO messages (
      id, type, priority,
      source_agent, source_session_id, source_change_id,
      target_spec_id, target_file_path, target_line_start, target_line_end,
      title, description, suggested_fix, code_snippet,
      created_at, updated_at, status,
      cascade_id, parent_message_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    messageId,
    args.type,
    args.priority,
    args.source_agent ?? 'unknown',
    args.source_session_id ?? 'unknown',
    args.source_change_id ?? null,
    args.spec_id,
    args.file_path,
    args.line_range?.[0] ?? null,
    args.line_range?.[1] ?? null,
    args.title,
    args.description,
    args.suggested_fix ?? null,
    args.code_snippet ?? null,
    now,
    now,
    'new',
    args.cascade_id ?? null,
    args.parent_message_id ?? null
  );

  return { message_id: messageId, created_at: now };
}

/**
 * Query messages with optional filters and pagination
 */
export function queryMessages(
  db: Database.Database,
  args: {
    status?: string;
    priority?: string;
    type?: string;
    spec_id?: string;
    limit?: number;
    offset?: number;
  }
): { messages: Record<string, unknown>[]; total_count: number } {
  const { status, priority, type, spec_id, limit = 20, offset = 0 } = args;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (priority) {
    conditions.push('priority = ?');
    params.push(priority);
  }
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (spec_id) {
    conditions.push('target_spec_id = ?');
    params.push(spec_id);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM messages ${where}`).get(...params) as { count: number };

  const rows = db.prepare(`
    SELECT * FROM messages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as Record<string, unknown>[];

  return { messages: rows, total_count: countRow.count };
}

/**
 * Get a single message by ID with its responses
 */
export function getMessage(
  db: Database.Database,
  messageId: string
): Record<string, unknown> | null {
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId) as Record<string, unknown> | undefined;

  if (!message) return null;

  const responses = db.prepare(`
    SELECT * FROM message_responses WHERE message_id = ? ORDER BY created_at ASC
  `).all(messageId) as Record<string, unknown>[];

  return { ...message, responses };
}

/**
 * Update message status
 */
export function updateMessageStatus(
  db: Database.Database,
  args: {
    message_id: string;
    status: string;
    resolution_notes?: string;
  }
): { success: boolean; updated_at: number } {
  const now = Math.floor(Date.now() / 1000);
  const { message_id, status, resolution_notes } = args;

  const resolvedAt = status === 'resolved' || status === 'dismissed' ? now : null;

  const result = db.prepare(`
    UPDATE messages
    SET status = ?, updated_at = ?, resolved_at = COALESCE(?, resolved_at), resolution_notes = ?
    WHERE id = ?
  `).run(status, now, resolvedAt, resolution_notes ?? null, message_id);

  return { success: result.changes > 0, updated_at: now };
}

/**
 * Add a response to a message
 */
export function addMessageResponse(
  db: Database.Database,
  args: {
    message_id: string;
    content: string;
    agent: string;
  }
): { response_id: string; created_at: number } {
  const responseId = randomUUID();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO message_responses (id, message_id, agent, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(responseId, args.message_id, args.agent, args.content, now);

  return { response_id: responseId, created_at: now };
}
