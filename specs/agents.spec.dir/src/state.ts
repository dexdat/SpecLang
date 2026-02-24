/**
 * State persistence for agents
 * 
 * Generated from: @speclang/agent-protocol
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { AgentState, AgentRole, Task } from './types';

/**
 * State Manager - persists agent state to disk
 */
export class StateManager {
  private stateDir: string;

  constructor(stateDir?: string) {
    this.stateDir = stateDir || path.join(os.homedir(), '.speclang', 'sessions');
  }

  /**
   * Ensure state directory exists
   */
  private async ensureDir(): Promise<void> {
    await fs.ensureDir(this.stateDir);
  }

  /**
   * Get path for session state file
   */
  private getStatePath(sessionId: string): string {
    return path.join(this.stateDir, `${sessionId}.json`);
  }

  /**
   * Save agent state
   */
  async save(sessionId: string, state: AgentState): Promise<void> {
    await this.ensureDir();
    
    const statePath = this.getStatePath(sessionId);
    const data = {
      ...state,
      last_updated: Date.now(),
    };
    
    await fs.writeJson(statePath, data, { spaces: 2 });
    console.log(`[StateManager] Saved state for ${sessionId}`);
  }

  /**
   * Load agent state
   */
  async load(sessionId: string): Promise<AgentState | null> {
    const statePath = this.getStatePath(sessionId);
    
    try {
      const data = await fs.readJson(statePath);
      return data as AgentState;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      console.error(`[StateManager] Error loading state for ${sessionId}:`, error.message);
      return null;
    }
  }

  /**
   * List all persisted session IDs
   */
  async list(): Promise<string[]> {
    await this.ensureDir();
    
    try {
      const files = await fs.readdir(this.stateDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete persisted state
   */
  async delete(sessionId: string): Promise<void> {
    const statePath = this.getStatePath(sessionId);
    
    try {
      await fs.remove(statePath);
      console.log(`[StateManager] Deleted state for ${sessionId}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`[StateManager] Error deleting state for ${sessionId}:`, error.message);
      }
    }
  }

  /**
   * Garbage collect old sessions
   */
  async gc(maxAgeMs: number): Promise<number> {
    const sessions = await this.list();
    let deleted = 0;
    const now = Date.now();

    for (const sessionId of sessions) {
      const state = await this.load(sessionId);
      if (state && (now - state.last_updated) > maxAgeMs) {
        await this.delete(sessionId);
        deleted++;
      }
    }

    console.log(`[StateManager] GC: deleted ${deleted} old sessions`);
    return deleted;
  }

  /**
   * Check if session state exists
   */
  async exists(sessionId: string): Promise<boolean> {
    const statePath = this.getStatePath(sessionId);
    return fs.pathExists(statePath);
  }

  /**
   * Get state file info
   */
  async getInfo(sessionId: string): Promise<{ created: Date; modified: Date; size: number } | null> {
    const statePath = this.getStatePath(sessionId);
    
    try {
      const stat = await fs.stat(statePath);
      return {
        created: stat.birthtime,
        modified: stat.mtime,
        size: stat.size,
      };
    } catch (error) {
      return null;
    }
  }
}

/**
 * Convert session to persistable state
 */
export function sessionToState(
  sessionId: string,
  agentRole: AgentRole,
  workingOn: string | null,
  pendingTasks: Task[],
  completedTasks: Task[],
  errors: Error[]
): AgentState {
  return {
    session_id: sessionId,
    agent_role: agentRole,
    working_on: workingOn,
    pending_tasks: pendingTasks,
    completed_tasks: completedTasks.slice(-50), // Keep last 50
    errors: errors.slice(-20), // Keep last 20
    last_updated: Date.now(),
  };
}

/**
 * Create a new state manager
 */
export function createStateManager(stateDir?: string): StateManager {
  return new StateManager(stateDir);
}
