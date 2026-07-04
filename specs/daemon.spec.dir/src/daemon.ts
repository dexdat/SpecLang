/**
 * Main Daemon class for speclangd simulation
 * 
 * Generated from: @speclang/daemon
 * 
 * This ties together all the components: watcher, router, convergence, state, IPC
 */

import { EventEmitter } from 'events';
import { Watcher } from './watcher';
import { Router } from './router';
import { ConvergenceDetector } from './convergence';
import { State } from './state';
import { IPC } from './ipc';
import { Config } from './config';
import { LockManager } from './locks';
import { SessionStore } from './session-store';
import {
  FileEvent,
  DaemonCommand,
  DaemonCommandKind,
  DaemonStatus,
  DaemonStatusKind,
  AgentTask,
  ConvergenceResult,
} from './types';

export class Daemon extends EventEmitter {
  private watcher: Watcher | null = null;
  private router: Router;
  private convergence: ConvergenceDetector;
  private state: State;
  private ipc: IPC;
  private config: Config;
  private lockManager: LockManager;
  private sessionStore: SessionStore;
  
  private running: boolean;
  private paused: boolean;

  constructor(configPath?: string) {
    super();
    this.config = new Config(configPath);
    this.router = new Router();
    this.state = new State();
    this.ipc = new IPC();
    this.lockManager = new LockManager();
    this.sessionStore = new SessionStore();
    this.convergence = null!; // Initialized in start()
    this.running = false;
    this.paused = false;
  }

  /**
   * Initialize and start the daemon
   */
  async start(): Promise<void> {
    console.log('[Daemon] Starting speclangd...');
    
    // Load configuration
    await this.config.load();
    
    // Initialize lock manager
    this.lockManager = new LockManager(
      this.config.get().locks.dir,
      this.config.get().locks.timeout
    );
    await this.lockManager.initialize();
    
    // Initialize components
    this.watcher = new Watcher(this.config.get());
    this.convergence = new ConvergenceDetector(this.config.get());
    
    // Wire up event flow: watcher -> convergence -> router
    this.watcher.on('event', (event: FileEvent) => {
      if (!this.paused) {
        this.handleFileEvent(event);
      }
    });

    // Handle convergence - trigger pipeline execution
    this.convergence.on('converged', async (result) => {
      console.log('[Daemon] Cascade converged!', result);
      this.state.setStatus(DaemonStatusKind.Converged);
      this.emit('converged', result);

      // Execute pipeline on convergence
      await this.executePipeline(result);

      // ARCH-004: After pipeline completes, arm for the next cascade
      // without requiring user input (/finalize). When autoRecascade is on
      // (default), the next file event automatically starts a new cascade.
      // When autoRecascade is off, the daemon stays in Converged state until
      // a user explicitly commands it to continue (legacy behavior).
      const autoRecascade = this.config.get().convergence.autoRecascade ?? true;
      if (autoRecascade) {
        console.log('[Daemon] Auto-recascade enabled — arming for next cascade');
        this.convergence.reset();
        this.state.setStatus(DaemonStatusKind.Idle);
        this.emit('armed', result);
      } else {
        console.log('[Daemon] Auto-recascade disabled — awaiting user input');
      }
    });

    // Start watching
    await this.watcher.start();
    
    // Load persisted state
    await this.state.load();
    
    this.running = true;
    this.state.setStatus(DaemonStatusKind.Idle);
    
    console.log('[Daemon] Started successfully');
    this.emit('started');
  }

  /**
   * Stop the daemon
   */
  async stop(): Promise<void> {
    console.log('[Daemon] Stopping...');
    
    if (this.watcher) {
      this.watcher.stop();
    }
    
    if (this.convergence) {
      this.convergence.stop();
    }
    
    await this.state.save();
    
    this.running = false;
    this.state.setStatus(DaemonStatusKind.Idle);
    
    console.log('[Daemon] Stopped');
    this.emit('stopped');
  }

  /**
   * Restart the daemon
   */
  async restart(): Promise<void> {
    console.log('[Daemon] Restarting...');
    await this.stop();
    await this.start();
    console.log('[Daemon] Restarted');
  }

  /**
   * Handle a file event
   */
  private handleFileEvent(event: FileEvent): void {
    console.log(`[Daemon] File event: ${event.kind} - ${event.path}`);
    
    // Update state
    this.state.addChangedFile(event.path);
    this.state.setStatus(DaemonStatusKind.Cascading);
    this.state.setCascadeDepth(this.convergence.getCascadeDepth());
    
    // Notify convergence
    this.convergence.onEvent(event);
    
    // Route to agent
    const task = this.router.route(event);
    if (task) {
      console.log(`[Daemon] Routed to agent: ${this.router.getAgentForTask(task)}`);
      this.emit('task', task);
    }
  }

  /**
   * Process a command
   */
  async processCommand(command: DaemonCommand): Promise<void> {
    switch (command.kind) {
      case DaemonCommandKind.Status:
        console.log(IPC.formatStatus(this.getStatus()));
        break;
        
      case DaemonCommandKind.Pause:
        this.paused = true;
        this.state.setStatus(DaemonStatusKind.Paused);
        console.log('[Daemon] Paused');
        break;
        
      case DaemonCommandKind.Resume:
        this.paused = false;
        this.state.setStatus(DaemonStatusKind.Idle);
        console.log('[Daemon] Resumed');
        break;
        
      case DaemonCommandKind.Abort:
        await this.abort();
        break;
        
      case DaemonCommandKind.Trigger:
        if (command.path && this.watcher) {
          await this.watcher.trigger(command.path);
          console.log(`[Daemon] Triggered: ${command.path}`);
        }
        break;
        
      case DaemonCommandKind.Converge:
        if (this.convergence) {
          try {
            const result = await this.convergence.waitForConvergence(60000);
            console.log('[Daemon] Converged:', result);
          } catch (error) {
            console.error('[Daemon] Convergence timeout');
          }
        }
        break;
    }
  }

  /**
   * Abort current cascade
   */
  async abort(): Promise<void> {
    console.log('[Daemon] Aborting cascade...');
    this.convergence.reset();
    this.router.resetCascadeDepth();
    await this.state.reset();
    this.state.setStatus(DaemonStatusKind.Idle);
    console.log('[Daemon] Aborted');
  }

  /**
   * Get current daemon status
   */
  getStatus(): DaemonStatus {
    const status = this.state.getStatus();
    
    if (this.convergence) {
      const convStatus = this.convergence.getStatus();
      status.cascadeDepth = convStatus.currentDepth;
      status.filesChanged = convStatus.filesChanged;
    }
    
    status.status = this.paused ? DaemonStatusKind.Paused : 
                     this.convergence?.isConverged() ? DaemonStatusKind.Converged :
                     DaemonStatusKind.Cascading;
    
    return status;
  }

  /**
   * Check if daemon is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Check if daemon is paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Health check for daemon
   */
  healthCheck(): boolean {
    return this.running && this.watcher !== null && this.convergence !== null;
  }

  /**
   * Get convergence detector
   */
  getConvergence(): ConvergenceDetector {
    return this.convergence;
  }

  /**
   * Get router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Get config
   */
  getConfig(): Config {
    return this.config;
  }

  /**
   * Get lock manager
   */
  getLockManager(): LockManager {
    return this.lockManager;
  }

  /**
   * Get session store
   */
  getSessionStore(): SessionStore {
    return this.sessionStore;
  }

  /**
   * Execute pipeline on convergence
   */
  private async executePipeline(convergenceResult: ConvergenceResult): Promise<void> {
    try {
      // Dynamic import to avoid circular dependencies
      const { PipelineExecutor } = await import('../pipeline/executor');
      
      console.log('[Daemon] Executing pipeline...');
      const executor = new PipelineExecutor({ verbose: true });
      
      const result = await executor.execute(convergenceResult);
      
      if (result.success) {
        console.log('[Daemon] Pipeline succeeded!');
        this.emit('pipeline_success', result);
      } else {
        console.error('[Daemon] Pipeline failed:', result.error);
        this.emit('pipeline_failed', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Daemon] Pipeline execution error:', errorMessage);
      this.emit('pipeline_failed', errorMessage);
    }
  }
}

// Singleton instance
let daemonInstance: Daemon | null = null;

export async function createDaemon(configPath?: string): Promise<Daemon> {
  if (!daemonInstance) {
    daemonInstance = new Daemon(configPath);
  }
  return daemonInstance;
}

export function getDaemon(): Daemon | null {
  return daemonInstance;
}
