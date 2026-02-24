/**
 * SPECLANG-GENERATED: MCP Lock Tools
 * Source: @speclang/mcp
 */

import { randomUUID } from 'crypto';
import type { SpecLangDB } from '../../db/index.js';
import type { LockInput, UnlockInput } from '../types.js';

/**
 * Lock tool handler
 */
export class LocksToolHandler {
  private db: SpecLangDB;
  
  constructor(db: SpecLangDB) {
    this.db = db;
  }
  
  /**
   * Handle speclang_lock - Acquire file lock
   */
  async handleLock(args: LockInput): Promise<{
    acquired: boolean;
    lock_id?: string;
    held_by?: string;
  }> {
    const { resource, agent_id, ttl = 60 } = args;
    
    const lockId = randomUUID();
    const expiresAt = Date.now() + (ttl * 1000);
    
    const db = this.db.getDatabase();
    
    try {
      // Try to acquire lock
      const result = db.prepare(`
        INSERT INTO locks (file_path, session_id, locked_at, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(resource, agent_id, Date.now(), expiresAt);
      
      if (result.changes > 0) {
        return { acquired: true, lock_id: lockId };
      }
      
      // Lock exists, check if it expired
      const existing = db.prepare(
        'SELECT * FROM locks WHERE file_path = ?'
      ).get(resource) as { session_id: string; expires_at: number } | undefined;
      
      if (existing && existing.expires_at < Date.now()) {
        // Lock expired, update it
        db.prepare(`
          UPDATE locks SET session_id = ?, locked_at = ?, expires_at = ?
          WHERE file_path = ?
        `).run(agent_id, Date.now(), expiresAt, resource);
        
        return { acquired: true, lock_id: lockId };
      }
      
      // Lock is held by someone else
      return { acquired: false, held_by: existing?.session_id };
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return { acquired: false, held_by: 'unknown' };
    }
  }
  
  /**
   * Handle speclang_unlock - Release file lock
   */
  async handleUnlock(args: UnlockInput): Promise<{
    released: boolean;
  }> {
    const { lock_id, agent_id } = args;
    
    const db = this.db.getDatabase();
    
    try {
      // Find the lock by token (we store agent_id as session_id)
      const lock = db.prepare(
        'SELECT * FROM locks WHERE session_id = ?'
      ).get(agent_id) as { file_path: string } | undefined;
      
      if (!lock) {
        return { released: false };
      }
      
      // Delete the lock
      const result = db.prepare(
        'DELETE FROM locks WHERE file_path = ? AND session_id = ?'
      ).run(lock.file_path, agent_id);
      
      return { released: result.changes > 0 };
    } catch (error) {
      console.error('Error releasing lock:', error);
      return { released: false };
    }
  }
  
  /**
   * Handle speclang_check_lock - Check if resource is locked
   */
  async handleCheckLock(args: { resource: string }): Promise<{
    locked: boolean;
    held_by?: string;
    expires_at?: number;
  }> {
    const { resource } = args;
    
    const db = this.db.getDatabase();
    
    const lock = db.prepare(
      'SELECT * FROM locks WHERE file_path = ?'
    ).get(resource) as { session_id: string; expires_at: number } | undefined;
    
    if (!lock) {
      return { locked: false };
    }
    
    // Check if expired
    if (lock.expires_at < Date.now()) {
      db.prepare('DELETE FROM locks WHERE file_path = ?').run(resource);
      return { locked: false };
    }
    
    return { 
      locked: true, 
      held_by: lock.session_id,
      expires_at: lock.expires_at
    };
  }
  
  /**
   * Handle speclang_force_unlock - Force unlock (admin only)
   */
  async handleForceUnlock(args: { resource: string }): Promise<{
    released: boolean;
  }> {
    const { resource } = args;
    
    const db = this.db.getDatabase();
    const result = db.prepare('DELETE FROM locks WHERE file_path = ?').run(resource);
    
    return { released: result.changes > 0 };
  }
}
