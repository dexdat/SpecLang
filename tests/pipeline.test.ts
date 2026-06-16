/**
 * Pipeline Tests
 * 
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import { PipelineExecutor, PipelineConfigManager, StageExecutor, RecoveryExecutor, orderStages, areDependenciesMet } from '../src/pipeline';
import { Stage, RecoveryAction } from '../src/pipeline/types';

// Test configuration
const TEST_CONFIG_PATH = 'test-build.yaml';

describe('Pipeline Executor - Configuration', () => {
  test('should load config from file', async () => {
    const configManager = new PipelineConfigManager();
    await configManager.load();
    const config = configManager.get();
    expect(config).toBeDefined();
    expect(config.pipeline).toBeDefined();
  });

  test('should validate stage dependencies', async () => {
    await fs.writeFile(TEST_CONFIG_PATH, `
pipeline:
  on_converge:
    - name: stage1
      run: echo "test"
    - name: stage2
      run: echo "test2"
      depends_on: [stage1]
      `, 'utf-8');
    
    const manager = new PipelineConfigManager(TEST_CONFIG_PATH);
    await manager.load();
    
    const validation = manager.validate();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should detect invalid dependencies', async () => {
    await fs.writeFile(TEST_CONFIG_PATH, `
pipeline:
  on_converge:
    - name: stage1
      run: echo "test"
    - name: stage2
      run: echo "test2"
      depends_on: [nonexistent]
      `, 'utf-8');
    
    const manager = new PipelineConfigManager(TEST_CONFIG_PATH);
    await manager.load();
    
    const validation = manager.validate();
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('should detect circular dependencies', async () => {
    await fs.writeFile(TEST_CONFIG_PATH, `
pipeline:
  on_converge:
    - name: stage1
      run: echo "test"
      depends_on: [stage2]
    - name: stage2
      run: echo "test2"
      depends_on: [stage1]
      `, 'utf-8');
    
    const manager = new PipelineConfigManager(TEST_CONFIG_PATH);
    await manager.load();
    
    const validation = manager.validate();
    expect(validation.valid).toBe(false);
  });
});

describe('Stage Ordering', () => {
  test('should order stages by dependencies', () => {
    const stages: Stage[] = [
      { name: 'stage3', run: 'echo "3"', depends_on: ['stage2'] },
      { name: 'stage1', run: 'echo "1"' },
      { name: 'stage2', run: 'echo "2"', depends_on: ['stage1'] },
    ];

    const ordered = orderStages(stages);
    expect(ordered[0].name).toBe('stage1');
    expect(ordered[1].name).toBe('stage2');
    expect(ordered[2].name).toBe('stage3');
  });

  test('should handle stages without dependencies', () => {
    const stages: Stage[] = [
      { name: 'a', run: 'echo "a"' },
      { name: 'b', run: 'echo "b"' },
      { name: 'c', run: 'echo "c"' },
    ];

    const ordered = orderStages(stages);
    expect(ordered.length).toBe(3);
  });

  test('should throw on circular dependencies', () => {
    const stages: Stage[] = [
      { name: 'stage1', run: 'echo "1"', depends_on: ['stage2'] },
      { name: 'stage2', run: 'echo "2"', depends_on: ['stage1'] },
    ];

    expect(() => orderStages(stages)).toThrow();
  });
});

describe('Dependency Checking', () => {
  test('should return true for no dependencies', () => {
    const stage: Stage = { name: 'stage1', run: 'echo "test"' };
    expect(areDependenciesMet(stage, new Set())).toBe(true);
  });

  test('should return true when all dependencies met', () => {
    const stage: Stage = { name: 'stage2', run: 'echo "test"', depends_on: ['stage1'] };
    expect(areDependenciesMet(stage, new Set(['stage1']))).toBe(true);
  });

  test('should return false when dependencies not met', () => {
    const stage: Stage = { name: 'stage2', run: 'echo "test"', depends_on: ['stage1'] };
    expect(areDependenciesMet(stage, new Set())).toBe(false);
    expect(areDependenciesMet(stage, new Set(['other']))).toBe(false);
  });
});

describe('Stage Execution', () => {
  test('should execute simple stage', async () => {
    const stageExecutor = new StageExecutor(false);
    const result = await stageExecutor.execute(
      { name: 'echo-test', run: 'echo "hello"' },
      { timestamp: Date.now() },
      false
    );

    expect(result.name).toBe('echo-test');
    expect(result.success).toBe(true);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  test('should execute multiple commands', async () => {
    const stageExecutor = new StageExecutor(false);
    const result = await stageExecutor.execute(
      { name: 'multi', run: ['echo "a"', 'echo "b"'] },
      { timestamp: Date.now() },
      false
    );

    expect(result.name).toBe('multi');
    expect(result.success).toBe(true);
  });

  test('should handle failed command', async () => {
    const stageExecutor = new StageExecutor(false);
    const result = await stageExecutor.execute(
      { name: 'fail', run: 'exit 1' },
      { timestamp: Date.now() },
      false
    );

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
  });

  test('should run pre-hook', async () => {
    const stageExecutor = new StageExecutor(false);
    const result = await stageExecutor.execute(
      { 
        name: 'with-hook', 
        run: 'echo "main"',
        hooks: {
          pre: 'echo "pre-hook"',
        }
      },
      { timestamp: Date.now() },
      false
    );

    expect(result.success).toBe(true);
  });

  test('should run post-success hook', async () => {
    const stageExecutor = new StageExecutor(false);
    const result = await stageExecutor.execute(
      { 
        name: 'with-success-hook', 
        run: 'echo "main"',
        hooks: {
          post_success: 'echo "success!"',
        }
      },
      { timestamp: Date.now() },
      false
    );

    expect(result.success).toBe(true);
  });

  test('should run post-fail hook on failure', async () => {
    const stageExecutor = new StageExecutor(false);
    const result = await stageExecutor.execute(
      { 
        name: 'fail-hook', 
        run: 'exit 1',
        hooks: {
          post_fail: 'echo "failed!"',
        }
      },
      { timestamp: Date.now() },
      false
    );

    expect(result.success).toBe(false);
  });

  test('should run in dry-run mode', async () => {
    const stageExecutor = new StageExecutor(false);
    const result = await stageExecutor.execute(
      { name: 'dry', run: 'echo "test"' },
      { timestamp: Date.now() },
      true // dryRun
    );

    expect(result.success).toBe(true);
    expect(result.output).toContain('DRY RUN');
  });
});

describe('Recovery', () => {
  test('should execute notify action', async () => {
    const recovery = new RecoveryExecutor('.speclang/errors', false);
    
    const action: RecoveryAction = {
      type: 'notify',
      notify: { target: 'log', message: 'Test notification' },
    };

    const context = {
      error: new Error('Test error'),
      stage: 'test-stage',
      attempt: 1,
    };

    const result = await recovery.execute(action, context);
    expect(result.success).toBe(true);
  });

  test('should execute pause action', async () => {
    const recovery = new RecoveryExecutor('.speclang/errors', false);
    
    const action: RecoveryAction = {
      type: 'pause',
      pause: { duration: 100, reason: 'Test pause' },
    };

    const context = {
      error: new Error('Test error'),
      stage: 'test-stage',
      attempt: 1,
    };

    const start = Date.now();
    const result = await recovery.execute(action, context);
    const elapsed = Date.now() - start;

    expect(result.success).toBe(true);
    expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
  });

  test('should execute retry action', async () => {
    const recovery = new RecoveryExecutor('.speclang/errors', false);
    
    const action: RecoveryAction = {
      type: 'retry',
      retry: { full_pipeline: true },
    };

    const context = {
      error: new Error('Test error'),
      stage: 'test-stage',
      attempt: 1,
    };

    const result = await recovery.execute(action, context);
    expect(result.success).toBe(true);
  });
});

describe('Full Pipeline', () => {
  afterAll(async () => {
    if (await fs.pathExists('empty-build.yaml')) {
      await fs.remove('empty-build.yaml');
    }
  });

  test('should execute pipeline in dry-run mode', async () => {
    await fs.writeFile(TEST_CONFIG_PATH, `
pipeline:
  on_converge:
    - name: stage1
      run: "echo 'Hello from stage 1'"
    - name: stage2
      run: "echo 'Hello from stage 2'"
      depends_on: [stage1]
recovery:
  max_attempts: 1
  on_fail: []
    `, 'utf-8');

    const testExecutor = new PipelineExecutor({
      configPath: TEST_CONFIG_PATH,
      dryRun: true,
      verbose: false,
    });

    const result = await testExecutor.execute();

    expect(result).toBeDefined();
    expect(result.stages).toHaveLength(2);
    expect(result.success).toBe(true);
  });

  test('should fail on stage failure', async () => {
    await fs.writeFile(TEST_CONFIG_PATH, `
pipeline:
  on_converge:
    - name: fail-stage
      run: "exit 1"
recovery:
  max_attempts: 1
  on_fail:
    - notify:
        target: log
        message: "Pipeline failed"
    `, 'utf-8');

    const testExecutor = new PipelineExecutor({
      configPath: TEST_CONFIG_PATH,
      dryRun: false,
      verbose: false,
    });

    const result = await testExecutor.execute();

    expect(result.success).toBe(false);
    expect(result.stages[0].success).toBe(false);
  });

  test('should emit events during execution', async () => {
    const events: string[] = [];
    
    const testExecutor = new PipelineExecutor({
      dryRun: true,
      verbose: false,
      onEvent: (event) => {
        events.push(event.type);
      },
    });

    await testExecutor.execute();

    expect(events.length).toBeGreaterThan(0);
  });

  test('should handle empty pipeline', async () => {
    await fs.writeFile('empty-build.yaml', `
pipeline:
  on_converge: []
recovery:
  max_attempts: 1
  on_fail: []
    `, 'utf-8');

    const executor = new PipelineExecutor({
      configPath: 'empty-build.yaml',
      dryRun: true,
    });

    const result = await executor.execute();

    expect(result.success).toBe(true);
    expect(result.stages).toHaveLength(0);
  });
});
