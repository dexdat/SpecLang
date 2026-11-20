"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGE_DURATION_FAMILY = exports.CONVERGENCE_FAMILY = exports.RECOVERY_FAMILY = exports.STAGE_RESULTS_FAMILY = exports.LEDGER_VERSION = exports.DEFAULT_LEDGER_RELATIVE_PATH = exports.LEDGER_ENV_VAR = void 0;
exports.emptyLedger = emptyLedger;
exports.encodeSeriesKey = encodeSeriesKey;
exports.decodeSeriesKey = decodeSeriesKey;
exports.resolveLedgerPath = resolveLedgerPath;
exports.readLedger = readLedger;
exports.recordCounter = recordCounter;
exports.recordStageOutcome = recordStageOutcome;
exports.recordRecoveryOutcome = recordRecoveryOutcome;
exports.recordConvergenceOutcome = recordConvergenceOutcome;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/** Environment override for the ledger path (absolute or cwd-relative). */
exports.LEDGER_ENV_VAR = 'SPECLANG_METRICS_LEDGER';
/** Default ledger location, relative to the process working directory. */
exports.DEFAULT_LEDGER_RELATIVE_PATH = path_1.default.join('.speclang', 'metrics-outcomes.json');
/** Ledger schema version written into every snapshot. */
exports.LEDGER_VERSION = 1;
/** Family names the renderer knows how to expose. */
exports.STAGE_RESULTS_FAMILY = 'speclang_pipeline_stage_results_total';
exports.RECOVERY_FAMILY = 'speclang_pipeline_recovery_total';
exports.CONVERGENCE_FAMILY = 'speclang_pipeline_convergence_total';
exports.STAGE_DURATION_FAMILY = 'speclang_pipeline_stage_duration_seconds';
/** An empty ledger: what a missing or corrupt file reads as. */
function emptyLedger() {
    return { version: exports.LEDGER_VERSION, families: {}, stageDurationMs: {} };
}
/**
 * Encode a label set as a stable series key (`stage=build,status=success`,
 * keys sorted). Separators are backslash-escaped so a label value containing
 * `,` or `=` cannot break the key apart.
 */
function encodeSeriesKey(labels) {
    return Object.keys(labels)
        .sort()
        .map(key => {
        const raw = String(labels[key]).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/=/g, '\\=');
        return `${key}=${raw}`;
    })
        .join(',');
}
/** Inverse of `encodeSeriesKey`. */
function decodeSeriesKey(key) {
    const labels = {};
    let field = '';
    const fields = [];
    for (let i = 0; i < key.length; i++) {
        const char = key[i];
        if (char === '\\' && i + 1 < key.length) {
            field += key[i + 1];
            i++;
        }
        else if (char === ',') {
            fields.push(field);
            field = '';
        }
        else {
            field += char;
        }
    }
    fields.push(field);
    for (const entry of fields) {
        const separator = entry.indexOf('=');
        if (separator === -1)
            continue;
        labels[entry.slice(0, separator)] = entry.slice(separator + 1);
    }
    return labels;
}
/**
 * Resolve the ledger path for this process: explicit override, then
 * `$SPECLANG_METRICS_LEDGER`, then `<cwd>/.speclang/metrics-outcomes.json`.
 */
function resolveLedgerPath(override) {
    if (override && override.trim() !== '')
        return path_1.default.resolve(override);
    const fromEnv = process.env[exports.LEDGER_ENV_VAR];
    if (fromEnv && fromEnv.trim() !== '')
        return path_1.default.resolve(fromEnv);
    return path_1.default.join(process.cwd(), exports.DEFAULT_LEDGER_RELATIVE_PATH);
}
/** Coerce a parsed value into a counter: finite and non-negative, else 0. */
function toCounter(value) {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric) || numeric < 0)
        return 0;
    return numeric;
}
/**
 * Normalize anything read off disk into a valid snapshot. Unknown keys are
 * dropped, so a hand-edited or truncated file can only ever lose counts, never
 * corrupt the scrape.
 */
function normalizeLedger(raw) {
    const snapshot = emptyLedger();
    if (!raw || typeof raw !== 'object')
        return snapshot;
    const families = raw.families;
    if (families && typeof families === 'object') {
        for (const [family, series] of Object.entries(families)) {
            if (!series || typeof series !== 'object')
                continue;
            const normalized = {};
            for (const [key, value] of Object.entries(series)) {
                normalized[key] = toCounter(value);
            }
            snapshot.families[family] = normalized;
        }
    }
    const durations = raw.stageDurationMs;
    if (durations && typeof durations === 'object') {
        for (const [stage, entry] of Object.entries(durations)) {
            if (!entry || typeof entry !== 'object')
                continue;
            const duration = entry;
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
function readLedger(ledgerPath) {
    const file = resolveLedgerPath(ledgerPath);
    try {
        const content = fs_1.default.readFileSync(file, 'utf-8');
        return normalizeLedger(JSON.parse(content));
    }
    catch {
        return emptyLedger();
    }
}
/**
 * Write atomically: a unique temp file in the same directory, then a rename.
 * A scrape running concurrently with a producer sees either the old snapshot or
 * the new one, never a half-written file.
 */
function writeLedgerAtomic(file, snapshot) {
    fs_1.default.mkdirSync(path_1.default.dirname(file), { recursive: true });
    const tempFile = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
        fs_1.default.writeFileSync(tempFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf-8');
        fs_1.default.renameSync(tempFile, file);
    }
    catch (error) {
        // Best effort: never leave a temp file behind, never throw.
        try {
            fs_1.default.unlinkSync(tempFile);
        }
        catch {
            /* already gone */
        }
        throw error;
    }
}
/**
 * Read-modify-write helper. Returns false (and swallows the error) when the
 * ledger cannot be written, so instrumentation never changes control flow.
 */
function mutateLedger(mutator, ledgerPath) {
    const file = resolveLedgerPath(ledgerPath);
    try {
        const snapshot = readLedger(file);
        mutator(snapshot);
        snapshot.version = exports.LEDGER_VERSION;
        writeLedgerAtomic(file, snapshot);
        return true;
    }
    catch {
        return false;
    }
}
/** Add `delta` to one counter series (monotonic: deltas are non-negative). */
function recordCounter(family, labels, delta = 1, ledgerPath) {
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
function recordStageOutcome(stage, status, durationMs, ledgerPath) {
    const duration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0;
    return mutateLedger(snapshot => {
        const stageName = stage || 'unnamed';
        const series = snapshot.families[exports.STAGE_RESULTS_FAMILY] ?? {};
        const key = encodeSeriesKey({ stage: stageName, status });
        series[key] = toCounter(series[key]) + 1;
        snapshot.families[exports.STAGE_RESULTS_FAMILY] = series;
        const current = snapshot.stageDurationMs[stageName] ?? { count: 0, sum: 0, last: 0 };
        snapshot.stageDurationMs[stageName] = {
            count: current.count + 1,
            sum: current.sum + duration,
            last: duration,
        };
    }, ledgerPath);
}
/** Record one recovery action outcome. */
function recordRecoveryOutcome(outcome, ledgerPath) {
    return recordCounter(exports.RECOVERY_FAMILY, { outcome }, 1, ledgerPath);
}
/** Record one convergence outcome. */
function recordConvergenceOutcome(outcome, ledgerPath) {
    return recordCounter(exports.CONVERGENCE_FAMILY, { outcome }, 1, ledgerPath);
}
//# sourceMappingURL=metrics-ledger.js.map