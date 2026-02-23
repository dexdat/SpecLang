/**
 * Lock Client for agents
 * 
 * Generated from: @speclang/mcp.tools.locks
 * 
 * Provides a client interface for agents to acquire/release locks
 * with built-in deadlock prevention and retry logic.
 */

import * as crypto from 'crypto';
import { LockManager } from './locks';
import { DeadlockPreventer, DeadlockDetector, LockResult, DeadlockConfig } from './deadlock';
import { Lock, AgentId } from './types';

export interface LockClientConfig {
  agentId: AgentId;
  locksDir?: string;
  timeout?: number;
  deadlockConfig?: Partial<DeadlockConfig>;
}

export interface LockHandle {
  filePath: string;
  lock: Lock;
  release: () => Promise<boolean>;
}

export class LockClient {
  private lockManager: LockManager;
  private deadlockPreventer: DeadlockPreventer;
  private deadlockDetector: DeadlockDetector;
  private agentId: AgentId;
  private heldLocks: Map<string, LockHandle> = new Map();

  constructor(config: LockClientConfig) {
    this.agentId = config.agentId;
    this.lockManager = new LockManager(config.locksDir, config.timeout);
    this.deadlockPreventer = new DeadlockPreventer(
      this.lockManager,
      config.deadlockConfig
    );
    this.deadlockDetector = new DeadlockDetector(this.lockManager);
  }

  async initialize(): Promise<void> {
    await this.lockManager.initialize();
    this.deadlockDetector.start();
  }

  async acquireLock(filePath: string): Promise<LockHandle | null> {
    const result = await this.deadlockPreventer.acquireWithRetry(
      filePath,
      this.agentId
    );

    if (!result.success || !result.lock) {
      console.log(`[LockClient] Failed to acquire lock for ${filePath}: ${result.error}`);
      return null;
    }

    const handle: LockHandle = {
      filePath,
      lock: result.lock,
      release: async () => {
        return this.releaseLock(filePath);
      },
    };

    this.heldLocks.set(filePath, handle);
    return handle;
  }

  async acquireMultipleLocks(filePaths: string[]): Promise<Map<string, LockHandle | null>> {
    const results = new Map<string, LockHandle | null>();
    const deadlockResults = await this.deadlockPreventer.acquireMultiple(
      filePaths,
      this.agentId
    );

    for (const [filePath, result] of deadlockResults) {
      if (result.success && result.lock) {
        const handle: LockHandle = {
          filePath,
          lock: result.lock,
          release: async () => {
            return this.releaseLock(filePath);
          },
        };
        this.heldLocks.set(filePath, handle);
        results.set(filePath, handle);
      } else {
        results.set(filePath, null);
      }
    }

    return results;
  }

  async releaseLock(filePath: string): Promise<boolean> {
    const released = await this.lockManager.release(filePath, this.agentId);
    
    if (released) {
      this.heldLocks.delete(filePath);
    }

    return released;
  }

  async releaseAllLocks(): Promise<boolean> {
    const filePaths = Array.from(this.heldLocks.keys());
    const success = await this.deadlockPreventer.releaseMultiple(
      filePaths,
      this.agentId
    );
    
    this.heldLocks.clear();
    return success;
  }

  async isLocked(filePath: string): Promise<boolean> {
    return this.lockManager.isLocked(filePath);
  }

  async getLock(filePath: string): Promise<Lock | null> {
    return this.lockManager.getLock(filePath);
  }

  async getActiveLocks(): Promise<Lock[]> {
    return this.lockManager.getActiveLocks();
  }

  generateLockToken(): string {
    return crypto.randomUUID();
  }

  getHeldLocks(): LockHandle[] {
    return Array.from(this.heldLocks.values());
  }

  async cleanup(): Promise<void> {
    this.deadlockDetector.stop();
    await this.releaseAllLocks();
    await this.lockManager.cleanup();
  }

  getAgentId(): AgentId {
    return this.agentId;
  }

  onDeadlockDetected(callback: (locks: Lock[]) => void): void {
    this.deadlockDetector.onDeadlockDetected(callback);
  }
}

export function createLockClient(config: LockClientConfig): LockClient {
  return new LockClient(config);
}
