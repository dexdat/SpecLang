/**
 * Deadlock Prevention for LockManager
 * 
 * Generated from: @speclang/mcp.tools.locks
 * 
 * Strategies:
 * - All locks have expiration timeouts
 * - Clients implement retry with exponential backoff
 * - Lock ordering: acquire locks in alphabetical file path order
 * - Deadlock detection via timeout; release locks on timeout
 */

import { LockManager } from './locks';
import { Lock, AgentId } from './types';

export interface DeadlockConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  orderingEnabled: boolean;
}

export interface LockResult {
  success: boolean;
  lock?: Lock;
  error?: string;
  attempts: number;
}

export class DeadlockPreventer {
  private lockManager: LockManager;
  private config: DeadlockConfig;

  constructor(lockManager: LockManager, config?: Partial<DeadlockConfig>) {
    this.lockManager = lockManager;
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      baseDelayMs: config?.baseDelayMs ?? 100,
      maxDelayMs: config?.maxDelayMs ?? 5000,
      orderingEnabled: config?.orderingEnabled ?? true,
    };
  }

  async acquireWithRetry(
    filePath: string,
    agentId: AgentId,
    files?: string[]
  ): Promise<LockResult> {
    const sortedPaths = this.config.orderingEnabled
      ? this.sortFilePaths([filePath, ...(files ?? [])])
      : [filePath];

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      const lock = await this.lockManager.acquire(filePath, agentId);
      
      if (lock) {
        return { success: true, lock, attempts: attempt };
      }

      if (attempt < this.config.maxRetries) {
        const delay = this.calculateBackoff(attempt);
        console.log(`[DeadlockPreventer] Retry ${attempt}/${this.config.maxRetries} after ${delay}ms`);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: `Failed to acquire lock after ${this.config.maxRetries} attempts`,
      attempts: this.config.maxRetries,
    };
  }

  async acquireMultiple(
    filePaths: string[],
    agentId: AgentId
  ): Promise<Map<string, LockResult>> {
    const results = new Map<string, LockResult>();
    const sortedPaths = this.config.orderingEnabled
      ? this.sortFilePaths(filePaths)
      : filePaths;

    const acquiredLocks: Array<{ path: string; lock: Lock }> = [];

    for (const filePath of sortedPaths) {
      const result = await this.acquireWithRetry(filePath, agentId, sortedPaths);
      
      if (!result.success) {
        for (const acquired of acquiredLocks) {
          await this.lockManager.release(acquired.path, agentId);
        }
        results.set(filePath, result);
        return results;
      }

      if (result.lock) {
        acquiredLocks.push({ path: filePath, lock: result.lock });
      }
      results.set(filePath, result);
    }

    return results;
  }

  async releaseMultiple(filePaths: string[], agentId: AgentId): Promise<boolean> {
    let allSuccess = true;

    for (const filePath of filePaths) {
      const released = await this.lockManager.release(filePath, agentId);
      if (!released) {
        allSuccess = false;
      }
    }

    return allSuccess;
  }

  private sortFilePaths(filePaths: string[]): string[] {
    return [...filePaths].sort((a, b) => {
      const normalizedA = a.replace(/[\\/:]/g, '-');
      const normalizedB = b.replace(/[\\/:]/g, '-');
      return normalizedA.localeCompare(normalizedB);
    });
  }

  private calculateBackoff(attempt: number): number {
    const delay = this.config.baseDelayMs * Math.pow(2, attempt - 1);
    return Math.min(delay, this.config.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setConfig(config: Partial<DeadlockConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DeadlockConfig {
    return { ...this.config };
  }
}

export class DeadlockDetector {
  private lockManager: LockManager;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(locks: Lock[]) => void> = [];

  constructor(lockManager: LockManager) {
    this.lockManager = lockManager;
  }

  start(intervalMs: number = 5000): void {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(async () => {
      await this.checkAndNotify();
    }, intervalMs);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  onDeadlockDetected(callback: (locks: Lock[]) => void): void {
    this.listeners.push(callback);
  }

  private async checkAndNotify(): Promise<void> {
    const activeLocks = await this.lockManager.getActiveLocks();
    const now = Date.now();

    const expiredLocks = activeLocks.filter(lock => {
      const timeUntilExpiry = lock.expiresAt - now;
      return timeUntilExpiry < 0 || timeUntilExpiry < 5000;
    });

    if (expiredLocks.length > 0) {
      console.log(`[DeadlockDetector] Found ${expiredLocks.length} expired/stuck locks`);
      
      for (const lock of expiredLocks) {
        await this.lockManager.forceRelease(lock.file);
      }

      for (const listener of this.listeners) {
        listener(expiredLocks);
      }
    }
  }
}
