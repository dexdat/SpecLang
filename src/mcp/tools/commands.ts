/**
 * SPECLANG-GENERATED: MCP Command Queue Tools
 * Source: @speclang/mcp
 */

import { randomUUID } from 'crypto';
import type { SpecLangDB } from '../../db/index.js';
import type { CommandInput, QueryCommandsInput, QueuedCommand, StatusResult } from '../types.js';

/**
 * Command queue tool handler
 */
export class CommandsToolHandler {
  private db: SpecLangDB;

  constructor(db: SpecLangDB) {
    this.db = db;
  }

  /**
   * Handle speclang_get_status - Get current cascade and queue status
   */
  async handleGetStatus(): Promise<StatusResult> {
    const db = this.db.getDatabase();

    const activeSessions = db.prepare(
      "SELECT COUNT(*) as count FROM sessions WHERE status IN ('active', 'idle')"
    ).get() as { count: number };

    const queueDepth = db.prepare(
      "SELECT COUNT(*) as count FROM commands WHERE status = 'pending'"
    ).get() as { count: number };

    const cascadeDepth = db.prepare(
      "SELECT MAX(depth) as max_depth FROM cascades WHERE status = 'cascading'"
    ).get() as { max_depth: number | null };

    const lastBuild = db.prepare(
      "SELECT MAX(created_at) as max_created FROM spec_versions"
    ).get() as { max_created: number | null };

    const unprocessedEvents = db.prepare(
      "SELECT COUNT(*) as count FROM events WHERE processed = 0"
    ).get() as { count: number };

    const converged =
      activeSessions.count === 0 &&
      queueDepth.count === 0 &&
      unprocessedEvents.count === 0;

    return {
      active_sessions: activeSessions.count,
      queue_depth: queueDepth.count,
      converged,
      cascade_depth: cascadeDepth.max_depth ?? null,
      last_build: lastBuild.max_created ?? null
    };
  }

  /**
   * Handle speclang_query_commands - Query commands from the queue
   */
  async handleQueryCommands(args: QueryCommandsInput): Promise<QueuedCommand[]> {
    const { status = 'pending', limit = 10, cascade_id, session_id } = args;
    const db = this.db.getDatabase();

    let sql = `
      SELECT
        command_id,
        cascade_id,
        action,
        target_file,
        session_id,
        payload,
        priority,
        status,
        created_at,
        updated_at
      FROM commands
      WHERE status = ?
    `;
    const params: (string | number)[] = [status];

    if (cascade_id) {
      sql += ' AND cascade_id = ?';
      params.push(cascade_id);
    }

    if (session_id) {
      sql += ' AND session_id = ?';
      params.push(session_id);
    }

    sql += ' ORDER BY priority DESC, created_at ASC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(sql).all(...params) as Array<{
      command_id: string;
      cascade_id: string;
      action: string;
      target_file: string | null;
      session_id: string | null;
      payload: string | null;
      priority: number;
      status: string;
      created_at: number;
      updated_at: number;
    }>;

    return rows.map((row) => ({
      command_id: row.command_id,
      cascade_id: row.cascade_id,
      action: row.action,
      target_file: row.target_file,
      session_id: row.session_id,
      payload: row.payload ? JSON.parse(row.payload) : null,
      priority: row.priority,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * Handle speclang_insert_command - Insert a command into the queue
   */
  async handleInsertCommand(args: CommandInput): Promise<{ command_id: string }> {
    const { cascade_id, action, target_file, session_id, payload, priority = 0 } = args;
    const db = this.db.getDatabase();

    const commandId = randomUUID();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO commands (
        command_id,
        cascade_id,
        action,
        target_file,
        session_id,
        payload,
        priority,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      commandId,
      cascade_id,
      action,
      target_file ?? null,
      session_id ?? null,
      payload ? JSON.stringify(payload) : null,
      priority,
      now,
      now
    );

    return { command_id: commandId };
  }

  /**
   * Handle speclang_update_command - Update command status
   */
  async handleUpdateCommand(args: {
    command_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
  }): Promise<{ updated: boolean }> {
    const { command_id, status, error } = args;
    const db = this.db.getDatabase();

    const now = Math.floor(Date.now() / 1000);

    const result = db.prepare(`
      UPDATE commands
      SET status = ?, error = ?, updated_at = ?
      WHERE command_id = ?
    `).run(status, error ?? null, now, command_id);

    return { updated: result.changes > 0 };
  }

  /**
   * Handle speclang_delete_command - Delete a command
   */
  async handleDeleteCommand(args: { command_id: string }): Promise<{ deleted: boolean }> {
    const { command_id } = args;
    const db = this.db.getDatabase();

    const result = db.prepare('DELETE FROM commands WHERE command_id = ?').run(command_id);

    return { deleted: result.changes > 0 };
  }

  /**
   * Handle speclang_get_next_command - Get next pending command
   */
  async handleGetNextCommand(): Promise<QueuedCommand | null> {
    const db = this.db.getDatabase();

    const row = db.prepare(`
      SELECT
        command_id,
        cascade_id,
        action,
        target_file,
        session_id,
        payload,
        priority,
        status,
        created_at,
        updated_at
      FROM commands
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `).get() as {
      command_id: string;
      cascade_id: string;
      action: string;
      target_file: string | null;
      session_id: string | null;
      payload: string | null;
      priority: number;
      status: string;
      created_at: number;
      updated_at: number;
    } | undefined;

    if (!row) return null;

    return {
      command_id: row.command_id,
      cascade_id: row.cascade_id,
      action: row.action,
      target_file: row.target_file,
      session_id: row.session_id,
      payload: row.payload ? JSON.parse(row.payload) : null,
      priority: row.priority,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Handle speclang_clear_completed - Clear completed/failed commands
   */
  async handleClearCompleted(args: { olderThan?: number }): Promise<{ cleared: number }> {
    const { olderThan = 0 } = args;
    const db = this.db.getDatabase();

    const cutoffTime = olderThan > 0 ? olderThan : Math.floor(Date.now() / 1000) - 86400000;

    const result = db.prepare(`
      DELETE FROM commands
      WHERE status IN ('completed', 'failed')
      AND updated_at < ?
    `).run(cutoffTime);

    return { cleared: result.changes };
  }

  /**
   * Handle speclang_batch_insert - Insert multiple commands
   */
  async handleBatchInsert(args: {
    commands: Array<{
      cascade_id: string;
      action: string;
      target_file?: string;
      priority?: number;
    }>;
  }): Promise<{ command_ids: string[] }> {
    const { commands } = args;
    const db = this.db.getDatabase();

    const now = Math.floor(Date.now() / 1000);
    const commandIds: string[] = [];

    const insert = db.prepare(`
      INSERT INTO commands (
        command_id,
        cascade_id,
        action,
        target_file,
        priority,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    const txn = db.transaction(() => {
      for (const cmd of commands) {
        const id = randomUUID();
        insert.run(
          id,
          cmd.cascade_id,
          cmd.action,
          cmd.target_file ?? null,
          cmd.priority ?? 0,
          now,
          now
        );
        commandIds.push(id);
      }
    });

    txn();

    return { command_ids: commandIds };
  }
}
