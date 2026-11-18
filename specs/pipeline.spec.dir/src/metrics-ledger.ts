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

import fs from 'fs';
import path from 'path';

/** Environment override for the ledger path (absolute or cwd-relative). */
export const LEDGER_ENV_VAR = 'SPECLANG_METRICS_LEDGER';

/** Default ledger location, relative to the process working directory. */
export const DEFAULT_LEDGER_RELATIVE_PATH = path.join('.speclang', 'metrics-outcomes.json');

/** Ledger schema version written into every snapshot. */
export const LEDGER_VERSION = 1;

/** Family names the renderer knows how to expose. */
export const STAGE_RESULTS_FAMILY = 'speclang_pipeline_stage_results_total';
export const RECOVERY_FAMILY = 'speclang_pipeline_recovery_total';
export const CONVERGENCE_FAMILY = 'speclang_pipeline_convergence_total';
export const STAGE_DURATION_FAMILY = 'speclang_pipeline_stage_duration_seconds';

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
export function emptyLedger(): LedgerSnapshot {
  return { version: LEDGER_VERSION, families: {}, stageDurationMs: {} };
}

/**
 * Encode a label set as a stable series key (`stage=build,status=success`,
 * keys sorted). Separators are backslash-escaped so a label value containing
 * `,` or `=` cannot break the key apart.
 */
export function encodeSeriesKey(labels: Record<string, string | number>): string {
  return Object.keys(labels)
    .sort()
    .map(key => {
      const raw = String(labels[key]).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/=/g, '\\=');
      return `${key}=${raw}`;
    })
    .join(',');
}

/** Inverse of `encodeSeriesKey`. */
export function decodeSeriesKey(key: string): Record<string, string> {
  const labels: Record<string, string> = {};
  let field = '';
  const fields: string[] = [];

  for (let i = 0; i < key.length; i++) {
    const char = key[i];
    if (char === '\\' && i + 1 < key.length) {
      field += key[i + 1];
      i++;
    } else if (char === ',') {
      fields.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field);

  for (const entry of fields) {
    const separator = entry.indexOf('=');
    if (separator === -1) continue;
    labels[entry.slice(0, separator)] = entry.slice(separator + 1);
  }

  return labels;
}

/**
 * Resolve the ledger path for this process: explicit override, then
 * `$SPECLANG_METRICS_LEDGER`, then `<cwd>/.speclang/metrics-outcomes.json`.
 */
export function resolveLedgerPath(override?: string): string {
  if (override && override.trim() !== '') return path.resolve(override);

  const fromEnv = process.env[LEDGER_ENV_VAR];
  if (fromEnv && fromEnv.trim() !== '') return path.resolve(fromEnv);

  return path.join(process.cwd(), DEFAULT_LEDGER_RELATIVE_PATH);
}

/** Coerce a parsed value into a counter: finite and non-negative, else 0. */
function toCounter(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return numeric;
}

/**
 * Normalize anything read off disk into a valid snapshot. Unknown keys are
 * dropped, so a hand-edited or truncated file can only ever lose counts, never
 * corrupt the scrape.
 */
function normalizeLedger(raw: unknown): LedgerSnapshot {
  const snapshot = emptyLedger();
  if (!raw || typeof raw !== 'object') return snapshot;

  const families = (raw as { families?: unknown }).families;
  if (families && typeof families === 'object') {
    for (const [family, series] of Object.entries(families as Record<string, unknown>)) {
      if (!series || typeof series !== 'object') continue;
      const normalized: Record<string, number> = {};
      for (const [key, value] of Object.entries(series as Record<string, unknown>)) {
        normalized[key] = toCounter(value);
      }
      snapshot.families[family] = normalized;
    }
  }

  const durations = (raw as { stageDurationMs?: unknown }).stageDurationMs;
  if (durations && typeof durations === 'object') {
    for (const [stage, entry] of Object.entries(durations as Record<string, unknown>)) {
      if (!entry || typeof entry !== 'object') continue;
      const duration = entry as Partial<StageDuration>;
      snapshot.stageDurationMs[stage] = {
        count: toCounter(duration.count),
        sum: toCounter(duration.sum),
        last: toCounter(duration.last),
      };
    }
  }

  return snapshot;
}

/**
 * Read the ledger. Never throws: a missing file, unreadable path or malformed
 * JSON all read as the empty ledger, which is exactly what a fresh install
 * serves.
 */
export function readLedger(ledgerPath?: string): LedgerSnapshot {
  const file = resolveLedgerPath(ledgerPath);

  try {
    const content = fs.readFileSync(file, 'utf-8');
    return normalizeLedger(JSON.parse(content));
  } catch {
    return emptyLedger();
  }
}

/**
 * Write atomically: a unique temp file in the same directory, then a rename.
 * A scrape running concurrently with a producer sees either the old snapshot or
 * the new one, never a half-written file.
 */
function writeLedgerAtomic(file: string, snapshot: LedgerSnapshot): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const tempFile = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    fs.writeFileSync(tempFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf-8');
    fs.renameSync(tempFile, file);
  } catch (error) {
    // Best effort: never leave a temp file behind, never throw.
    try {
      fs.unlinkSync(tempFile);
    } catch {
      /* already gone */
    }
    throw error;
  }
}

/**
 * Read-modify-write helper. Returns false (and swallows the error) when the
 * ledger cannot be written, so instrumentation never changes control flow.
 */
function mutateLedger(mutator: (snapshot: LedgerSnapshot) => void, ledgerPath?: string): boolean {
  const file = resolveLedgerPath(ledgerPath);

  try {
    const snapshot = readLedger(file);
    mutator(snapshot);
    snapshot.version = LEDGER_VERSION;
    writeLedgerAtomic(file, snapshot);
    return true;
  } catch {
    return false;
  }
}

/** Add `delta` to one counter series (monotonic: deltas are non-negative). */
export function recordCounter(
  family: string,
  labels: Record<string, string | number>,
  delta: number = 1,
  ledgerPath?: string
): boolean {
  const increment = Number.isFinite(delta) && delta > 0 ? delta : 1;
  const key = encodeSeriesKey(labels);

  return mutateLedger(snapshot => {
    const series = snapshot.families[family] ?? {};
    series[key] = toCounter(series[key]) + increment;
    snapshot.families[family] = series;
  }, ledgerPath);
}

/**
 * Record one completed `StageResult`: a `stage_results_total{stage,status}`
 * increment plus the stage's duration sample.
 */
export function recordStageOutcome(
  stage: string,
  status: StageStatus,
  durationMs: number,
  ledgerPath?: string
): boolean {
  const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0;

  return mutateLedger(snapshot => {
    const stageName = stage || 'unnamed';
    const series = snapshot.families[STAGE_RESULTS_FAMILY] ?? {};
    const key = encodeSeriesKey({ stage: stageName, status });
    series[key] = toCounter(series[key]) + 1;
    snapshot.families[STAGE_RESULTS_FAMILY] = series;

    const current = snapshot.stageDurationMs[stageName] ?? { count: 0, sum: 0, last: 0 };
    snapshot.stageDurationMs[stageName] = {
      count: current.count + 1,
      sum: current.sum + duration,
      last: duration,
    };
  }, ledgerPath);
}

/** Record one recovery action outcome. */
export function recordRecoveryOutcome(outcome: RecoveryOutcome, ledgerPath?: string): boolean {
  return recordCounter(RECOVERY_FAMILY, { outcome }, 1, ledgerPath);
}

/** Record one convergence outcome. */
export function recordConvergenceOutcome(outcome: ConvergenceOutcome, ledgerPath?: string): boolean {
  return recordCounter(CONVERGENCE_FAMILY, { outcome }, 1, ledgerPath);
}
