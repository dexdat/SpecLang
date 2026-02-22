/**
 * File watcher for speclangd - Simulated using polling
 * 
 * Generated from: @speclang/daemon/events
 * 
 * Uses Node.js fs.watchFile for polling-based file watching.
 * In production, this would use inotify (Linux) or FSEvents (macOS).
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';
import { FileEvent, FileEventKind, DaemonConfig } from './types';

// Watch patterns from spec
const WATCH_PATTERNS = [
  '**/*.spec.{md,yaml,yml,scl}',
  '**/*.{go,ts,js,py,rs,java}.spec',
  '**/project.scl',
  '**/build.{scl,yaml}',
];

export class Watcher extends EventEmitter {
  private watchPaths: string[];
  private ignorePatterns: string[];
  private fileStates: Map<string, { mtime: number; size: number }>;
  private pollInterval: number;
  private running: boolean;
  private pollTimer?: NodeJS.Timeout;

  constructor(config: DaemonConfig) {
    super();
    this.watchPaths = config.watch.paths;
    this.ignorePatterns = config.watch.ignore;
    this.fileStates = new Map();
    this.pollInterval = 1000; // Poll every 1 second
    this.running = false;
  }

  /**
   * Start watching the configured directories
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Initial scan to build file state
    await this.initialScan();

    // Start polling
    this.pollTimer = setInterval(() => this.poll(), this.pollInterval);
    console.log(`[Watcher] Started watching: ${this.watchPaths.join(', ')}`);
  }

  /**
   * Stop watching
   */
  stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    console.log('[Watcher] Stopped');
  }

  /**
   * Initial scan to capture current file states
   */
  private async initialScan(): Promise<void> {
    for (const watchPath of this.watchPaths) {
      await this.scanDirectory(watchPath);
    }
  }

  /**
   * Recursively scan directory for files
   */
  private async scanDirectory(dirPath: string): Promise<void> {
    try {
      const exists = await fs.pathExists(dirPath);
      if (!exists) return;

      const stat = await fs.stat(dirPath);
      
      if (stat.isDirectory()) {
        const entries = await fs.readdir(dirPath);
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry);
          await this.scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        if (this.shouldWatch(dirPath)) {
          this.fileStates.set(dirPath, {
            mtime: stat.mtimeMs,
            size: stat.size,
          });
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  /**
   * Check if a path should be watched based on patterns
   */
  private shouldWatch(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Check ignore patterns
    for (const pattern of this.ignorePatterns) {
      const patternNorm = pattern.replace(/\\/g, '/');
      if (patternNorm.endsWith('/')) {
        // Directory pattern
        if (normalizedPath.includes(patternNorm.slice(0, -1))) {
          return false;
        }
      } else if (patternNorm.startsWith('*.')) {
        // Extension pattern
        const ext = patternNorm.slice(1);
        if (normalizedPath.endsWith(ext)) {
          return false;
        }
      } else if (normalizedPath.includes(patternNorm)) {
        return false;
      }
    }

    // Check watch patterns
    for (const pattern of WATCH_PATTERNS) {
      if (this.matchPattern(normalizedPath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simple glob pattern matching
   */
  private matchPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\{/g, '(')
      .replace(/,/g, '|')
      .replace(/\}/g, ')');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Poll for file changes
   */
  private async poll(): Promise<void> {
    const currentFiles = new Map<string, { mtime: number; size: number }>();

    // Scan current state
    for (const watchPath of this.watchPaths) {
      await this.scanDirectoryToMap(watchPath, currentFiles);
    }

    // Check for new and modified files
    for (const [filePath, state] of Array.from(currentFiles.entries())) {
      const oldState = this.fileStates.get(filePath);
      
      if (!oldState) {
        // New file
        this.emit('event', {
          kind: FileEventKind.Create,
          path: filePath,
          timestamp: Date.now(),
        } as FileEvent);
      } else if (oldState.mtime !== state.mtime || oldState.size !== state.size) {
        // Modified file
        this.emit('event', {
          kind: FileEventKind.Modify,
          path: filePath,
          timestamp: Date.now(),
        } as FileEvent);
      }
    }

    // Check for deleted files
    for (const [filePath] of Array.from(this.fileStates.entries())) {
      if (!currentFiles.has(filePath)) {
        this.emit('event', {
          kind: FileEventKind.Delete,
          path: filePath,
          timestamp: Date.now(),
        } as FileEvent);
      }
    }

    // Update state
    this.fileStates = currentFiles;
  }

  /**
   * Scan directory and populate file map
   */
  private async scanDirectoryToMap(
    dirPath: string,
    fileMap: Map<string, { mtime: number; size: number }>
  ): Promise<void> {
    try {
      const exists = await fs.pathExists(dirPath);
      if (!exists) return;

      const stat = await fs.stat(dirPath);
      
      if (stat.isDirectory()) {
        const entries = await fs.readdir(dirPath);
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry);
          await this.scanDirectoryToMap(fullPath, fileMap);
        }
      } else if (stat.isFile()) {
        if (this.shouldWatch(dirPath)) {
          fileMap.set(dirPath, {
            mtime: stat.mtimeMs,
            size: stat.size,
          });
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  /**
   * Force check a specific file (for manual triggers)
   */
  async trigger(pathToCheck: string): Promise<void> {
    try {
      const exists = await fs.pathExists(pathToCheck);
      const stat = exists ? await fs.stat(pathToCheck) : null;
      
      if (exists && stat?.isFile()) {
        if (this.shouldWatch(pathToCheck)) {
          this.emit('event', {
            kind: FileEventKind.Modify,
            path: pathToCheck,
            timestamp: Date.now(),
          } as FileEvent);
        }
      } else {
        this.emit('event', {
          kind: FileEventKind.Delete,
          path: pathToCheck,
          timestamp: Date.now(),
        } as FileEvent);
      }
    } catch (error) {
      console.error(`[Watcher] Error triggering ${pathToCheck}:`, error);
    }
  }
}
