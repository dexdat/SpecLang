// speclang-header lines:3
// target: src/ralph-loop.ts
// Generated from Ralph Loop implementation spec
// DO NOT EDIT MANUALLY


// Block: implementation/ralph-loop/controller
import Database from 'better-sqlite3';
// QA-SPECLANG-5-R2: the loop's state DB is opened only through the guarded
// helper, so a file that is not a SQLite database reports the actionable
// diagnostic instead of a raw SqliteError from the first prepared statement.
// (Specifier note: through the src/db projection — this spec dir's own compiled
// index.js is stale and would shadow the guarded TypeScript source for .js
// specifiers.)
import { openStateDatabase, withStateDatabase, STATE_DB_CORRUPT_CODE } from '../../../src/db/index.js';
// QA-SPECLANG-5-R3: the canonical state-DB initialiser. It is the exact code
// `createDatabase()` runs (src/db/index.ts -> SpecLangDB.initialize -> migrate),
// so the loop never grows a second copy of the state schema.
import { getCurrentVersion, migrate } from '../../../src/db/migrations.js';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done' | 'failed';
  assigned_to: 'builder' | 'verifier' | null;
  created_at: number;
  updated_at: number;
}

/**
 * QA-SPECLANG-5-R3: the Ralph Loop's own task schema, compiled in.
 *
 * The loop reads `tasks` (title/description/status/assigned_to/updated_at) and
 * writes `steering_packets` rows carrying a JSON `payload`. Neither column set
 * is in the canonical state schema's ralph migration: `005_ralph.sql` creates
 * `ralph_tasks` (with `description`, no `title`) and a `steering_packets` table
 * whose field is `content`. And nothing in this repo ever executed this
 * module's own `schema.sql`, so a state DB that some other command had not
 * already prepared had no `tasks` table at all — the first
 * `SELECT ... FROM tasks` in getNextTask died with
 * `SqliteError: no such table: tasks`.
 *
 * The DDL is compiled in instead of read from `src/ralph-loop/schema.sql`
 * because the published tarball ships `dist/` only (the same constraint
 * src/db/migrations.ts documents), so a runtime read of a .sql file would fail
 * for every consumer. It is pinned to that file by
 * tests/db/ralph-loop-fresh-state.test.ts, which applies schema.sql to its own
 * database and diffs the resulting `tasks` table against this DDL — change one
 * without the other and the test fails loudly instead of drifting.
 */
export const RALPH_LOOP_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
`;

/** Stable, machine-checkable code for "the loop could not prepare its state DB". */
export const RALPH_LOOP_INIT_FAILED_CODE = 'RALPH_LOOP_INIT_FAILED';

/**
 * Thrown when the loop cannot prepare its state database (unwritable path, a
 * directory it may not create, a file that failed setup deeper than the opener's
 * probe). The message names the file and the way out: the failure this replaces
 * was a bare `SqliteError: no such table: tasks` that named neither.
 */
export class RalphLoopStateInitError extends Error {
  /** Stable, machine-checkable error code (see RALPH_LOOP_INIT_FAILED_CODE). */
  code: typeof RALPH_LOOP_INIT_FAILED_CODE;
  /** The state database file the loop could not prepare. */
  filePath: string;
  /** The original error, kept for diagnostics. */
  cause?: unknown;

  constructor(filePath: string, cause?: unknown) {
    super(
      [
        `The Ralph Loop could not prepare its state database: ${filePath}`,
        `  ${String((cause as Error | undefined)?.message ?? cause)}`,
        '',
        'The loop needs a writable SQLite file at that path. Fix the directory',
        'permissions (or point the loop at a writable path) and rerun. If the file is',
        'unusable, back it up and delete it so the loop rebuilds it — the documented',
        'recovery step is docs/troubleshooting.md -> "Emergency Recovery":',
        `  rm -f ${filePath}`
      ].join('\n')
    );
    this.name = 'RalphLoopStateInitError';
    this.code = RALPH_LOOP_INIT_FAILED_CODE;
    this.filePath = filePath;
    this.cause = cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RalphLoopStateInitError);
    }
  }
}

/**
 * Create the directory that holds the state database when it is missing.
 *
 * `tsx src/ralph-loop.ts` defaults to `.speclang/speclang.db`, and on a fresh
 * project that directory does not exist: better-sqlite3 then refuses with
 * `Cannot open database because the directory does not exist` before any schema
 * question is even asked. Creating it is what "fresh project" needs; a path
 * whose directory cannot be created surfaces as RalphLoopStateInitError.
 */
function ensureStateDirectory(dbPath: string): void {
  if (dbPath === ':memory:' || dbPath.startsWith('file:')) {
    return;
  }
  const dir = path.dirname(dbPath);
  if (dir === '.' || dir === '' || existsSync(dir)) {
    return;
  }
  mkdirSync(dir, { recursive: true });
}

/**
 * Prepare a state database the Ralph Loop can actually run against.
 *
 * Two initialisers, in this order, both idempotent:
 *
 *  1. the canonical state schema (`migrate` — specs, sessions, events, commands,
 *     locks, recovery, the ralph tables, the search indexes). The loop's Builder
 *     and Verifier read `specs`, so creating only the task tables would leave it
 *     half-initialised; reusing this initialiser is also what keeps the loop
 *     from carrying a second copy of the state schema.
 *  2. this module's own task schema (RALPH_LOOP_SCHEMA_SQL) plus the additive
 *     guard for the one column the canonical ralph migration spells differently
 *     (`steering_packets.payload`, which `handleFailure` writes).
 *
 * Runs under withStateDatabase() at the call site, so a file that is not a
 * SQLite database reports the shared corruption diagnostic rather than a bare
 * SqliteError from a prepared statement.
 */
export function bootstrapRalphLoopState(db: Database.Database, dbPath: string): void {
  migrate(db);

  db.exec(RALPH_LOOP_SCHEMA_SQL);

  // Additive guards, not replacements: migration 5 already shipped
  // `steering_packets` with `content`, and migrations.ts uses the same
  // ALTER TABLE ADD COLUMN pattern for tables that predate a file. Adding a
  // column keeps both readers working instead of dropping the canonical table.
  //
  //  - `steering_packets.payload`: handleFailure() writes it.
  //  - `specs.layer`: loadSpecs() filters `WHERE layer >= 3`. The canonical
  //    specs table carries tags/part but no layer, so without the column that
  //    SELECT throws `no such column: layer` and the first real task would die
  //    in the builder. Nullable and default-free on purpose: a spec with no
  //    declared layer is not a layer 3+ spec, so the query returns no rows
  //    instead of being handed an invented classification.
  addColumnIfMissing(db, 'steering_packets', 'payload', 'TEXT');
  addColumnIfMissing(db, 'specs', 'layer', 'INTEGER');

  // stderr: the loop can run next to a stdio transport, and this line is the
  // operator's only evidence that the fresh path bootstrapped rather than
  // silently idling against an empty file.
  console.error(`Ralph Loop state database ready at ${dbPath} (schema version ${getCurrentVersion(db)})`);
}

/**
 * Add a nullable column to an existing table when it is missing.
 *
 * Both the table and the column are internal literals (no user input reaches the
 * identifier position); the declaration is a fixed SQL fragment.
 */
function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  declaration: string
): void {
  const columns = (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map(
    (existing) => existing.name
  );
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${declaration}`);
  }
}

// ============================================================================
// Loop lifecycle (GAP-004: the loop used to have no exit path at all)
// ============================================================================

/** How long one idle poll waits before asking the state DB for work again. */
export const RALPH_LOOP_POLL_INTERVAL_MS = 5_000;

/**
 * Default idle bound: consecutive polls that find no pending task before the
 * loop stops itself. 360 x the default 5s poll = 30 minutes.
 *
 * `maxIdlePolls: null` disables the bound, and has to be asked for explicitly:
 * the behaviour this replaces was a loop that polled its state database every
 * 5 seconds forever after its work — and its launcher — were long gone.
 */
export const RALPH_LOOP_DEFAULT_MAX_IDLE_POLLS = 360;

/** Signals that stop the loop cleanly instead of killing the process. */
export const RALPH_LOOP_STOP_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP'] as const;

/** One of the signals the loop handles. */
export type LoopStopSignal = (typeof RALPH_LOOP_STOP_SIGNALS)[number];

/** Why a loop stopped. Logged verbatim, as `reason=<value>`, on one line. */
export type LoopExitReason = 'stopped' | 'idle-timeout' | 'launcher-gone' | `signal:${LoopStopSignal}`;

/** Operator-facing snapshot of a loop's lifecycle state. */
export interface LoopStatus {
  /** True between start() and the moment the loop stops. */
  running: boolean;
  /** Consecutive polls that returned no task (reset by every task processed). */
  idlePolls: number;
  /** True while the loop is inside its poll sleep. */
  waitingForPoll: boolean;
  /** Why the loop stopped, or null while it is running (or before it started). */
  exitReason: LoopExitReason | null;
}

/** Knobs for LoopController. Every one of them has a documented default. */
export interface LoopOptions {
  /** Milliseconds between idle polls. Default RALPH_LOOP_POLL_INTERVAL_MS (5s). */
  pollIntervalMs?: number;
  /**
   * Consecutive idle polls before the loop stops with `idle-timeout`.
   * Default RALPH_LOOP_DEFAULT_MAX_IDLE_POLLS (360 = 30 minutes at the default
   * poll interval). `null` disables the bound explicitly.
   */
  maxIdlePolls?: number | null;
  /**
   * Stop with `launcher-gone` when the process that started the loop is no
   * longer alive. Default true. Set false for a daemon that is intentionally
   * reparented (systemd unit, `nohup ... &`, a supervisor that exits).
   */
  exitOnLauncherLoss?: boolean;
  /**
   * The pid to watch as the launcher. Default: `process.ppid`, captured when
   * start() runs. Tests pass an exited pid to prove the check fires.
   */
  launcherPid?: number;
  /** Where the stop line goes. Default: stderr, via console.error. */
  log?: (line: string) => void;
}

/**
 * Does the process `pid` still exist?
 *
 * `kill(pid, 0)` sends no signal: it runs the kernel's existence/permission
 * checks only, which is the cheapest liveness probe Node exposes. EPERM means
 * the process exists but belongs to another user — alive, not dead.
 */
export function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * Has the process that started the loop gone away?
 *
 * A launcher leaves in one of two shapes, and both mean nobody is waiting for
 * this loop: the kernel reparents us (ppid changes — an orphaned `tsx
 * src/ralph-loop.ts` ends up owned by `systemd --user`), or the parent is still
 * our ppid but is no longer running. A launcher pid of 0/1 is not a usable
 * signal (we are already owned by init or a subreaper), so it reports "not
 * gone" rather than stopping every daemon immediately.
 */
export function isLauncherGone(
  launcherPid: number,
  currentPpid: number = process.ppid,
  probe: (pid: number) => boolean = isProcessAlive
): boolean {
  if (!Number.isInteger(launcherPid) || launcherPid <= 1) {
    return false;
  }
  if (currentPpid !== launcherPid) {
    return true;
  }
  return !probe(launcherPid);
}

export class LoopController {
  private db!: Database.Database;
  private builder: BuilderAgent;
  private verifier: VerifierAgent;
  private isRunning: boolean = false;
  /** Consecutive polls that returned no task; reset by every task processed. */
  private idlePolls: number = 0;
  /** Set by the first stop request (stop(), a signal, an exit path); cleared by start(). */
  private exitReason: LoopExitReason | null = null;
  /** The pending poll sleep, kept so a stop ends the wait instead of leaving a timer. */
  private pollSleep: { timer: ReturnType<typeof setTimeout>; resolve: () => void } | null = null;
  /** Live signal listeners, so a second start() cannot stack them. */
  private readonly signalHandlers = new Map<LoopStopSignal, () => void>();
  private readonly pollIntervalMs: number;
  private readonly maxIdlePolls: number | null;
  private readonly exitOnLauncherLoss: boolean;
  private readonly launcherPidOverride: number | undefined;
  private readonly log: (line: string) => void;
  /** The pid of the process that started this run, captured by beginRun(). */
  private launcherPid: number = 0;

  constructor(db: Database.Database, options: LoopOptions = {}) {
    this.db = db;
    this.builder = new BuilderAgent(db);
    this.verifier = new VerifierAgent(db);
    this.pollIntervalMs = options.pollIntervalMs ?? RALPH_LOOP_POLL_INTERVAL_MS;
    this.maxIdlePolls =
      options.maxIdlePolls === undefined ? RALPH_LOOP_DEFAULT_MAX_IDLE_POLLS : options.maxIdlePolls;
    this.exitOnLauncherLoss = options.exitOnLauncherLoss ?? true;
    this.launcherPidOverride = options.launcherPid;
    this.log = options.log ?? ((line: string) => console.error(line));
  }

  static async create(
    dbPath: string = '.speclang/speclang.db',
    options: LoopOptions = {}
  ): Promise<LoopController> {
    // QA-SPECLANG-5-R2: guarded open — the loop used to die on a raw
    // `SqliteError: file is not a database` the first time it prepared a
    // statement against a corrupt `.speclang/speclang.db`.
    //
    // QA-SPECLANG-5-R3: opening is not initialising. On a fresh project the
    // directory and every table are missing, so the first statement the loop
    // prepared died with `no such table: tasks` against a 0-byte file that
    // openStateDatabase() had happily created. Create the directory, then run
    // the schema bootstrap before the controller is handed out — a DB the loop
    // cannot prepare is reported as RalphLoopStateInitError, never as a bare
    // SqliteError from a query.
    try {
      ensureStateDirectory(dbPath);
      const db = openStateDatabase(dbPath);
      withStateDatabase(db, dbPath, () => bootstrapRalphLoopState(db, dbPath));
      return new LoopController(db, options);
    } catch (error) {
      if ((error as { code?: string } | undefined)?.code === STATE_DB_CORRUPT_CODE) {
        // The shared corruption diagnostic already names the file and the remedy.
        throw error;
      }
      throw new RalphLoopStateInitError(dbPath, error);
    }
  }

  /**
   * Run the loop until it stops, and report why.
   *
   * There are four ways out, and each one is logged on a single line as
   * `Ralph Loop stopped (reason=<value>) ...`:
   *
   *  - `signal:SIGTERM` / `signal:SIGINT` / `signal:SIGHUP` — the handler stops
   *    the loop after the current iteration, so a task in flight is never
   *    abandoned half-processed.
   *  - `launcher-gone` — the process that started the loop is no longer alive
   *    (default; `exitOnLauncherLoss: false` for an intentionally reparented
   *    daemon). This is the arm that used to leave orphans polling forever.
   *  - `idle-timeout` — `maxIdlePolls` consecutive polls found no pending task.
   *  - `stopped` — `stop()` was called.
   *
   * The promise resolves only after the signal listeners are removed, a pending
   * poll timer is cleared and the state DB is flushed, so a caller can exit
   * immediately.
   */
  async start(): Promise<LoopExitReason> {
    this.beginRun();
    let reason: LoopExitReason;
    try {
      reason = await this.runUntilStopped();
    } finally {
      this.endRun();
    }
    this.exitReason = reason;
    this.log(`Ralph Loop stopped (reason=${reason})${this.explainStop(reason)}`);
    return reason;
  }

  /**
   * Ask the loop to stop.
   *
   * Safe from outside the loop (signal handler, embedding supervisor, test):
   * the first request wins and keeps its reason, a pending poll sleep is ended
   * rather than left to fire, and the iteration in flight is allowed to finish.
   */
  stop(reason: LoopExitReason = 'stopped'): void {
    if (this.exitReason === null) {
      this.exitReason = reason;
    }
    this.isRunning = false;
    this.wakePollSleep();
  }

  /** Operator-facing snapshot of the loop's lifecycle state. */
  getStatus(): LoopStatus {
    return {
      running: this.isRunning,
      idlePolls: this.idlePolls,
      waitingForPoll: this.pollSleep !== null,
      exitReason: this.exitReason,
    };
  }

  private async runUntilStopped(): Promise<LoopExitReason> {
    while (this.isRunning) {
      const task = await this.getNextTask();

      if (!task) {
        this.idlePolls += 1;
        const reason = this.exitDueOnIdlePoll();
        if (reason) {
          return reason;
        }
        await this.sleep(this.pollIntervalMs);
        continue;
      }

      this.idlePolls = 0;
      await this.processTask(task);

      // A task can take minutes; re-check the launcher here too so a loop that
      // keeps finding work still cannot outlive the process that started it.
      if (this.launcherLost()) {
        return 'launcher-gone';
      }
    }

    // stop() or a signal stopped the loop between iterations.
    return this.exitReason ?? 'stopped';
  }

  /** Which exit is due on an idle poll, if any. */
  private exitDueOnIdlePoll(): LoopExitReason | null {
    if (this.launcherLost()) {
      return 'launcher-gone';
    }
    if (this.maxIdlePolls !== null && this.idlePolls >= this.maxIdlePolls) {
      return 'idle-timeout';
    }
    return null;
  }

  /** True when this loop has outlived the process that started it. */
  private launcherLost(): boolean {
    if (!this.exitOnLauncherLoss) {
      return false;
    }
    return isLauncherGone(this.launcherPid, process.ppid);
  }

  private beginRun(): void {
    this.isRunning = true;
    this.exitReason = null;
    this.idlePolls = 0;
    this.launcherPid = this.launcherPidOverride ?? process.ppid;
    this.installSignalHandlers();
  }

  private endRun(): void {
    this.removeSignalHandlers();
    this.wakePollSleep();
    this.isRunning = false;
    this.persistState();
  }

  private installSignalHandlers(): void {
    // Re-entrant start(): drop any previous set first, otherwise a second run
    // stacks a second listener per signal (Node warns from 11 and it leaks).
    this.removeSignalHandlers();
    for (const signal of RALPH_LOOP_STOP_SIGNALS) {
      const handler = (): void => this.stop(`signal:${signal}`);
      this.signalHandlers.set(signal, handler);
      process.on(signal, handler);
    }
  }

  private removeSignalHandlers(): void {
    for (const [signal, handler] of this.signalHandlers) {
      process.off(signal, handler);
    }
    this.signalHandlers.clear();
  }

  /** One-line detail appended to the stop log, naming why that reason fired. */
  private explainStop(reason: LoopExitReason): string {
    switch (reason) {
      case 'idle-timeout':
        return ` after ${this.idlePolls} consecutive idle polls (maxIdlePolls=${this.maxIdlePolls}, pollIntervalMs=${this.pollIntervalMs})`;
      case 'launcher-gone':
        return ` after launcher pid ${this.launcherPid} exited`;
      case 'stopped':
        return ' by stop()';
      default:
        return ` after ${reason.slice('signal:'.length)} was received`;
    }
  }

  /**
   * Flush the state database before the loop reports its exit.
   *
   * better-sqlite3 runs every statement synchronously, so task rows are already
   * durable in a rollback-journal database; WAL is the one journal mode that
   * keeps committed pages in a side file, so checkpoint it there. Best effort on
   * purpose: an exit path must not turn a clean stop into a crash.
   */
  private persistState(): void {
    try {
      const mode = String(this.db.pragma('journal_mode', { simple: true })).toLowerCase();
      if (mode === 'wal') {
        this.db.pragma('wal_checkpoint(TRUNCATE)');
      }
    } catch {
      // Best effort — see above.
    }
  }

  /**
   * Wait between idle polls, keeping the timer so a stop can end the wait.
   *
   * Leaving the timer to fire would hold the event loop open for up to one poll
   * interval after the loop has already stopped.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        if (this.pollSleep?.timer === timer) {
          this.pollSleep = null;
        }
        resolve();
      }, ms);
      this.pollSleep = { timer, resolve };
    });
  }

  /** End a pending poll sleep now, so nothing is left scheduled. */
  private wakePollSleep(): void {
    const pending = this.pollSleep;
    if (!pending) {
      return;
    }
    this.pollSleep = null;
    clearTimeout(pending.timer);
    pending.resolve();
  }

  private async getNextTask(): Promise<Task | null> {
    const stmtGetTask = this.db.prepare(`SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at LIMIT 1`);
    const task = stmtGetTask.get() as Task | null;
    return task || null;
  }

  private async processTask(task: Task) {
    // Update status
    const stmtUpdateProgress = this.db.prepare(`UPDATE tasks SET status = 'in_progress', assigned_to = 'builder' WHERE id = ?`);
    stmtUpdateProgress.run(task.id);

    // Builder phase
    const builderResult = await this.builder.execute(task);
    if (builderResult.error) {
      await this.handleFailure(task, builderResult.error);
      return;
    }

    // Verifier phase
    const verification = await this.verifier.validate(task, builderResult.output);
    if (!verification.success) {
      await this.handleFailure(task, verification.errors);
      return;
    }

    // Success
    const stmtUpdateDone = this.db.prepare(`UPDATE tasks SET status = 'done', assigned_to = NULL WHERE id = ?`);
    stmtUpdateDone.run(task.id);
  }

  private async handleFailure(task: Task, error: any) {
    // Create steering packet
    const stmtInsertSteering = this.db.prepare(`INSERT INTO steering_packets (task_id, type, payload, created_at) VALUES (?, ?, ?, ?)`);
    stmtInsertSteering.run(task.id, 'error_report', JSON.stringify({ error }), Date.now());

    // Reset task status for retry
    const stmt2 = this.db.prepare(`UPDATE tasks SET status = 'pending', assigned_to = NULL WHERE id = ?`);
    stmt2.run(task.id);
  }
}

// Block: implementation/ralph-loop/builder-agent


export class BuilderAgent {
  constructor(private db: Database.Database) {}

  async execute(task: Task): Promise<{ output: any; error?: string }> {
    try {
      // Read spec context
      const specs = await this.loadSpecs();
      
      // Determine task type
      if (task.title.includes('implementation spec')) {
        const specPath = await this.writeImplementationSpec(task);
        return { output: { specPath } };
      } else if (task.title.includes('code generation')) {
        const codeFiles = await this.generateCode(task);
        return { output: { codeFiles } };
      } else {
        return { output: null, error: `Unknown task type: ${task.title}` };
      }
    } catch (error) {
      return { output: null, error: (error as Error).message };
    }
  }

  private async loadSpecs(): Promise<any[]> {
    const stmtSelectSpecs = this.db.prepare(`SELECT * FROM specs WHERE layer >= 3`);
    const rows = stmtSelectSpecs.all();
    return rows;
  }

  private async writeImplementationSpec(task: Task): Promise<string> {
    // Implementation spec writing logic
    // Use existing patterns from specs/implementation/
    const specContent = `# speclang-header lines:8\n...`;
    const specPath = `specs/implementation/${task.id}.spec.md`;
    await writeFile(specPath, specContent);
    
    // Update SQLite
    const stmtInsertSpec = this.db.prepare(`INSERT INTO specs (file_path, id, short_desc) VALUES (?, ?, ?)`);
    stmtInsertSpec.run(specPath, `@implementation/${task.id}`, task.description);
    
    return specPath;
  }

  private async generateCode(task: Task): Promise<string[]> {
    // Code generation logic
    return [];
  }
}

// Block: implementation/ralph-loop/verifier-agent


export class VerifierAgent {
  constructor(private db: Database.Database) {}

  async validate(task: Task, output: any): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate spec format
    if (output.specPath) {
      const specErrors = await this.validateSpec(output.specPath);
      errors.push(...specErrors);
    }

    // Validate code compilation
    if (output.codeFiles) {
      const compileErrors = await this.validateCode(output.codeFiles);
      errors.push(...compileErrors);
    }

    // Validate references
    const refErrors = await this.validateReferences();
    errors.push(...refErrors);

    return {
      success: errors.length === 0,
      errors
    };
  }

  private async validateSpec(specPath: string): Promise<string[]> {
    const errors: string[] = [];
    const content = await readFile(specPath, 'utf-8');
    
    // Check for speclang-header
    if (!content.includes('# speclang-header')) {
      errors.push(`Missing speclang-header in ${specPath}`);
    }

    // Parse header lines
    const headerMatch = content.match(/# speclang-header lines:(\d+)/);
    if (headerMatch) {
      const expectedLines = parseInt(headerMatch[1]);
      const lines = content.split('\n');
      const headerEnd = lines.findIndex(line => line.trim() === '---');
      if (headerEnd !== expectedLines - 1) {
        errors.push(`Header line count mismatch in ${specPath}`);
      }
    }

    return errors;
  }

  private async validateCode(codeFiles: string[]): Promise<string[]> {
    const errors: string[] = [];
    
    for (const file of codeFiles) {
      if (file.endsWith('.ts')) {
        // TypeScript compilation check
        try {
          await execAsync(`npx tsc --noEmit ${file}`);
        } catch (error) {
          errors.push(`TypeScript compilation failed for ${file}: ${(error as any).stderr}`);
        }
      } else if (file.endsWith('.go')) {
        // Go build check
        try {
          await execAsync(`go build ${file}`);
        } catch (error) {
          errors.push(`Go compilation failed for ${file}: ${(error as any).stderr}`);
        }
      }
    }
    
    return errors;
  }

  private async validateReferences(): Promise<string[]> {
    const errors: string[] = [];
    // Check that all @ref:... point to existing IDs in SQLite
    const stmtSelectRefs = this.db.prepare(`SELECT refs FROM specs WHERE refs IS NOT NULL`);
    const refs = stmtSelectRefs.all();
    // Implementation omitted for brevity
    return errors;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

/**
 * Run the loop against the project state DB: `tsx src/ralph-loop.ts [dbPath]`.
 *
 * QA-SPECLANG-5-R2: a corrupt state DB must stop the loop before the first task
 * is read, and say what is wrong (which file, and the documented recovery step)
 * instead of surfacing a raw SqliteError from a prepared statement.
 *
 * QA-SPECLANG-5-R3: a fresh project has no state DB at all, so create() now
 * bootstraps the schema (canonical migrations + the loop's own task tables) and
 * this entry starts the loop against it. Anything that still blocks the
 * bootstrap is reported by RalphLoopStateInitError naming the file and the way
 * out.
 */
async function main(): Promise<void> {
  const dbPath = process.argv[2] ?? '.speclang/speclang.db';

  try {
    const controller = await LoopController.create(dbPath);
    // GAP-004: start() only resolves once the loop has decided to stop — on
    // SIGTERM/SIGINT/SIGHUP, on launcher loss, on the idle bound, or through
    // stop() — and it has already logged which. Every one of those is a clean
    // stop, so the exit status is 0: the point of these exit paths is that an
    // orphaned loop ends itself instead of being SIGKILLed with its state DB
    // still open.
    await controller.start();
    process.exitCode = 0;
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === STATE_DB_CORRUPT_CODE || code === RALPH_LOOP_INIT_FAILED_CODE) {
      console.error((error as Error).message);
      process.exit(1);
    }
    console.error('Ralph Loop failed:', error);
    process.exit(1);
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  void main();
}
