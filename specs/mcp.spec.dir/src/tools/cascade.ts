/**
 * SPECLANG-GENERATED: MCP Cascade Tools
 * Source: @speclang/mcp
 */

import { randomUUID } from 'crypto';
import type { SpecLangDB } from '../../db/index.js';
import type { CascadeStatus, CascadeTriggerInput } from '../types.js';

/**
 * Cascade tool handler
 */
export class CascadeToolHandler {
  private db: SpecLangDB;
  
  constructor(db: SpecLangDB) {
    this.db = db;
  }
  
  /**
   * Handle speclang_cascade_status - Get cascade status
   */
  async handleCascadeStatus(): Promise<CascadeStatus> {
    const db = this.db.getDatabase();
    
    // Get active cascades
    const activeCascades = db.prepare(
      "SELECT * FROM cascades WHERE status = 'cascading'"
    ).all() as Array<{
      cascade_id: string;
      root_trigger: string;
      status: string;
      depth: number;
      created_at: number;
    }>;
    
    if (activeCascades.length === 0) {
      return { status: 'idle' };
    }
    
    // Get the most recent cascade
    const cascade = activeCascades[0];
    
    // Get files changed in this cascade
    const filesChanged = db.prepare(
      'SELECT DISTINCT path FROM events WHERE cascade_id = ?'
    ).all(cascade.cascade_id) as Array<{ path: string }>;
    
    // Get active agents
    const activeAgents = db.prepare(
      "SELECT id, agent FROM sessions WHERE status = 'active'"
    ).all() as Array<{ id: string; agent: string }>;
    
    const timeElapsed = Date.now() - cascade.created_at;
    
    return {
      status: 'cascading',
      depth: cascade.depth,
      files_changed: filesChanged.map(f => f.path),
      active_agents: activeAgents.map(a => a.agent),
      time_elapsed: timeElapsed
    };
  }
  
  /**
   * Handle speclang_cascade_trigger - Trigger a cascade
   */
  async handleCascadeTrigger(args: CascadeTriggerInput): Promise<{
    cascade_id: string;
    status: string;
  }> {
    const { spec_id, change_type } = args;
    
    const cascadeId = `cascade-${randomUUID()}`;
    const now = Date.now();
    
    const db = this.db.getDatabase();
    
    // Create cascade record
    db.prepare(`
      INSERT INTO cascades (cascade_id, root_trigger, status, depth, created_at)
      VALUES (?, ?, 'cascading', 0, ?)
    `).run(cascadeId, spec_id, Math.floor(now / 1000));
    
    // Create initial event
    db.prepare(`
      INSERT INTO events (timestamp, kind, path, cascade_id)
      VALUES (?, ?, ?, ?)
    `).run(Math.floor(now / 1000), change_type, spec_id, cascadeId);
    
    // Find dependents and create commands
    const dependents = this.findDependents(spec_id);
    
    for (const dep of dependents) {
      db.prepare(`
        INSERT INTO commands (id, cascade_id, action, target, status, created_at)
        VALUES (?, ?, 'reindex', ?, 'pending', ?)
      `).run(randomUUID(), cascadeId, dep, Math.floor(now / 1000));
    }
    
    return {
      cascade_id: cascadeId,
      status: 'cascading'
    };
  }
  
  /**
   * Handle speclang_cascade_abort - Abort a cascade
   */
  async handleCascadeAbort(): Promise<{
    aborted: boolean;
    rolled_back: string[];
  }> {
    const db = this.db.getDatabase();
    
    // Get active cascades
    const activeCascades = db.prepare(
      "SELECT * FROM cascades WHERE status = 'cascading'"
    ).all() as Array<{ cascade_id: string }>;
    
    if (activeCascades.length === 0) {
      return { aborted: false, rolled_back: [] };
    }
    
    const rolledBack: string[] = [];
    
    for (const cascade of activeCascades) {
      // Get files that were changed
      const files = db.prepare(
        'SELECT path FROM events WHERE cascade_id = ?'
      ).all(cascade.cascade_id) as Array<{ path: string }>;
      
      // Mark cascade as aborted
      db.prepare(
        "UPDATE cascades SET status = 'aborted' WHERE cascade_id = ?"
      ).run(cascade.cascade_id);
      
      // Cancel pending commands
      db.prepare(
        "UPDATE commands SET status = 'cancelled' WHERE cascade_id = ? AND status = 'pending'"
      ).run(cascade.cascade_id);
      
      rolledBack.push(...files.map(f => f.path));
    }
    
    return { aborted: true, rolled_back: rolledBack };
  }
  
  /**
   * Find dependent specs
   */
  private findDependents(specId: string): string[] {
    const db = this.db.getDatabase();
    
    const rows = db.prepare(`
      SELECT DISTINCT s.file_path
      FROM specs s
      JOIN spec_deps sd ON s.rowid = sd.src_spec_pk
      JOIN specs target ON sd.dst_spec_pk = target.rowid
      WHERE target.id = ? OR target.file_path = ?
    `).all(specId, specId) as Array<{ file_path: string }>;
    
    return rows.map(r => r.file_path);
  }
  
  /**
   * Handle speclang_cascade_converge - Mark cascade as converged
   */
  async handleCascadeConverge(args: { cascade_id: string }): Promise<{
    converged: boolean;
    files_changed: string[];
    duration: number;
  }> {
    const { cascade_id } = args;
    
    const db = this.db.getDatabase();
    
    const cascade = db.prepare(
      'SELECT * FROM cascades WHERE cascade_id = ?'
    ).get(cascade_id) as { created_at: number } | undefined;
    
    if (!cascade) {
      return { converged: false, files_changed: [], duration: 0 };
    }
    
    // Get files changed
    const files = db.prepare(
      'SELECT path FROM events WHERE cascade_id = ?'
    ).all(cascade_id) as Array<{ path: string }>;
    
    // Mark as converged
    db.prepare(
      "UPDATE cascades SET status = 'converged', converged_at = ? WHERE cascade_id = ?"
    ).run(Math.floor(Date.now() / 1000), cascade_id);
    
    const duration = Date.now() - (cascade.created_at * 1000);
    
    return {
      converged: true,
      files_changed: files.map(f => f.path),
      duration
    };
  }
}
