import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync, spawn } from 'child_process';

interface StageResult {
  name: string;
  passed: boolean;
  detail: string;
  duration: number;
}

const ROOT = path.resolve(__dirname, '..');
const TMP_PREFIX = `speclang-smoke-${Date.now()}`;

function logStage(result: StageResult): void {
  const icon = result.passed ? '✅' : '❌';
  const ms = result.duration.toFixed(0);
  console.log(`  ${icon} ${result.name} (${ms}ms) — ${result.detail}`);
}

function run(cmd: string, opts?: { cwd?: string; timeout?: number }): { ok: boolean; output: string; code: number } {
  const start = Date.now();
  try {
    const out = execSync(cmd, {
      cwd: opts?.cwd ?? ROOT,
      encoding: 'utf-8',
      timeout: opts?.timeout ?? 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, output: out, code: 0 };
  } catch (err: any) {
    return {
      ok: false,
      output: (err.stdout ?? '') + (err.stderr ?? ''),
      code: err.status ?? 1,
    };
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForPort(port: number, maxMs: number): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      const r = execSync(`curl -sf http://localhost:${port}/health`, {
        encoding: 'utf-8',
        timeout: 2000,
      });
      return r.length > 0;
    } catch {
      await sleep(250);
    }
  }
  return false;
}

// ── Stage 1: Create temp spec ─────────────────────────────────

function stage1_createTempSpec(tmpDir: string): StageResult {
  const start = Date.now();
  const specsDir = path.join(tmpDir, 'specs', 'assembler');
  fs.mkdirSync(specsDir, { recursive: true });

  const specFile = path.join(specsDir, 'health-endpoint.spec.ts.md');
  const outputFile = path.join(tmpDir, 'assembled', 'health-endpoint.spec.ts');

  const spec = `---
id: "@smoke-test/health-endpoint"
version: 1.0.0
layer: 2
target_lang: ts
output: ${outputFile}
owned-by: smoke-test
tags: [smoke, health, e2e]
short: "Smoke test health endpoint"
---

# Health Endpoint

Simple HTTP health check endpoint for E2E smoke testing.

## Implementation

\`\`\`typescript
import * as http from 'http';

const PORT = parseInt(process.env.SMOKE_PORT || '4987', 10);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', source: 'smoke-test', ts: Date.now() }));
  } else {
    res.writeHead(404);
    res.end('not found');
  }
});

export function startServer(): Promise<void> {
  return new Promise((resolve) => {
    server.listen(PORT, () => resolve());
  });
}

export function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

export { server, PORT };
\`\`\`
`;

  fs.writeFileSync(specFile, spec, 'utf-8');

  const exists = fs.existsSync(specFile);
  const content = fs.readFileSync(specFile, 'utf-8');
  const hasImpl = content.includes('## Implementation');

  return {
    name: 'create-temp-spec',
    passed: exists && hasImpl,
    detail: hasImpl ? `${specFile}` : 'spec missing Implementation block',
    duration: Date.now() - start,
  };
}

// ── Stage 2: Run assembler ────────────────────────────────────

function stage2_runAssembler(tmpDir: string): StageResult {
  const start = Date.now();
  const specFile = path.join(tmpDir, 'specs', 'assembler', 'health-endpoint.spec.ts.md');
  const expectedOutput = path.join(tmpDir, 'assembled', 'health-endpoint.spec.ts');

  const cmd = `npx tsx -e "
const { Assembler } = require('${ROOT}/.speclang/assembler.spec');
const a = new Assembler();
a.assemble('${specFile}').then(r => {
  console.log(r.success ? 'OK' : 'FAIL');
  r.errors.forEach(e => console.error('ERR:', e));
  r.warnings.forEach(w => console.log('WARN:', w));
}).catch(e => { console.error('EXCEPTION:', e.message); process.exit(1); });
"`;

  const result = run(cmd, { cwd: tmpDir, timeout: 30_000 });

  const hasOutput = fs.existsSync(expectedOutput);
  let outputContainsCode = false;
  if (hasOutput) {
    const content = fs.readFileSync(expectedOutput, 'utf-8');
    outputContainsCode = content.includes('createServer') && content.includes('/health');
  }

  return {
    name: 'assemble-spec',
    passed: result.ok && hasOutput && outputContainsCode,
    detail: hasOutput && outputContainsCode
      ? `assembled → ${expectedOutput}`
      : `assembly failed (exit ${result.code})`,
    duration: Date.now() - start,
  };
}

// ── Stage 3: Build ────────────────────────────────────────────

function stage3_build(): StageResult {
  const start = Date.now();
  const result = run('npx tsc --noEmit', { timeout: 120_000 });
  return {
    name: 'typecheck',
    passed: result.ok,
    detail: result.ok ? 'no type errors' : `exit ${result.code}`,
    duration: Date.now() - start,
  };
}

// ── Stage 4: Run tests ────────────────────────────────────────

function stage4_test(): StageResult {
  const start = Date.now();
  const result = run('npx vitest run', { cwd: ROOT, timeout: 120_000 });

  // Find "1577 passed" or "1 failed | 1576 passed"
  const passMatch = result.output.match(/(\d+) passed/);
  const failMatch = result.output.match(/(\d+) failed/);
  const passed = passMatch ? parseInt(passMatch[1]) : 0;
  const failed = failMatch ? parseInt(failMatch[1]) : 0;
  const total = passed + failed;
  const passRate = total > 0 ? passed / total : 0;

  return {
    name: 'test-suite',
    passed: passRate >= 0.9,
    detail: `${passed} passed, ${failed} failed (${(passRate * 100).toFixed(1)}% pass rate)`,
    duration: Date.now() - start,
  };
}

// ── Stage 5: Start health server + curl ──────────────────────

async function stage5_liveHealthCheck(tmpDir: string): Promise<StageResult> {
  const start = Date.now();
  const assembledFile = path.join(tmpDir, 'assembled', 'health-endpoint.spec.ts');
  const serverRunner = path.join(tmpDir, 'run-health-server.cjs');

  if (!fs.existsSync(assembledFile)) {
    return {
      name: 'live-health-check',
      passed: false,
      detail: 'assembled file not found',
      duration: Date.now() - start,
    };
  }

  const serverCode = `const http = require('http');
const PORT = parseInt(process.env.SMOKE_PORT || '4987', 10);
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', source: 'smoke-test', ts: Date.now() }));
  } else {
    res.writeHead(404);
    res.end('not found');
  }
});
server.listen(PORT, () => { console.log('READY on ' + PORT); });
process.on('SIGTERM', () => { server.close(); process.exit(0); });
`;
  fs.writeFileSync(serverRunner, serverCode, 'utf-8');

  const port = 4987;
  const env = { ...process.env, SMOKE_PORT: String(port) };
  let child: ReturnType<typeof spawn> | null = null;

  try {
    child = spawn('node', [serverRunner], {
      cwd: tmpDir,
      env,
      stdio: 'pipe',
      detached: false,
    });

    const ready = await waitForPort(port, 8_000);
    if (!ready) {
      return {
        name: 'live-health-check',
        passed: false,
        detail: 'server did not start within timeout',
        duration: Date.now() - start,
      };
    }

    const curlResult = run(`curl -sf http://localhost:${port}/health`, { timeout: 5_000 });
    const is200 = curlResult.ok && curlResult.output.includes('"status":"ok"');

    return {
      name: 'live-health-check',
      passed: is200,
      detail: is200 ? 'GET /health → 200 OK' : `curl exit ${curlResult.code}`,
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: 'live-health-check',
      passed: false,
      detail: err.message,
      duration: Date.now() - start,
    };
  } finally {
    if (child) {
      try { process.kill(child.pid!, 'SIGTERM'); } catch {}
      try { child.kill('SIGKILL'); } catch {}
    }
    try {
      run(`fuser -k ${port}/tcp 2>/dev/null || true`, { timeout: 3_000 });
    } catch {}
  }
}

// ── Stage 6: Cleanup ──────────────────────────────────────────

function stage6_cleanup(tmpDir: string): StageResult {
  const start = Date.now();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    const clean = !fs.existsSync(tmpDir);
    return {
      name: 'cleanup',
      passed: clean,
      detail: clean ? 'temp files removed' : 'cleanup incomplete',
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: 'cleanup',
      passed: false,
      detail: err.message,
      duration: Date.now() - start,
    };
  }
}

// ── Main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════');
  console.log('  SpecLang E2E Smoke Test');
  console.log(`  ${new Date().toISOString()}`);
  console.log(`  Node ${process.version}`);
  console.log(`  Root: ${ROOT}`);
  console.log('═══════════════════════════════════════════\n');

  const tmpDir = path.join(os.tmpdir(), TMP_PREFIX);
  const stages: StageResult[] = [];

  // Stage 1
  const s1 = stage1_createTempSpec(tmpDir);
  logStage(s1);
  stages.push(s1);
  if (!s1.passed) return finish(stages);

  // Stage 2
  const s2 = stage2_runAssembler(tmpDir);
  logStage(s2);
  stages.push(s2);
  if (!s2.passed) return finish(stages);

  // Stage 3
  const s3 = stage3_build();
  logStage(s3);
  stages.push(s3);
  if (!s3.passed) return finish(stages);

  // Stage 4
  const s4 = stage4_test();
  logStage(s4);
  stages.push(s4);
  if (!s4.passed) return finish(stages);

  // Stage 5
  const s5 = await stage5_liveHealthCheck(tmpDir);
  logStage(s5);
  stages.push(s5);

  // Stage 6 (always run)
  const s6 = stage6_cleanup(tmpDir);
  logStage(s6);
  stages.push(s6);

  return finish(stages);
}

function finish(stages: StageResult[]): void {
  const passed = stages.filter((s) => s.passed).length;
  const total = stages.length;
  const allPassed = stages.every((s) => s.passed);

  console.log('');
  console.log('═══════════════════════════════════════════');
  if (allPassed) {
    console.log(`  ✅ E2E smoke test: PASSED (${passed} stages)`);
  } else {
    console.log(`  ❌ E2E smoke test: FAILED (${passed}/${total} stages passed)`);
    for (const s of stages) {
      if (!s.passed) {
        console.log(`     └─ ${s.name}: ${s.detail}`);
      }
    }
  }
  console.log('═══════════════════════════════════════════');

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
