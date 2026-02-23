/**
 * Lock Manager for speclangd
 * 
 * Generated from: @speclang/daemon/architecture
 * 
 * Prevents concurrent write conflicts between agents
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { Lock, AgentId, FileEvent } from './types';

export class LockManager {
  private locksDir: string;
  private timeout: number;
  private locks: Map<string, Lock>;

  constructor(locksDir: string = '.speclang/locks', timeout: number = 30) {
    this.locksDir = locksDir;
    this.timeout = timeout;
    this.locks = new Map();
  }

  async initialize(): Promise<void> {
    await fs.ensureDir(this.locksDir);
  }

  private lockPath(filePath: string): string {
    const normalized = filePath.replace(/[\\/:]/g, '-').replace(/^-/, '');
    return path.join(this.locksDir, `${normalized}.lock`);
  }

  async acquire(filePath: string, agentId: AgentId): Promise<Lock | null> {
    const lockPath = this.lockPath(filePath);
    const now = Date.now();

    try {
      if (await fs.pathExists(lockPath)) {
        const content = await fs.readFile(lockPath, 'utf-8');
        const existingLock: Lock = JSON.parse(content);

        if (!this.isExpired(existingLock)) {
          console.log(`[LockManager] Lock held by ${existingLock.agentId}`);
          return null;
        }

        console.log(`[LockManager] Forcing expired lock from ${existingLock.agentId}`);
      }

      const fileContent = await this.getFileHash(filePath);
      const newLock: Lock = {
        agentId,
        file: filePath,
        acquiredAt: now,
        expiresAt: now + this.timeout * 1000,
        contentHash: fileContent,
      };

      await fs.writeFile(lockPath, JSON.stringify(newLock, null, 2));
      this.locks.set(filePath, newLock);

      console.log(`[LockManager] Acquired lock for ${filePath} by ${agentId}`);
      return newLock;
    } catch (error) {
      console.error(`[LockManager] Failed to acquire lock:`, error);
      return null;
    }
  }

  async release(filePath: string, agentId: AgentId): Promise<boolean> {
    const lockPath = this.lockPath(filePath);

    try {
      if (!(await fs.pathExists(lockPath))) {
        console.warn(`[LockManager] Lock not found for ${filePath}`);
        return false;
      }

      const content = await fs.readFile(lockPath, 'utf-8');
      const lock: Lock = JSON.parse(content);

      if (lock.agentId !== agentId) {
        console.error(`[LockManager] Cannot release lock owned by ${lock.agentId}`);
        return false;
      }

      await fs.remove(lockPath);
      this.locks.delete(filePath);

      console.log(`[LockManager] Released lock for ${filePath}`);
      return true;
    } catch (error) {
      console.error(`[LockManager] Failed to release lock:`, error);
      return false;
    }
  }

  async forceRelease(filePath: string): Promise<boolean> {
    const lockPath = this.lockPath(filePath);

    try {
      if (await fs.pathExists(lockPath)) {
        await fs.remove(lockPath);
        this.locks.delete(filePath);
        console.log(`[LockManager] Force released lock for ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[LockManager] Failed to force release:`, error);
      return false;
    }
  }

  async isLocked(filePath: string): Promise<boolean> {
    const lockPath = this.lockPath(filePath);

    try {
      if (!(await fs.pathExists(lockPath))) {
        return false;
      }

      const content = await fs.readFile(lockPath, 'utf-8');
      const lock: Lock = JSON.parse(content);

      if (this.isExpired(lock)) {
        await fs.remove(lockPath);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async getLock(filePath: string): Promise<Lock | null> {
    const lockPath = this.lockPath(filePath);

    try {
      if (!(await fs.pathExists(lockPath))) {
        return null;
      }

      const content = await fs.readFile(lockPath, 'utf-8');
      const lock: Lock = JSON.parse(content);

      if (this.isExpired(lock)) {
        await fs.remove(lockPath);
        return null;
      }

      return lock;
    } catch {
      return null;
    }
  }

  private isExpired(lock: Lock): boolean {
    return Date.now() > lock.expiresAt;
  }

  private async getFileHash(filePath: string): Promise<string | undefined> {
    try {
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath);
        return crypto.createHash('md5').update(content).digest('hex');
      }
    } catch {
      // File doesn't exist or can't be read
    }
    return undefined;
  }

  async getActiveLocks(): Promise<Lock[]> {
    const locks: Lock[] = [];

    try {
      const files = await fs.readdir(this.locksDir);
      
      for (const file of files) {
        if (file.endsWith('.lock')) {
          const lockPath = path.join(this.locksDir, file);
          const content = await fs.readFile(lockPath, 'utf-8');
          const lock: Lock = JSON.parse(content);

          if (!this.isExpired(lock)) {
            locks.push(lock);
          } else {
            await fs.remove(lockPath);
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return locks;
  }

  async cleanup(): Promise<void> {
    const locks = await this.getActiveLocks();
    
    for (const lock of locks) {
      await this.forceRelease(lock.file);
    }
  }

  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  getTimeout(): number {
    return this.timeout;
  }

  async claimEvent(workerId: AgentId): Promise<FileEvent | null> {
    const eventsDir = path.join(this.locksDir, 'events');
    await fs.ensureDir(eventsDir);

    try {
      const files = await fs.readdir(eventsDir);
      const pendingFiles = files.filter(f => f.endsWith('.event'));

      for (const file of pendingFiles.sort()) {
        const eventPath = path.join(eventsDir, file);
        const content = await fs.readFile(eventPath, 'utf-8');
        const event: FileEvent & { claimedBy?: string } = JSON.parse(content);

        if (event.claimedBy) {
          continue;
        }

        event.claimedBy = workerId;
        await fs.writeFile(eventPath, JSON.stringify(event, null, 2));

        console.log(`[LockManager] Claimed event ${file} for ${workerId}`);
        return event;
      }

      return null;
    } catch (error) {
      console.error(`[LockManager] Failed to claim event:`, error);
      return null;
    }
  }

  async releaseEvent(eventPath: string, workerId: AgentId): Promise<boolean> {
    const eventsDir = path.join(this.locksDir, 'events');

    try {
      const fullPath = path.join(eventsDir, `${eventPath}.event`);
      
      if (!(await fs.pathExists(fullPath))) {
        return false;
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      const event: FileEvent & { claimedBy?: string } = JSON.parse(content);

      if (event.claimedBy !== workerId) {
        console.error(`[LockManager] Cannot release event claimed by ${event.claimedBy}`);
        return false;
      }

      await fs.remove(fullPath);
      console.log(`[LockManager] Released event ${eventPath}`);
      return true;
    } catch (error) {
      console.error(`[LockManager] Failed to release event:`, error);
      return false;
    }
  }

  async getClaimedEvents(workerId?: AgentId): Promise<FileEvent[]> {
    const eventsDir = path.join(this.locksDir, 'events');
    const events: FileEvent[] = [];

    try {
      const files = await fs.readdir(eventsDir);
      
      for (const file of files) {
        if (file.endsWith('.event')) {
          const eventPath = path.join(eventsDir, file);
          const content = await fs.readFile(eventPath, 'utf-8');
          const event: FileEvent & { claimedBy?: string } = JSON.parse(content);

          if (!workerId || event.claimedBy === workerId) {
            events.push(event);
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return events;
  }
}
