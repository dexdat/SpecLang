/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/poc-daemon.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
 */

import { SimpleAgent } from './simple-agent';
import { EventRouter } from './event-router';
import { ConvergenceDetector } from './poc-convergence';
import { FileWatcher } from './poc-file-watcher';
import { FileEvent, ConvergenceEvent, POCError } from '../types/poc';

/**
 * POC Configuration
 */
const POC_CONFIG = {
  watch: {
    directory: './specs',
    debounce: 300,        // ms
    ignore: ['*.tmp', '*~', '.git/**', 'node_modules/**']
  },
  convergence: {
    quietPeriod: 5000,    // 5 seconds
    maxDepth: 10          // safety limit
  },
  output: {
    codeDir: './src',
    useSymlinks: true
  }
};

/**
 * Main entry point that wires all POC components together.
 */
export class PocDaemon {
  private watcher: FileWatcher;
  private router: EventRouter;
  private agent: SimpleAgent;
  private convergence: ConvergenceDetector;
  private isRunning: boolean;
  
  constructor() {
    // Create components
    this.agent = new SimpleAgent();
    this.router = new EventRouter(this.agent);
    this.watcher = new FileWatcher({
      watchDir: POC_CONFIG.watch.directory,
      ignorePatterns: POC_CONFIG.watch.ignore
    });
    this.convergence = new ConvergenceDetector({
      quietPeriodMs: POC_CONFIG.convergence.quietPeriod
    });
    this.isRunning = false;
    
    // Wire events
    this.setupEventHandlers();
  }
  
  /**
   * Setup event handlers between components
   */
  private setupEventHandlers(): void {
    // File change → Router → Agent
    this.watcher.on('change', (event: FileEvent) => {
      this.router.route(event).catch((error) => {
        console.error('[Daemon] Failed to route event:', error);
      });
    });
    
    // File change → Convergence tracker
    this.watcher.on('change', (event: FileEvent) => {
      this.convergence.onFileChange(event.path);
    });
    
    // Convergence detected
    this.convergence.on('converged', (event: ConvergenceEvent) => {
      console.log(`✅ Cascade converged (${event.duration}ms)`);
      console.log(`   Files changed: ${event.filesChanged.length}`);
    });
    
    // Error handling
    this.watcher.on('error', (error: Error) => {
      console.error('[Watcher Error]', error);
    });
  }
  
  /**
   * Start the POC daemon
   */
  async start(): Promise<void> {
    console.log('[Daemon] Starting speclangd POC...');
    
    try {
      // Start file watcher
      await this.watcher.watch(POC_CONFIG.watch.directory);
      
      // Process existing specs on startup
      await this.processExistingSpecs();
      
      this.isRunning = true;
      console.log('✅ speclangd running. Watching specs/');
      console.log('   Edit a spec file to see the cascade in action!');
    } catch (error) {
      throw new POCError(
        'WATCH_ERROR',
        `Failed to start daemon: ${(error as Error).message}`
      );
    }
  }
  
  /**
   * Process existing specs on startup
   * Ensures all specs have generated code
   */
  private async processExistingSpecs(): Promise<void> {
    console.log('[Daemon] Scanning existing specs...');
    
    try {
      const specFiles = await this.watcher.getSpecFiles();
      console.log(`[Daemon] Found: ${specFiles.length} specs`);
      
      // Process each spec
      for (const filePath of specFiles) {
        try {
          await this.processSpecFile(filePath);
        } catch (error) {
          console.error(`[Daemon] Failed to process ${filePath}:`, error);
          // Continue with other specs
        }
      }
      
      console.log('[Daemon] ✅ Initial processing complete');
    } catch (error) {
      console.warn('[Daemon] Warning: Could not scan existing specs:', error);
    }
  }
  
  /**
   * Process a single spec file
   */
  private async processSpecFile(filePath: string): Promise<void> {
    // Check if already up to date
    if (await this.isUpToDate(filePath)) {
      console.log(`[Daemon]   ${filePath} → already up to date`);
      return;
    }
    
    console.log(`[Daemon]   ${filePath} → processing...`);
    
    // Create file event
    const event: FileEvent = {
      type: 'modified',
      path: filePath,
      timestamp: Date.now()
    };
    
    // Route to agent
    await this.router.route(event);
  }
  
  /**
   * Check if spec is up to date
   */
  private async isUpToDate(filePath: string): Promise<boolean> {
    const { stat, readdir } = await import('fs/promises');
    const { join, dirname } = await import('path');
    
    try {
      const specStat = await stat(filePath);
      const generatedDir = this.getGeneratedPath(filePath);
      
      // Check if generated directory exists
      let dirStat;
      try {
        dirStat = await stat(generatedDir);
      } catch {
        return false; // No generated code directory
      }
      
      if (!dirStat || !dirStat.isDirectory()) {
        return false;
      }
      
      // Read all generated files and find the newest
      const files = await readdir(generatedDir);
      if (files.length === 0) {
        return false; // Directory exists but empty
      }
      
      // Find the most recently modified generated file
      let newestMtime = 0;
      for (const file of files) {
        if (file.endsWith('.ts')) {
          const fileStat = await stat(join(generatedDir, file));
          if (fileStat.mtimeMs > newestMtime) {
            newestMtime = fileStat.mtimeMs;
          }
        }
      }
      
      if (newestMtime === 0) {
        return false; // No TypeScript files found
      }
      
      // Check if generated code is newer than spec
      return newestMtime >= specStat.mtimeMs;
    } catch {
      return false;
    }
  }
  
  /**
   * Convert spec path to generated path
   */
  private getGeneratedPath(specPath: string): string {
    // specs/hello.spec.md → specs/hello.spec.dir/src/
    return specPath.replace('.spec.md', '.spec.dir/src');
  }
  
  /**
   * Stop the daemon
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    await this.watcher.stop();
    this.convergence.stop();
    this.isRunning = false;
    
    console.log('[Daemon] speclangd stopped');
  }
  
  /**
   * Check if daemon is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}
