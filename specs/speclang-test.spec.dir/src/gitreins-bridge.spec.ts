/**
 * GitReins Bridge — MCP client for SpecLang pipeline integration
 *
 * Spawns the GitReins Python MCP server as a child process and
 * communicates via JSON-RPC 2.0 over stdio.
 *
 * Tools exposed:
 *   - createTask(id, title, criteria) — create a cascade tracking task
 *   - startTask(id) — mark task in-progress
 *   - completeTask(id) — complete task (triggers evaluator if LLM configured)
 *   - listTasks(status?) — list tasks
 *   - runGuards() — run Tier 1 guards (secrets, lint, tests)
 *   - evaluate(id) — run full evaluator on a task
 *   - commitGuard(message) — guards-first git commit
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// ── Config ──────────────────────────────────────────────────────

const GITREINS_POC_PATH = path.resolve(
  __dirname, '..', '..', 'gitreins-poc'
);

const MCP_SERVER_SCRIPT = path.join(
  GITREINS_POC_PATH, 'gitreins_mcp', 'server.py'
);

const WORKDIR = path.resolve(__dirname, '..');

// ── Types ───────────────────────────────────────────────────────

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: { content?: Array<{ type: string; text: string }> };
  error?: { code: number; message: string };
}

export interface TaskResult {
  id: string;
  title: string;
  criteria: string[];
  status: string;
  created_at: string;
  completed_at: string | null;
}

export interface GuardResult {
  passed: boolean;
  results: Array<{ name: string; passed: boolean; output: string }>;
}

export interface EvaluationResult {
  task_id: string;
  passed: boolean;
  verdict?: string;
  items?: Array<{ criterion: string; status: string; detail: string }>;
  summary?: string;
  pipeline_result?: { passed: boolean; stages: Record<string, unknown> };
}

// ── Bridge ──────────────────────────────────────────────────────

export class GitReinsBridge {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private buffer = '';
  private ready = false;
  private stderrLog: string[] = [];

  constructor(private workdir: string = WORKDIR) {}

  async start(): Promise<void> {
    if (this.process) return;

    // Verify GitReins MCP server exists
    if (!fs.existsSync(MCP_SERVER_SCRIPT)) {
      console.warn(`[gitreins-bridge] MCP server not found at ${MCP_SERVER_SCRIPT}`);
      console.warn('[gitreins-bridge] Running in fallback mode (no GitReins)');
      this.ready = true;
      return;
    }

    const enginePath = path.join(GITREINS_POC_PATH, 'engine');
    if (!fs.existsSync(enginePath)) {
      console.warn(`[gitreins-bridge] engine/ not found at ${enginePath}`);
      this.ready = true;
      return;
    }

    console.log(`[gitreins-bridge] Starting MCP server from ${GITREINS_POC_PATH}`);
    console.log(`[gitreins-bridge] Workdir: ${this.workdir}`);

    this.process = spawn('python3', [MCP_SERVER_SCRIPT], {
      cwd: GITREINS_POC_PATH,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GITREINS_WORKDIR: this.workdir,
        PYTHONPATH: GITREINS_POC_PATH + (process.env.PYTHONPATH ? ':' + process.env.PYTHONPATH : ''),
        // Disable LLM calls during bridge tests
        GITREINS_LLM_API_KEY: '',
      },
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      console.log(`[gitreins stdout] ${chunk.trim()}`);
      this.buffer += chunk;
      this.processBuffer();
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      this.stderrLog.push(msg);
      if (msg) console.log(`[gitreins stderr] ${msg}`);
    });

    this.process.on('exit', (code, signal) => {
      console.log(`[gitreins-bridge] MCP server exited (code ${code}, signal ${signal})`);
      this.process = null;
      this.ready = false;
      for (const [, pending] of this.pending) {
        pending.reject(new Error(`GitReins MCP server exited (code ${code})`));
      }
      this.pending.clear();
    });

    this.process.on('error', (err) => {
      console.error(`[gitreins-bridge] Process error: ${err.message}`);
    });

    // Mark ready so send() works
    this.ready = true;

    // Wait a tick for process to start
    await new Promise((r) => setTimeout(r, 500));

    // Initialize the MCP session
    const initResult = await this.send('initialize', {});
    console.log(`[gitreins-bridge] Initialized: ${JSON.stringify(initResult)}`);

    // notifications/initialized returns null (no response expected)
    await this.send('notifications/initialized', {});

    console.log('[gitreins-bridge] Ready');
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.ready = false;
  }

  private async send(
    method: string,
    params: Record<string, unknown> = {},
    timeoutMs: number = 15000
  ): Promise<unknown> {
    if (!this.ready || !this.process) {
      console.log(`[gitreins-bridge] Skip send(${method}): not ready`);
      return null;
    }

    const id = ++this.requestId;
    const request = { jsonrpc: '2.0', method, params, id };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        console.log(`[gitreins-bridge] Timeout waiting for response to ${method} (id=${id}, ${timeoutMs}ms)`);
        resolve(null);
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (v: unknown) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e: Error) => {
          clearTimeout(timer);
          reject(e);
        },
      });

      const data = JSON.stringify(request) + '\n';
      console.log(`[gitreins-bridge] >> ${method} (id=${id})`);
      this.process!.stdin?.write(data);
    });
  }

  private processBuffer(): void {
    while (this.buffer.includes('\n')) {
      const nlIndex = this.buffer.indexOf('\n');
      const line = this.buffer.slice(0, nlIndex).trim();
      this.buffer = this.buffer.slice(nlIndex + 1);

      if (!line) continue;

      try {
        const response: MCPResponse = JSON.parse(line);
        console.log(`[gitreins-bridge] << response id=${response.id}${response.error ? ' ERROR' : ''}`);
        const pending = this.pending.get(response.id);
        if (pending) {
          this.pending.delete(response.id);
          if (response.error) {
            pending.reject(new Error(`GitReins error: ${response.error.message}`));
          } else {
            pending.resolve(response.result);
          }
        } else {
          console.log(`[gitreins-bridge]   (no pending request for id=${response.id})`);
        }
      } catch {
        // Non-JSON line
      }
    }
  }

  private parseContent(result: unknown): unknown {
    const r = result as Record<string, unknown>;
    if (r?.content && Array.isArray(r.content) && r.content.length > 0) {
      try {
        return JSON.parse(r.content[0].text);
      } catch {
        return r.content[0].text;
      }
    }
    return result;
  }

  // ── Public API ──────────────────────────────────────────────

  async createTask(id: string, title: string, criteria: string[]): Promise<TaskResult | null> {
    const result = await this.send('tools/call', {
      name: 'task.create',
      arguments: { id, title, criteria },
    });
    if (!result) return null;
    return this.parseContent(result) as unknown as TaskResult;
  }

  async startTask(id: string): Promise<TaskResult | null> {
    const result = await this.send('tools/call', {
      name: 'task.start',
      arguments: { id },
    });
    if (!result) return null;
    return this.parseContent(result) as unknown as TaskResult;
  }

  async completeTask(id: string): Promise<{ task: TaskResult; verdict?: Record<string, unknown> } | null> {
    const result = await this.send('tools/call', {
      name: 'task.complete',
      arguments: { id },
    });
    if (!result) return null;
    return this.parseContent(result) as unknown as { task: TaskResult; verdict?: Record<string, unknown> };
  }

  async listTasks(status?: string): Promise<TaskResult[]> {
    const params: Record<string, unknown> = {};
    if (status) params.status = status;
    const result = await this.send('tools/call', {
      name: 'task.list',
      arguments: params,
    });
    if (!result) return [];
    const parsed = this.parseContent(result) as Record<string, unknown>;
    return (parsed?.tasks || []) as TaskResult[];
  }

  async runGuards(): Promise<GuardResult | null> {
    const result = await this.send('tools/call', {
      name: 'guard.run',
      arguments: {},
    }, 120000); // 2min for npm test
    if (!result) return null;
    return this.parseContent(result) as unknown as GuardResult;
  }

  async evaluate(id: string): Promise<EvaluationResult | null> {
    const result = await this.send('tools/call', {
      name: 'judge.evaluate',
      arguments: { id },
    });
    if (!result) return null;
    return this.parseContent(result) as unknown as EvaluationResult;
  }

  async commit(message: string): Promise<{ committed: boolean; output?: string; error?: string } | null> {
    const result = await this.send('tools/call', {
      name: 'commit',
      arguments: { message },
    });
    if (!result) return null;
    return this.parseContent(result) as { committed: boolean; output?: string; error?: string };
  }
}

// ── Standalone test ─────────────────────────────────────────────

async function main() {
  const bridge = new GitReinsBridge();
  await bridge.start();

  console.log('\n=== GitReins Bridge Test ===');

  // 1. List tools (via task.list as a smoke test)
  console.log('\n--- List tasks (should be empty) ---');
  const tasks = await bridge.listTasks();
  console.log(`Tasks: ${tasks.length}`);

  // 2. Create a test task
  console.log('\n--- Create cascade task ---');
  const task = await bridge.createTask('cascade-test-1', 'Test cascade integration', [
    'Bridge connects to GitReins MCP',
    'Tasks are created and listed',
  ]);
  if (task) {
    console.log(`Created: ${task.id} (status: ${task.status})`);
  } else {
    console.log('Create failed (null)');
  }

  // 3. List again
  console.log('\n--- List tasks (should have 1) ---');
  const tasks2 = await bridge.listTasks();
  console.log(`Tasks: ${tasks2.length}`);
  for (const t of tasks2) {
    console.log(`  - ${t.id}: ${t.status}`);
  }

  // 4. Complete the task
  console.log('\n--- Complete task ---');
  const completed = await bridge.completeTask('cascade-test-1');
  if (completed) {
    console.log(`Completed: ${completed.task.status}`);
    if (completed.verdict) {
      console.log(`Verdict: ${JSON.stringify(completed.verdict)}`);
    } else {
      console.log('No verdict (LLM not configured — expected)');
    }
  }

  // 5. Run guards
  console.log('\n--- Run guards ---');
  const guards = await bridge.runGuards();
  console.log(`Guards: ${JSON.stringify(guards)}`);

  await bridge.stop();
  console.log('\n=== Bridge test complete ===');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Bridge test failed:', err);
    process.exit(1);
  });
}
