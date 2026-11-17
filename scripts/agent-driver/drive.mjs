#!/usr/bin/env node
/**
 * drive.mjs — hardened driver for running one SpecLang cascade from a seed spec.
 *
 * An agent session (the "driver") writes ONE seed spec file; this script runs
 * the cascade on it and refuses to report success unless the loop really
 * produced artifacts. It exists because `speclang cascade` exits 0 even when it
 * generates nothing (a spec with no usable code blocks prints a warning and
 * still succeeds), which is indistinguishable from a working loop if the
 * driver only looks at the exit code.
 *
 * Stages: preflight -> validate -> cascade -> verify -> recheck -> record.
 * Each stage is recorded with its command, exit code and duration, and the
 * record is written to <run-dir>/progress.json + progress.jsonl (+ progress.md).
 *
 * Exit codes:
 *   0  the loop completed: at least one artifact, all non-empty, converged
 *   1  the loop ran but its result is not acceptable (contract failure)
 *   2  the driver could not run (bad arguments, missing build, missing seed)
 *
 * Usage:
 *   node scripts/agent-driver/drive.mjs --seed <path> [options]
 *
 * Options:
 *   --seed <path>      single-seed spec file (required)
 *   --run-dir <path>   where the progress record lands (default: the seed dir)
 *   --skip-validate    skip the validate stage
 *   --no-recheck       skip the determinism re-run of the cascade
 *   --json             print the progress record as JSON instead of a table
 *   --quiet            suppress per-stage human progress lines
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const CLI = process.env.SPECLANG_BIN || path.join(REPO_ROOT, 'bin', 'speclang');
const BUILT_CASCADE = path.join(REPO_ROOT, 'dist', 'src', 'cascade', 'index.js');

/** Block declaration in a seed spec: `### @block::<name> @kind:<kind>`. */
const BLOCK_RE = /^###\s+@block::(\S+)\s+@kind:(\S+)\s*$/;
/** The auto-generated banner the cascade prepends to every artifact. */
const GENERATED_HEADER_RE =
  /^\/\*\*\n \* Auto-generated(?: test)? by SpecLang\n[\s\S]*?\*\/\n\n?/;

function fail(message, code = 2) {
  console.error(`❌ agent-driver: ${message}`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = {
    seed: undefined,
    runDir: undefined,
    validate: true,
    recheck: true,
    json: false,
    quiet: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--seed') {
      args.seed = argv[++i];
      if (!args.seed) fail('--seed requires a path');
    } else if (a === '--run-dir') {
      args.runDir = argv[++i];
      if (!args.runDir) fail('--run-dir requires a path');
    } else if (a === '--skip-validate') {
      args.validate = false;
    } else if (a === '--no-recheck') {
      args.recheck = false;
    } else if (a === '--json') {
      args.json = true;
    } else if (a === '--quiet') {
      args.quiet = true;
    } else if (a === '-h' || a === '--help') {
      console.log(
        'Usage: node scripts/agent-driver/drive.mjs --seed <path> ' +
          '[--run-dir <dir>] [--skip-validate] [--no-recheck] [--json] [--quiet]'
      );
      process.exit(0);
    } else {
      fail(`unknown argument: ${a}`);
    }
  }
  if (!args.seed) fail('--seed is required (a single-seed spec file)');
  return args;
}

function rel(p) {
  const r = path.relative(REPO_ROOT, p);
  return r.startsWith('..') ? p : r;
}

/** Run a command, returning its result without throwing on non-zero exit. */
function run(command, commandArgs, options = {}) {
  const startedAt = process.hrtime.bigint();
  const result = spawnSync(command, commandArgs, {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    maxBuffer: 32 * 1024 * 1024,
    env: process.env,
    ...options,
  });
  const durationMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n);
  const exitCode = result.status === null ? 1 : result.status;
  return {
    exitCode,
    durationMs,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error,
  };
}

/** Invoke the repo CLI. Handles a checkout where bin/speclang lost its +x bit. */
function runCli(cliArgs, options = {}) {
  let executable = CLI;
  let args = cliArgs;
  try {
    const mode = fs.statSync(CLI).mode;
    if ((mode & 0o111) === 0) {
      executable = process.execPath;
      args = [CLI, ...cliArgs];
    }
  } catch {
    fail(`SpecLang CLI not found at ${CLI} (set SPECLANG_BIN to override)`);
  }
  return run(executable, args, options);
}

/** The seed's block list, split into blocks that can become artifacts and ones that cannot. */
function parseSeedBlocks(seedText) {
  const blocks = [];
  for (const line of seedText.split('\n')) {
    const m = line.match(BLOCK_RE);
    if (m) blocks.push({ name: m[1], kind: m[2] });
  }
  return blocks;
}

/** Artifact name the cascade derives from a block name. */
function artifactNameFor(block) {
  const stem = block.name.replace(/-/g, '_');
  return block.kind === 'test' ? `${stem}.test.ts` : `${stem}.ts`;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function stripGeneratedHeader(text) {
  return text.replace(GENERATED_HEADER_RE, '');
}

/** Paths the CLI reported generating, from its own `   - <path>` lines. */
function parseReportedArtifacts(stdout) {
  const reported = [];
  for (const line of stdout.split('\n')) {
    const m = line.match(/^\s+- (\S.*)$/);
    if (m) reported.push(m[1].trim());
  }
  return reported;
}

function parseReportedCount(stdout) {
  const m = stdout.match(/^\s+Generated: (\d+) files$/m);
  return m ? Number(m[1]) : null;
}

function parseConverged(stdout) {
  const m = stdout.match(/^\s+Converged: (Yes|No)$/m);
  return m ? m[1] === 'Yes' : null;
}

/**
 * Test counts from `cascade -v` (`[Cascade] Tests: <passed>/<total> passed`).
 *
 * The cascade treats `total === 0` as converged, so a seed whose test block
 * was never collected still reports "Converged: Yes". Only the verbose line
 * distinguishes "tests passed" from "no tests ran at all".
 */
function parseTestCounts(stdout) {
  const m = stdout.match(/\[Cascade\] Tests: (\d+)\/(\d+) passed/);
  return m ? { passed: Number(m[1]), total: Number(m[2]) } : null;
}

/** Collect the per-artifact facts the progress record carries. */
function collectArtifacts(reportedPaths) {
  return reportedPaths.map((p) => {
    const abs = path.isAbsolute(p) ? p : path.resolve(REPO_ROOT, p);
    const exists = fs.existsSync(abs);
    const bytes = exists ? fs.statSync(abs).size : 0;
    const text = exists ? fs.readFileSync(abs, 'utf-8') : '';
    const body = stripGeneratedHeader(text).trim();
    return {
      path: rel(abs),
      absolute_path: abs,
      bytes,
      body_bytes: Buffer.byteLength(body, 'utf-8'),
      sha256: exists ? sha256(fs.readFileSync(abs)) : null,
      exists,
    };
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const seedPath = path.resolve(process.cwd(), args.seed);
  const seedDir = path.dirname(seedPath);
  const runDir = args.runDir ? path.resolve(args.runDir) : seedDir;
  const generatedDir = path.resolve(seedDir, '..', 'generated');
  const startedAt = new Date().toISOString();
  const stages = [];
  const warnings = [];

  const say = (line) => {
    // `--json` owns stdout: a machine reader must be able to `JSON.parse` the
    // whole stream (same rule `speclang validate --format json` follows).
    if (!args.quiet && !args.json) console.log(line);
  };
  const record = (stage) => {
    stages.push(stage);
    return stage;
  };

  // ---- Stage 0: preflight --------------------------------------------------
  const preflightProblems = [];
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (!Number.isFinite(nodeMajor) || nodeMajor < 18) {
    preflightProblems.push(`node ${process.versions.node} is older than the >=18 engine floor`);
  }
  if (!fs.existsSync(seedPath)) preflightProblems.push(`seed not found: ${seedPath}`);
  if (!fs.existsSync(BUILT_CASCADE)) {
    preflightProblems.push('dist/ is missing — run `npm run build` first');
  }
  record({
    name: 'preflight',
    command: 'node --version && test -f dist/src/cascade/index.js',
    exit_code: preflightProblems.length === 0 ? 0 : 1,
    duration_ms: 0,
    detail: preflightProblems.length === 0 ? `node ${process.versions.node}` : preflightProblems.join('; '),
  });
  if (preflightProblems.length > 0) fail(preflightProblems.join('; '));

  const seedText = fs.readFileSync(seedPath, 'utf-8');
  const blocks = parseSeedBlocks(seedText);
  if (blocks.length === 0) {
    fail(`seed has no blocks: expected at least one "### @block::<name> @kind:<kind>" line in ${seedPath}`);
  }
  say(`🔁 agent-driver: ${rel(seedPath)} (${blocks.length} block(s))`);

  // ---- Stage 1: validate ---------------------------------------------------
  if (args.validate) {
    const v = runCli(['validate', seedPath]);
    record({
      name: 'validate',
      command: `${rel(CLI)} validate ${rel(seedPath)}`,
      exit_code: v.exitCode,
      duration_ms: v.durationMs,
      detail: v.exitCode === 0 ? 'seed parsed and passed' : (v.stderr || v.stdout).trim().split('\n').slice(-3).join(' | '),
    });
    if (v.exitCode !== 0) {
      finish({ ok: false, reason: 'validate stage failed', stages, artifacts: [], warnings, args, seedPath, generatedDir, runDir, startedAt });
    }
    say(`   validate  exit 0 (${v.durationMs} ms)`);
  } else {
    record({ name: 'validate', command: '(skipped)', exit_code: 0, duration_ms: 0, detail: '--skip-validate' });
    say('   validate  skipped');
  }

  // ---- Stage 2: cascade ----------------------------------------------------
  // `-v` is required, not cosmetic: it is the only place the cascade prints
  // whether the generated test files actually RAN (see parseTestCounts).
  const c = runCli(['cascade', '-v', seedPath]);
  const reported = parseReportedArtifacts(c.stdout);
  const reportedCount = parseReportedCount(c.stdout);
  const converged = parseConverged(c.stdout);
  const tests = parseTestCounts(c.stdout);
  const testBlocks = blocks.filter((b) => b.kind === 'test');
  const testsLabel = tests
    ? `${tests.passed}/${tests.total}`
    : testBlocks.length === 0
      ? 'none (no test blocks)'
      : 'unparsed';
  record({
    name: 'cascade',
    command: `${rel(CLI)} cascade -v ${rel(seedPath)}`,
    exit_code: c.exitCode,
    duration_ms: c.durationMs,
    detail:
      c.exitCode === 0
        ? `reported ${reportedCount ?? 'unknown'} file(s), converged=${String(converged)}, tests=${testsLabel}`
        : (c.stderr || c.stdout).trim().split('\n').slice(-3).join(' | '),
  });
  if (c.exitCode !== 0) {
    finish({ ok: false, reason: 'cascade stage exited non-zero', stages, artifacts: [], warnings, args, seedPath, generatedDir, runDir, startedAt });
  }
  say(`   cascade   exit 0 (${c.durationMs} ms), reported ${reportedCount ?? '?'} file(s)`);

  // ---- Stage 3: verify -----------------------------------------------------
  // `speclang cascade` succeeds with zero files; that is the failure this
  // stage exists to catch. Everything asserted here is checked against the
  // CLI's OWN report plus the bytes on disk — never against an assumption.
  const artifacts = collectArtifacts(reported);
  const problems = [];
  if (reported.length === 0) {
    problems.push(
      'cascade reported no artifacts (exit 0 with zero files is a no-op, not a pass)'
    );
  }
  if (reportedCount !== null && reportedCount !== reported.length) {
    problems.push(`CLI claimed ${reportedCount} file(s) but listed ${reported.length}`);
  }
  if (converged === false) {
    problems.push('cascade reported Converged: No');
  }
  // A test block that vitest never collected reports "Converged: Yes" on a
  // 0/0 run — the same vacuous pass as generating nothing. Treat it as a
  // failure so the driver fixes the seed's location instead of trusting it.
  if (testBlocks.length > 0) {
    if (!tests) {
      problems.push('seed declares test block(s) but the cascade printed no test counts');
    } else if (tests.total === 0) {
      problems.push(
        'test block(s) were generated but 0 tests executed — "converged" is vacuous; ' +
          'place the seed so <seed-dir>/../generated lands inside vitest\'s include (tests/**)'
      );
    } else if (tests.passed < tests.total) {
      problems.push(`${tests.total - tests.passed} of ${tests.total} generated test(s) failed`);
    }
  }
  for (const a of artifacts) {
    if (!a.exists) problems.push(`reported artifact missing on disk: ${a.path}`);
    else if (a.bytes === 0) problems.push(`artifact is empty: ${a.path}`);
    else if (a.body_bytes === 0) {
      problems.push(`artifact carries only the generated banner, no body: ${a.path}`);
    }
  }
  // Blocks the cascade silently skips (a non-code `@kind`, or a code block
  // with no fenced body) are the driver's business: warn so the next seed is
  // better, but do not fail a loop that produced real artifacts.
  const producedStems = new Set(artifacts.map((a) => path.basename(a.path)));
  for (const block of blocks) {
    if (!producedStems.has(artifactNameFor(block))) {
      warnings.push(`block ${block.name} (kind:${block.kind}) produced no artifact`);
    }
  }
  // Files in the output dir the CLI did NOT report are leftovers from an
  // earlier seed — a count that includes them overstates this run.
  const stray = [];
  if (fs.existsSync(generatedDir)) {
    for (const entry of fs.readdirSync(generatedDir, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const abs = path.join(entry.parentPath ?? entry.path, entry.name);
      const normalized = path.resolve(abs);
      if (!artifacts.some((a) => a.absolute_path === normalized)) stray.push(rel(normalized));
    }
  }
  if (stray.length > 0) {
    warnings.push(`${stray.length} file(s) in ${rel(generatedDir)} not produced by this run: ${stray.join(', ')}`);
  }
  record({
    name: 'verify',
    command: '(internal: CLI report + on-disk bytes)',
    exit_code: problems.length === 0 ? 0 : 1,
    duration_ms: 0,
    detail:
      problems.length === 0
        ? `${artifacts.length}/${artifacts.length} artifact(s) exist and carry a body` +
          (testBlocks.length > 0 ? `; ${tests.passed}/${tests.total} generated test(s) passed` : '')
        : problems.join('; '),
  });
  if (problems.length > 0) {
    finish({ ok: false, reason: problems.join('; '), stages, artifacts, warnings, args, seedPath, generatedDir, runDir, startedAt });
  }
  for (const w of warnings) say(`   ⚠️  ${w}`);
  say(`   verify    ${artifacts.length} artifact(s), all with a non-empty body`);

  // ---- Stage 4: recheck (determinism) -------------------------------------
  // A driver that cannot re-run the cascade cannot tell a reproducible build
  // from one that drifted. Re-run and require the identical artifact set.
  if (args.recheck) {
    const before = new Map(artifacts.map((a) => [a.absolute_path, a.sha256]));
    const again = runCli(['cascade', seedPath]);
    const againArtifacts = collectArtifacts(parseReportedArtifacts(again.stdout));
    const drift = [];
    if (again.exitCode !== 0) drift.push(`re-run exited ${again.exitCode}`);
    const after = new Map(againArtifacts.map((a) => [a.absolute_path, a.sha256]));
    for (const [p, hash] of before) {
      if (!after.has(p)) drift.push(`missing on re-run: ${rel(p)}`);
      else if (after.get(p) !== hash) drift.push(`content changed on re-run: ${rel(p)}`);
    }
    for (const p of after.keys()) if (!before.has(p)) drift.push(`new on re-run: ${rel(p)}`);
    record({
      name: 'recheck',
      command: `${rel(CLI)} cascade ${rel(seedPath)} (second run)`,
      exit_code: drift.length === 0 ? 0 : 1,
      duration_ms: again.durationMs,
      detail:
        drift.length === 0
          ? `${after.size} artifact(s) byte-identical across two runs`
          : drift.join('; '),
    });
    if (drift.length > 0) {
      finish({ ok: false, reason: `cascade is not reproducible: ${drift.join('; ')}`, stages, artifacts, warnings, args, seedPath, generatedDir, runDir, startedAt });
    }
    say(`   recheck   byte-identical across two runs (${again.durationMs} ms)`);
  } else {
    record({ name: 'recheck', command: '(skipped)', exit_code: 0, duration_ms: 0, detail: '--no-recheck' });
  }

  // ---- Stage 5: record -----------------------------------------------------
  finish({ ok: true, reason: null, stages, artifacts, warnings, args, seedPath, generatedDir, runDir, startedAt });
}

/** Write the per-stage progress record and exit with the matching code. */
function finish(outcome) {
  const { ok, reason, stages, artifacts, warnings, args, seedPath, generatedDir, runDir, startedAt } = outcome;
  const finishedAt = new Date().toISOString();
  const record = {
    schema: 'speclang-agent-driver/progress@1',
    ok,
    seed: rel(seedPath),
    generated_dir: rel(generatedDir),
    started_at: startedAt,
    finished_at: finishedAt,
    reason,
    stages,
    artifacts,
    warnings,
  };

  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'progress.json'), JSON.stringify(record, null, 2) + '\n');
  const jsonlLine = JSON.stringify({
    schema: record.schema,
    seed: record.seed,
    ok,
    finished_at: finishedAt,
    stages,
    artifacts: artifacts.map((a) => ({ path: a.path, bytes: a.bytes, body_bytes: a.body_bytes })),
    warnings,
  });
  fs.appendFileSync(path.join(runDir, 'progress.jsonl'), jsonlLine + '\n');
  fs.writeFileSync(path.join(runDir, 'progress.md'), renderMarkdown(record));

  if (args.json) {
    console.log(JSON.stringify(record, null, 2));
  } else {
    console.log('');
    console.log(renderMarkdown(record));
    if (!ok) console.error(`\n❌ agent-driver: ${reason}`);
  }
  process.exit(ok ? 0 : 1);
}

function renderMarkdown(record) {
  const lines = [];
  lines.push(`## SpecLang agent-driver run — ${record.ok ? 'PASS' : 'FAIL'}`);
  lines.push('');
  lines.push(`- Seed: \`${record.seed}\``);
  lines.push(`- Generated dir: \`${record.generated_dir}\``);
  lines.push(`- Started: ${record.started_at}`);
  lines.push(`- Finished: ${record.finished_at}`);
  if (record.reason) lines.push(`- Reason: ${record.reason}`);
  lines.push('');
  lines.push('| Stage | Command | Exit | Duration | Detail |');
  lines.push('|---|---|---|---|---|');
  for (const s of record.stages) {
    lines.push(
      `| ${s.name} | \`${s.command}\` | ${s.exit_code} | ${s.duration_ms} ms | ${String(s.detail ?? '').replace(/\|/g, '\\|')} |`
    );
  }
  if (record.artifacts.length > 0) {
    lines.push('');
    lines.push('| Artifact | Bytes | Body bytes | SHA-256 |');
    lines.push('|---|---|---|---|');
    for (const a of record.artifacts) {
      lines.push(`| \`${a.path}\` | ${a.bytes} | ${a.body_bytes} | ${a.sha256 ? a.sha256.slice(0, 12) : '—'} |`);
    }
  }
  if (record.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const w of record.warnings) lines.push(`- ${w}`);
  }
  return lines.join('\n') + '\n';
}

main();
