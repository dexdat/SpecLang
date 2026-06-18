import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { ConvergenceDetector } from '../../src/daemon/convergence';
import { DaemonConfig, ConvergenceResult, TestResults } from '../../src/daemon/types';

let testId = 0;
function makeConfig(overrides?: Partial<DaemonConfig>): { config: DaemonConfig; configPath: string } {
  testId++;
  const configPath = path.join(os.tmpdir(), `sl-pipe-cfg-${testId}-${Math.random().toString(36).slice(2)}.yaml`);
  return {
    configPath,
    config: {
      watch: { paths: ['specs'], ignore: [], debounce: 100 },
      convergence: {
        quietPeriod: 1,
        maxDepth: 5,
        testOnConverge: true,
        autoCommit: false,
      },
      agentApi: { port: 0, host: 'localhost' },
      locks: { dir: '.speclang/locks', timeout: 30 },
      logging: { level: 'silent', file: '/dev/null' },
      ...overrides,
    },
  };
}

describe('Post-Convergence Pipeline', () => {
  const tempFiles: string[] = [];

  afterEach(async () => {
    for (const f of tempFiles) {
      try { await fs.remove(f); } catch {}
    }
    tempFiles.length = 0;
  });

  it('should trigger pipeline execution on convergence', async () => {
    const { config, configPath } = makeConfig();
    tempFiles.push(configPath);
    await fs.writeFile(configPath, `
pipeline:
  on_converge:
    - name: echo
      run: echo "pipeline ran"
  on_success: []
recovery:
  max_attempts: 1
  on_fail: []
convergence:
  quiet_period: 1
  max_iterations: 10
`, 'utf-8');
    const detector = new ConvergenceDetector(config);
    const result = await detector.onConverge(configPath);
    expect(result.testResults).toBeDefined();
    expect(result.testResults!.total).toBeGreaterThan(0);
    expect(result.testResults!.passed).toBe(result.testResults!.total);
    expect(result.converged).toBe(true);
    expect(result.filesChanged).toBe(0);
    detector.stop();
  });

  it('should handle pipeline failure gracefully', async () => {
    const { config, configPath } = makeConfig();
    tempFiles.push(configPath);
    await fs.writeFile(configPath, `
pipeline:
  on_converge:
    - name: fail
      run: exit 1
  on_success: []
recovery:
  max_attempts: 1
  on_fail: []
convergence:
  quiet_period: 1
  max_iterations: 10
`, 'utf-8');
    const detector = new ConvergenceDetector(config);
    const result = await detector.onConverge(configPath);
    expect(result.testResults).toBeDefined();
    expect(result.testResults!.failed).toBeGreaterThan(0);
    expect(result.converged).toBe(true);
    detector.stop();
  });

  it('should still emit converged event on convergence', async () => {
    const { config, configPath } = makeConfig();
    tempFiles.push(configPath);
    await fs.writeFile(configPath, `
pipeline:
  on_converge: []
  on_success: []
recovery:
  max_attempts: 1
  on_fail: []
convergence:
  quiet_period: 1
  max_iterations: 10
`, 'utf-8');
    const detector = new ConvergenceDetector(config);
    const eventHandler = vi.fn();
    detector.on('converged', eventHandler);
    const result = await detector.onConverge(configPath);
    expect(eventHandler).toHaveBeenCalledTimes(1);
    const emitted = eventHandler.mock.calls[0][0] as ConvergenceResult;
    expect(emitted.converged).toBe(true);
    detector.stop();
  });

  it('should pass convergence result to pipeline context', async () => {
    const { config, configPath } = makeConfig();
    tempFiles.push(configPath);
    await fs.writeFile(configPath, `
pipeline:
  on_converge:
    - name: echo
      run: echo "context test"
  on_success: []
recovery:
  max_attempts: 1
  on_fail: []
convergence:
  quiet_period: 1
  max_iterations: 10
`, 'utf-8');
    const detector = new ConvergenceDetector(config);
    const result = await detector.onConverge(configPath);
    expect(result.converged).toBe(true);
    expect(result.testResults).toBeDefined();
    detector.stop();
  });
});
