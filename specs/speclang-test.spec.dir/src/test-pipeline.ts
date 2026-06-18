import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  loadBuildYaml,
  StageExecutor,
  validateSpecHeaders,
  PipelineRunner,
  gitCommit,
  installGitHook,
} from './pipeline.spec';
import { ConvergenceEvent } from './daemon.spec';

// ---- Test: validateSpecHeaders ----

async function test_validateSpecHeaders(): Promise<void> {
  console.log('--- test_validateSpecHeaders ---');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speclang-test-'));
  const specPath = path.join(tmpDir, 'test.spec.md');
  const specContent = `---
id: "@specs/test"
version: 1.0.0
target_lang: ts
owned_by: test
---

# Test Spec

Hello world
`;
  await fs.writeFile(specPath, specContent, 'utf-8');

  const result = await validateSpecHeaders(tmpDir);
  console.log(`Result: valid=${result.valid}, errors=${JSON.stringify(result.errors)}`);

  if (result.valid) {
    console.log('✅ PASS: validateSpecHeaders found valid spec');
  } else {
    console.log(`❌ FAIL: Expected valid, got errors: ${result.errors.join(', ')}`);
  }

  // Cleanup
  await fs.rm(tmpDir, { recursive: true, force: true });
}

async function test_validateSpecHeaders_missing(): Promise<void> {
  console.log('\n--- test_validateSpecHeaders_missing ---');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speclang-test-'));
  const specPath = path.join(tmpDir, 'bad.spec.md');
  const specContent = `---
version: 1.0.0
---

# Bad spec — no id
`;
  await fs.writeFile(specPath, specContent, 'utf-8');

  const result = await validateSpecHeaders(tmpDir);
  console.log(`Result: valid=${result.valid}, errors=${JSON.stringify(result.errors)}`);

  if (!result.valid && result.errors.some((e) => e.includes('id'))) {
    console.log('✅ PASS: Correctly caught missing id');
  } else {
    console.log(`❌ FAIL: Expected error about missing id, got: ${JSON.stringify(result.errors)}`);
  }

  // Cleanup
  await fs.rm(tmpDir, { recursive: true, force: true });
}

// ---- Test: StageExecutor ----

async function test_StageExecutor(): Promise<void> {
  console.log('\n--- test_StageExecutor ---');

  const executor = new StageExecutor(1); // No retries for fast test
  const stages = [
    { name: 'echo_hello', run: 'echo hello' },
  ];

  const result = await executor.executeStages(stages);
  console.log(`Result: passed=${result.passed}, results=${JSON.stringify(result.results.map((r: any) => ({ name: r.name, passed: r.passed, duration: r.duration, output: r.output?.trim() })))}`);

  if (result.passed && result.results[0].passed) {
    console.log('✅ PASS: StageExecutor ran echo hello successfully');
  } else {
    console.log(`❌ FAIL: Expected passed stage, got: ${JSON.stringify(result)}`);
  }
}

// ---- Test: StageExecutor with failed command ----

async function test_StageExecutor_fail(): Promise<void> {
  console.log('\n--- test_StageExecutor_fail ---');

  const executor = new StageExecutor(1); // No retries
  const stages = [
    { name: 'fail_cmd', run: 'exit 1' },
  ];

  const result = await executor.executeStages(stages);
  console.log(`Result: passed=${result.passed}, first=${result.results[0]?.passed}`);

  if (!result.passed && !result.results[0].passed) {
    console.log('✅ PASS: StageExecutor correctly failed on exit 1');
  } else {
    console.log(`❌ FAIL: Expected failure, got: ${JSON.stringify(result)}`);
  }
}

// ---- Test: StageExecutor with retry ----

async function test_StageExecutor_retry(): Promise<void> {
  console.log('\n--- test_StageExecutor_retry ---');

  const executor = new StageExecutor(3); // 3 retries
  const stages = [
    { name: 'always_fails', run: 'exit 2' },
  ];

  const result = await executor.executeStages(stages);
  console.log(`Result: passed=${result.passed}, first=${result.results[0]?.passed}`);

  if (!result.passed && !result.results[0].passed) {
    console.log('✅ PASS: StageExecutor exhausted retries correctly');
  } else {
    console.log(`❌ FAIL: Expected failure after retries, got: ${JSON.stringify(result)}`);
  }
}

// ---- Run all tests ----

async function main() {
  console.log('=== Pipeline Spec Tests ===\n');

  await test_validateSpecHeaders();
  await test_validateSpecHeaders_missing();
  await test_StageExecutor();
  await test_StageExecutor_fail();
  await test_StageExecutor_retry();

  console.log('\n=== All pipeline tests complete ===');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
