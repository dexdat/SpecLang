import Database from 'better-sqlite3';
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
export declare const RALPH_LOOP_SCHEMA_SQL = "\nCREATE TABLE IF NOT EXISTS tasks (\n  id TEXT PRIMARY KEY,\n  title TEXT NOT NULL,\n  description TEXT,\n  status TEXT NOT NULL DEFAULT 'pending',\n  assigned_to TEXT,\n  created_at INTEGER NOT NULL,\n  updated_at INTEGER NOT NULL\n);\n\nCREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);\nCREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);\n";
/** Stable, machine-checkable code for "the loop could not prepare its state DB". */
export declare const RALPH_LOOP_INIT_FAILED_CODE = "RALPH_LOOP_INIT_FAILED";
/**
 * Thrown when the loop cannot prepare its state database (unwritable path, a
 * directory it may not create, a file that failed setup deeper than the opener's
 * probe). The message names the file and the way out: the failure this replaces
 * was a bare `SqliteError: no such table: tasks` that named neither.
 */
export declare class RalphLoopStateInitError extends Error {
    /** Stable, machine-checkable error code (see RALPH_LOOP_INIT_FAILED_CODE). */
    code: typeof RALPH_LOOP_INIT_FAILED_CODE;
    /** The state database file the loop could not prepare. */
    filePath: string;
    /** The original error, kept for diagnostics. */
    cause?: unknown;
    constructor(filePath: string, cause?: unknown);
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
export declare function bootstrapRalphLoopState(db: Database.Database, dbPath: string): void;
/** How long one idle poll waits before asking the state DB for work again. */
export declare const RALPH_LOOP_POLL_INTERVAL_MS = 5000;
/**
 * Default idle bound: consecutive polls that find no pending task before the
 * loop stops itself. 360 x the default 5s poll = 30 minutes.
 *
 * `maxIdlePolls: null` disables the bound, and has to be asked for explicitly:
 * the behaviour this replaces was a loop that polled its state database every
 * 5 seconds forever after its work — and its launcher — were long gone.
 */
export declare const RALPH_LOOP_DEFAULT_MAX_IDLE_POLLS = 360;
/** Signals that stop the loop cleanly instead of killing the process. */
export declare const RALPH_LOOP_STOP_SIGNALS: readonly ['SIGTERM', 'SIGINT', 'SIGHUP'];
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
export declare function isProcessAlive(pid: number): boolean;
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
export declare function isLauncherGone(launcherPid: number, currentPpid?: number, probe?: (pid: number) => boolean): boolean;
export declare class LoopController {
    private db;
    private builder;
    private verifier;
    private isRunning;
    /** Consecutive polls that returned no task; reset by every task processed. */
    private idlePolls;
    /** Set by the first stop request (stop(), a signal, an exit path); cleared by start(). */
    private exitReason;
    /** The pending poll sleep, kept so a stop ends the wait instead of leaving a timer. */
    private pollSleep;
    /** Live signal listeners, so a second start() cannot stack them. */
    private readonly signalHandlers;
    private readonly pollIntervalMs;
    private readonly maxIdlePolls;
    private readonly exitOnLauncherLoss;
    private readonly launcherPidOverride;
    private readonly log;
    /** The pid of the process that started this run, captured by beginRun(). */
    private launcherPid;
    constructor(db: Database.Database, options?: LoopOptions);
    static create(dbPath?: string, options?: LoopOptions): Promise<LoopController>;
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
    start(): Promise<LoopExitReason>;
    /**
     * Ask the loop to stop.
     *
     * Safe from outside the loop (signal handler, embedding supervisor, test):
     * the first request wins and keeps its reason, a pending poll sleep is ended
     * rather than left to fire, and the iteration in flight is allowed to finish.
     */
    stop(reason?: LoopExitReason): void;
    /** Operator-facing snapshot of the loop's lifecycle state. */
    getStatus(): LoopStatus;
    private runUntilStopped;
    /** Which exit is due on an idle poll, if any. */
    private exitDueOnIdlePoll;
    /** True when this loop has outlived the process that started it. */
    private launcherLost;
    private beginRun;
    private endRun;
    private installSignalHandlers;
    private removeSignalHandlers;
    /** One-line detail appended to the stop log, naming why that reason fired. */
    private explainStop;
    /**
     * Flush the state database before the loop reports its exit.
     *
     * better-sqlite3 runs every statement synchronously, so task rows are already
     * durable in a rollback-journal database; WAL is the one journal mode that
     * keeps committed pages in a side file, so checkpoint it there. Best effort on
     * purpose: an exit path must not turn a clean stop into a crash.
     */
    private persistState;
    /**
     * Wait between idle polls, keeping the timer so a stop can end the wait.
     *
     * Leaving the timer to fire would hold the event loop open for up to one poll
     * interval after the loop has already stopped.
     */
    private sleep;
    /** End a pending poll sleep now, so nothing is left scheduled. */
    private wakePollSleep;
    private getNextTask;
    private processTask;
    private handleFailure;
}
export declare class BuilderAgent {
    private db;
    constructor(db: Database.Database);
    execute(task: Task): Promise<{
        output: any;
        error?: string;
    }>;
    private loadSpecs;
    private writeImplementationSpec;
    private generateCode;
}
export declare class VerifierAgent {
    private db;
    constructor(db: Database.Database);
    validate(task: Task, output: any): Promise<{
        success: boolean;
        errors: string[];
    }>;
    private validateSpec;
    private validateCode;
    private validateReferences;
}
//# sourceMappingURL=ralph-loop.d.ts.map