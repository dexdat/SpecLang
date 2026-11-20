/**
 * Pipeline Outcome Ledger — cross-process outcome counters for `/metrics`
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/metrics
 *
 * OBS-2: the pipeline executor, the recovery executor and the daemon that
 * drives them run in a DIFFERENT process from the MCP HTTP server that answers
 * the `/metrics` scrape (`node bin/speclang start` for the daemon,
 * `speclang-mcp start --http` for the server). In-memory counters can never
 * show a delta across that boundary, so the outcomes those producers compute —
 * `StageResult`, recovery actions and convergence — are persisted to a small
 * JSON ledger on disk and merged into the scrape by the renderer.
 *
 * Contract:
 * - path: `$SPECLANG_METRICS_LEDGER`, else `<cwd>/.speclang/metrics-outcomes.json`
 * - atomic writes (temp file + rename), so a scrape never reads a torn file
 * - crash tolerant: a missing, unparsable or wrongly-shaped ledger reads as an
 *   EMPTY ledger — never an exception, never a fabricated count
 * - monotonic: counters only ever increase (read-modify-write with a delta)
 * - side-effect only: every recorder is best-effort, so an unwritable ledger is
 *   a silent no-op rather than a change in pipeline control flow
 */
/** Environment override for the ledger path (absolute or cwd-relative). */
export declare const LEDGER_ENV_VAR = "SPECLANG_METRICS_LEDGER";
/** Default ledger location, relative to the process working directory. */
export declare const DEFAULT_LEDGER_RELATIVE_PATH: any;
/** Ledger schema version written into every snapshot. */
export declare const LEDGER_VERSION = 1;
/** Family names the renderer knows how to expose. */
export declare const STAGE_RESULTS_FAMILY = "speclang_pipeline_stage_results_total";
export declare const RECOVERY_FAMILY = "speclang_pipeline_recovery_total";
export declare const CONVERGENCE_FAMILY = "speclang_pipeline_convergence_total";
export declare const STAGE_DURATION_FAMILY = "speclang_pipeline_stage_duration_seconds";
/** Terminal status a stage execution can report. */
export type StageStatus = 'success' | 'failure' | 'skipped';
/** Outcome a recovery action reports. */
export type RecoveryOutcome = 'succeeded' | 'failed';
/** Outcome a convergence detection reports. */
export type ConvergenceOutcome = 'converged' | 'not_converged';
/**
 * Per-stage duration accumulator. `last` is what the gauge renders; `count` and
 * `sum` are kept so an average can be derived without a second ledger.
 */
export interface StageDuration {
    count: number;
    sum: number;
    last: number;
}
/**
 * Ledger snapshot. Counter series are keyed family -> encoded label set ->
 * value; the label set is encoded once (see `encodeSeriesKey`) so the on-disk
 * shape stays flat and diffable.
 */
export interface LedgerSnapshot {
    version: number;
    families: Record<string, Record<string, number>>;
    stageDurationMs: Record<string, StageDuration>;
}
/** An empty ledger: what a missing or corrupt file reads as. */
export declare function emptyLedger(): LedgerSnapshot;
/**
 * Encode a label set as a stable series key (`stage=build,status=success`,
 * keys sorted). Separators are backslash-escaped so a label value containing
 * `,` or `=` cannot break the key apart.
 */
export declare function encodeSeriesKey(labels: Record<string, string | number>): string;
/** Inverse of `encodeSeriesKey`. */
export declare function decodeSeriesKey(key: string): Record<string, string>;
/**
 * Resolve the ledger path for this process: explicit override, then
 * `$SPECLANG_METRICS_LEDGER`, then `<cwd>/.speclang/metrics-outcomes.json`.
 */
export declare function resolveLedgerPath(override?: string): string;
/**
 * Read the ledger. Never throws: a missing file, unreadable path or malformed
 * JSON all read as the empty ledger, which is exactly what a fresh install
 * serves.
 */
export declare function readLedger(ledgerPath?: string): LedgerSnapshot;
/** Add `delta` to one counter series (monotonic: deltas are non-negative). */
export declare function recordCounter(family: string, labels: Record<string, string | number>, delta?: number, ledgerPath?: string): boolean;
/**
 * Record one completed `StageResult`: a `stage_results_total{stage,status}`
 * increment plus the stage's duration sample.
 */
export declare function recordStageOutcome(stage: string, status: StageStatus, durationMs: number, ledgerPath?: string): boolean;
/** Record one recovery action outcome. */
export declare function recordRecoveryOutcome(outcome: RecoveryOutcome, ledgerPath?: string): boolean;
/** Record one convergence outcome. */
export declare function recordConvergenceOutcome(outcome: ConvergenceOutcome, ledgerPath?: string): boolean;
//# sourceMappingURL=metrics-ledger.d.ts.map