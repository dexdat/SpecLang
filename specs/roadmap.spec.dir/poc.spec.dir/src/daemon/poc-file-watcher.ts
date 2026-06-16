/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/poc-daemon.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */

import { EventEmitter } from 'events';
import { watch, FSWatcher } from 'fs';
import { glob } from 'glob';
import { FileEvent, FileEventType } from '../types/poc';

/**
 * POC File Watcher
 * Simple wrapper around Node.js fs.watch
 */
export class FileWatcher extends EventEmitter {
  private watcher?: FSWatcher;
  private watchDir: string;
  private ignorePatterns: string[];
  
  constructor(options?: { watchDir?: string; ignorePatterns?: string[] }) {
    super();
    this.watchDir = options?.watchDir || './specs';
    this.ignorePatterns = options?.ignorePatterns || ['*.tmp', '*~', '.git/**', 'node_modules/**'];
  }
  
  /**
   * Start watching the spec directory
   */
  async watch(directory: string): Promise<void> {
    this.watchDir = directory;
    
    // Verify directory exists
    const { access, constants } = await import('fs/promises');
    try {
      await access(directory, constants.R_OK);
    } catch {
      throw new Error(`Cannot watch directory: ${directory} does not exist or is not readable`);
    }
    
    // Start file watcher
    this.watcher = watch(directory, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      
      // Check if file should be ignored
      if (this.shouldIgnore(filename)) return;
      
      // Check if it's a spec file
      if (!this.isSpecFile(filename)) return;
      
      // Emit change event
      const event: FileEvent = {
        type: this.mapEventType(eventType),
        path: `${directory}/${filename}`.replace(/\/+/g, '/'),
        timestamp: Date.now()
      };
      
      this.emit('change', event);
    });
    
    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });
    
    console.log(`[FileWatcher] Watching: ${directory}`);
  }
  
  /**
   * Check if file should be ignored
   */
  private shouldIgnore(filename: string): boolean {
    for (const pattern of this.ignorePatterns) {
      // Simple glob matching
      if (pattern.includes('**')) {
        const prefix = pattern.replace('/**', '').replace('**', '');
        if (filename.includes(prefix)) return true;
      } else if (filename === pattern || filename.endsWith(pattern.replace('*', ''))) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Check if file is a spec file
   */
  private isSpecFile(filename: string): boolean {
    return filename.endsWith('.spec.md') || 
           filename.endsWith('.spec.yaml') ||
           filename.endsWith('.spec.yml') ||
           filename.endsWith('.scl');
  }
  
  /**
   * Map fs event type to our event type
   */
  private mapEventType(eventType: string | null): FileEventType {
    if (eventType === 'rename') return 'created';
    if (eventType === 'change') return 'modified';
    return 'modified';
  }
  
  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
    console.log('[FileWatcher] Stopped');
  }
  
  /**
   * Get initial list of spec files
   */
  async getSpecFiles(): Promise<string[]> {
    const pattern = '**/*.{spec.md,spec.yaml,spec.yml,scl}';
    const files = await glob(pattern, {
      cwd: this.watchDir,
      absolute: true
    });
    return files;
  }
}
