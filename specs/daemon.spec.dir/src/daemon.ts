/**
 * Main Daemon class for speclangd simulation
 * 
 * Generated from: @speclang/daemon
 * 
 * This ties together all the components: watcher, router, convergence, state, IPC
 */

import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { Watcher } from './watcher';
import { Router } from './router';
import { ConvergenceDetector } from './convergence';
import { State } from './state';
import { IPC } from './ipc';
import { Config } from './config';
import { LockManager } from './locks';
import { SessionStore } from './session-store';
import { writeDaemonPromMetrics } from './daemon-prom';
import {
  snapshotProjectFiles,
  diffOutputSnapshots,
} from './outputs';
import type { OutputSnapshot } from './outputs';
import {
  FileEvent,
  DaemonCommand,
  DaemonCommandKind,
  DaemonStatus,
  DaemonStatusKind,
  AgentTask,
  ConvergenceResult,
} from './types';

/** Executor locations for the source symlink, spec tree and compiled tree. */
export function getPipelineExecutorCandidates(moduleUrl: URL = pathToFileURL(__filename)): string[] {
  // CommonJS emits __filename. Anchor to this module, not the user's project cwd.
  // Source runners need TS, not the potentially stale JS beside spec-tree sources.
  const extension = moduleUrl.pathname.endsWith('.ts') ? 'ts' : 'js';
  return [
    `../pipeline/executor.${extension}`,
    `../../pipeline.spec.dir/src/executor.${extension}`,
  ].map(spec => new URL(spec, moduleUrl).href);
}

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
  // DF-SPECLANG-014 / DF-SPECLANG-2-R5: consecutive pipeline failure counter.
  // Reset on success; at >= 3 the daemon stops auto-recascading and goes Error.
  private pipelineFailures: number;
  // Cumulative counter, separate from the consecutive-failure guard.
  private pipelineErrors = 0;

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
    this.pipelineFailures = 0;
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
      await this.publishMetrics();
      this.emit('converged', result);

      // Execute pipeline on convergence
      await this.executePipeline(result);

      // DF-SPECLANG-014 / DF-SPECLANG-2-R5: after 3 consecutive pipeline
      // failures, stop the recascade loop — go to Error state with the failure
      // recorded, and do NOT reset convergence (so the same work stays queued
      // for a manual retry) until the pipeline succeeds again.
      if (this.pipelineFailures >= 3) {
        console.error('===================================================================');
        console.error(`[Daemon] PIPELINE FAILED ${this.pipelineFailures} CONSECUTIVE TIMES — stopping auto-recascade.`);
        console.error('[Daemon] Daemon state: error. Fix the pipeline failure, then restart or resume the daemon to retry.');
        console.error('===================================================================');
        this.state.setStatus(DaemonStatusKind.Error);
        await this.publishMetrics();
        this.emit('pipeline_failed', `pipeline failed ${this.pipelineFailures} consecutive times; auto-recascade stopped`);
        return;
      }

      // ARCH-004: After pipeline completes, arm for the next cascade
      // without requiring user input (/finalize). When autoRecascade is on
      // (default), the next file event automatically starts a new cascade.
      // When autoRecascade is off, the daemon stays in Converged state until
      // a user explicitly commands it to continue (legacy behavior).
      const autoRecascade = this.config.get().convergence.autoRecascade ?? true;
      if (autoRecascade) {
        // DF-SPECLANG-4: "armed" means SETTLED — the cascade drained, depth is
        // back to 0 and the persisted/derived status stays `converged` until a
        // new file event arrives. The old arm path called convergence.reset(),
        // which un-converged the detector (status fell back to 'cascading'
        // with nothing in flight) and let the quiet-period timer re-emit
        // 'converged' with no new events, so the pipeline re-ran forever.
        // Re-arming needs no reset: the detector's own onEvent() starts the
        // next cascade and resets the depth/start time for it.
        console.log('[Daemon] Auto-recascade enabled — armed for next cascade');
        this.state.setStatus(DaemonStatusKind.Converged);
        await this.publishMetrics();
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
    await this.publishMetrics();
    
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
    await this.publishMetrics();
    
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
    
    // Notify convergence
    this.convergence.onEvent(event);
    
    // DF-SPECLANG-4: read the depth AFTER onEvent() — it was read before the
    // increment, so the persisted cascadeDepth lagged the live cascade by one.
    this.state.setCascadeDepth(this.convergence.getCascadeDepth());
    void this.publishMetrics();
    
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
        await this.publishMetrics();
        console.log('[Daemon] Paused');
        break;
        
      case DaemonCommandKind.Resume:
        this.paused = false;
        this.state.setStatus(DaemonStatusKind.Idle);
        await this.publishMetrics();
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
    await this.publishMetrics();
    console.log('[Daemon] Aborted');
  }

  /** Publish a snapshot without letting telemetry failures break a cascade. */
  private async publishMetrics(): Promise<void> {
    try {
      const current = this.state.get();
      await writeDaemonPromMetrics(process.cwd(), {
        up: this.running,
        status: current.status,
        lastEventAt: current.lastEventAt,
        errors: this.pipelineErrors,
      });
    } catch (error) {
      console.warn('[Daemon] Failed to write .speclang/daemon.prom:', error);
    }
  }

  /**
   * Get current daemon status
   *
   * DF-SPECLANG-4: status comes from the cascade LIFECYCLE (pending work vs
   * settled), not from `isConverged()` — a quiet-period predicate that is also
   * true for a re-armed detector that never got an event. That predicate made
   * `/api/status` report `cascading` forever after the cascade drained.
   */
  getStatus(): DaemonStatus {
    const status = this.state.getStatus();
    
    if (this.convergence) {
      const convStatus = this.convergence.getStatus();
      status.cascadeDepth = convStatus.currentDepth;
      status.filesChanged = convStatus.filesChanged;
      
      if (this.paused) {
        status.status = DaemonStatusKind.Paused;
      } else if (convStatus.lifecycle === 'cascading') {
        status.status = DaemonStatusKind.Cascading;
      } else if (convStatus.lifecycle === 'converged') {
        status.status = DaemonStatusKind.Converged;
      } else {
        status.status = DaemonStatusKind.Idle;
      }
    } else {
      status.status = this.paused ? DaemonStatusKind.Paused : DaemonStatusKind.Cascading;
    }
    
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
      // Dynamic import to avoid circular dependencies. Check the real files
      // before importing: .js specifiers are not present in TS source layouts.
      let PipelineExecutor: any;
      const executorCandidates = getPipelineExecutorCandidates();
      let lastExecutorError: unknown = null;
      let executorLoaded = false;
      for (const spec of executorCandidates) {
        try {
          if (!existsSync(new URL(spec))) continue;
          const mod: any = await import(spec);
          PipelineExecutor = mod.PipelineExecutor;
          executorLoaded = true;
          break;
        } catch (e) {
          lastExecutorError = e;
        }
      }
      if (!executorLoaded) {
        throw lastExecutorError instanceof Error
          ? lastExecutorError
          : new Error(`Cannot load pipeline executor from any known path: ${executorCandidates.join(', ')}`);
      }
      
      console.log('[Daemon] Executing pipeline...');
      const executor = new PipelineExecutor({ verbose: true });

      // DF-SPECLANG-024: fingerprint the project tree BEFORE the pipeline runs.
      // The convergence count is what this pass WROTE, and the only witness to
      // that is the filesystem — the watcher events that triggered the pass are
      // inputs (the spec the user saved), not outputs.
      const beforeOutputs = snapshotProjectFiles(process.cwd(), this.outputSnapshotOptions());

      let pipelineResult: any;
      try {
        pipelineResult = await executor.execute(convergenceResult);
      } catch (error) {
        // A throwing stage may still have written files; attribute them, then
        // let the outer handler record the failure exactly as before.
        this.reportPipelineOutputs(beforeOutputs, false);
        throw error;
      }

      this.reportPipelineOutputs(beforeOutputs, pipelineResult?.success === true);

      if (pipelineResult.success) {
        this.pipelineFailures = 0;
        await this.publishMetrics();
        console.log('[Daemon] Pipeline succeeded!');
        this.emit('pipeline_success', pipelineResult);
      } else {
        this.pipelineFailures++;
        this.pipelineErrors++;
        await this.publishMetrics();
        console.error(`[Daemon] Pipeline failed (consecutive failure ${this.pipelineFailures}):`, pipelineResult.error);
        console.error('[Daemon] Cascade NOT complete — pipeline did not succeed.');
        this.emit('pipeline_failed', pipelineResult.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.pipelineFailures++;
      this.pipelineErrors++;
      await this.publishMetrics();
      console.error(`[Daemon] Pipeline execution error (consecutive failure ${this.pipelineFailures}):`, errorMessage);
      console.error('[Daemon] Cascade NOT complete — pipeline did not succeed.');
      this.emit('pipeline_failed', errorMessage);
    }
  }

  /**
   * DF-SPECLANG-024: attribute what this convergence pass WROTE and hand it to
   * the detector, which owns the user-visible count and the completion line.
   *
   * The diff is taken from the project tree, not from stage output, so a stage
   * that writes files without saying so is still counted and a stage that
   * rewrites a file with identical bytes is not.
   */
  private reportPipelineOutputs(before: OutputSnapshot, complete: boolean): ConvergenceResult | null {
    // The detector is built in start(); in production executePipeline() is only
    // reached from its 'converged' handler, but a daemon driven without start()
    // (unit seams, embedded use) has none — missing accounting must not turn a
    // finished pipeline into a TypeError.
    if (!this.convergence) {
      console.warn('[Daemon] No convergence detector — pipeline outputs were not accounted');
      return null;
    }

    // Same tree and same exclusions as the "before" snapshot: the pair must
    // describe one project under one rule set.
    const after = snapshotProjectFiles(before.root, {
      ignoreDirectories: before.ignoreDirectories,
      ignoreFilePatterns: before.ignoreFilePatterns,
    });
    const wrote = diffOutputSnapshots(before, after);
    return this.convergence.recordOutputs(wrote, {
      complete,
      incomplete: before.truncated || after.truncated,
    });
  }

  /**
   * DF-SPECLANG-024: the exclusions the output snapshot uses.
   *
   * Only the FILE-shaped entries of the project's own `watch.ignore` list apply
   * (`*.log` and friends) — those are the paths the daemon already treats as
   * project noise, so a log redirected into the project while a cascade runs is
   * not counted as generated code. Directory-shaped patterns (`generated/`) are
   * deliberately NOT applied: a project may generate into a directory with that
   * name, and excluding it would under-count the very thing being measured.
   */
  private outputSnapshotOptions(): { ignoreFilePatterns: string[] } {
    const ignore = this.config?.get()?.watch?.ignore ?? [];
    return { ignoreFilePatterns: ignore.filter((pattern) => !pattern.includes('/')) };
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
