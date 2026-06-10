/**
 * Cascade → GitReins Task Tracker
 *
 * Bridges SpecLang cascade events to GitReins task lifecycle:
 *   - cascade change → task.create (pending)
 *   - cascade start → task.start (in_progress)
 *   - cascade converge → task.complete → triggers evaluator
 *
 * Usage:
 *   import { CascadeTracker } from './.speclang/gitreins-bridge.spec';
 *   const tracker = new CascadeTracker();
 *   await tracker.start();
 *   await tracker.onChange('spec-file.md', ['Criteria 1', 'Criteria 2']);
 *   await tracker.onConvergence();
 *   await tracker.evaluateLatest();
 *   await tracker.stop();
 */

import { GitReinsBridge } from './gitreins-bridge.spec';

export class CascadeTracker {
  private bridge: GitReinsBridge;
  private currentTaskId: string | null = null;
  private changeCount = 0;

  constructor() {
    this.bridge = new GitReinsBridge();
  }

  async start(): Promise<void> {
    await this.bridge.start();
  }

  async stop(): Promise<void> {
    await this.bridge.stop();
  }

  /**
   * Called when a file change is detected by the daemon.
   * Creates or updates a GitReins task tracking this cascade.
   */
  async onChange(specFile: string, criteria: string[] = []): Promise<string | null> {
    this.changeCount++;
    const taskId = `cascade-${specFile.replace(/[^a-zA-Z0-9_-]/g, '-')}-${Date.now()}`;
    const defaultCriteria = criteria.length > 0
      ? criteria
      : [
          `Assemble spec: ${specFile}`,
          'Spec outputs build cleanly (tsc)',
          'All tests pass',
        ];

    const task = await this.bridge.createTask(taskId, `Cascade: ${specFile}`, defaultCriteria);
    if (task) {
      this.currentTaskId = taskId;
      console.log(`[cascade-tracker] Task created: ${taskId} (status: ${task.status})`);
      return taskId;
    }
    return null;
  }

  /**
   * Called when a cascade step starts processing.
   */
  async onStart(): Promise<void> {
    if (this.currentTaskId) {
      const task = await this.bridge.startTask(this.currentTaskId);
      if (task) {
        console.log(`[cascade-tracker] Task started: ${this.currentTaskId} (status: ${task.status})`);
      }
    }
  }

  /**
   * Called when cascade converges (all changes settled).
   * Completes the task, which triggers evaluator if LLM is configured.
   */
  async onConvergence(): Promise<{ completed: boolean; verdict: string }> {
    if (!this.currentTaskId) {
      return { completed: false, verdict: 'No active task' };
    }

    const result = await this.bridge.completeTask(this.currentTaskId);
    if (!result) {
      return { completed: true, verdict: 'Completed (no MCP server)' };
    }

    let verdict = `Task ${result.task.id}: ${result.task.status}`;
    if (result.verdict) {
      verdict += ` | Evaluator: ${JSON.stringify(result.verdict)}`;
    } else {
      verdict += ` | Evaluator: skipped (LLM not configured)`;
    }

    console.log(`[cascade-tracker] ${verdict}`);
    this.currentTaskId = null;
    return { completed: true, verdict };
  }

  /**
   * Run guards on the current state.
   */
  async runGuards(): Promise<string> {
    const result = await this.bridge.runGuards();
    if (!result) {
      return 'Guards: skipped (no MCP server)';
    }
    const status = result.passed ? 'PASSED' : 'FAILED';
    const detail = result.results
      .map((r) => `  ${r.passed ? '✅' : '❌'} ${r.name}`)
      .join('\n');
    return `Guards: ${status}\n${detail}`;
  }

  /**
   * Run evaluator on a specific task.
   */
  async evaluate(taskId: string): Promise<string> {
    const result = await this.bridge.evaluate(taskId);
    if (!result) {
      return `Evaluate ${taskId}: skipped (no MCP server)`;
    }
    return `Evaluate ${taskId}: ${result.passed ? 'PASSED' : 'FAILED'}${
      result.verdict ? ` (${result.verdict})` : ''
    }${result.summary ? `\n  ${result.summary}` : ''}`;
  }
}

// ── Standalone entry point ─────────────────────────────────────

async function main() {
  const guardOnly = process.argv.includes('--guard-only');
  const tracker = new CascadeTracker();
  try {
    await tracker.start();

    if (guardOnly) {
      console.log('=== GitReins Guard Check ===');
      const result = await tracker.runGuards();
      console.log(result);
      await tracker.stop();
      process.exit(0);
      return;
    }

    console.log('=== GitReins Cascade Track ===');

    const taskId = await tracker.onChange('cascade-convergence', [
      'All specs assemble correctly',
      'Build compiles with no errors',
      'Self-hosting verified',
      'All tests pass',
    ]);

    if (taskId) {
      console.log(`Task: ${taskId}`);
      await tracker.onStart();
      const { verdict } = await tracker.onConvergence();
      console.log(`Result: ${verdict}`);
    } else {
      console.log('GitReins MCP not available — skipping task tracking');
    }
  } catch (err) {
    console.error(`[cascade-tracker] Error: ${err}`);
  }
  await tracker.stop();
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}
