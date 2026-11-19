import { afterEach, describe, expect, it, vi } from 'vitest';
import { Daemon } from '../../specs/daemon.spec.dir/src/daemon.ts';
import { writeDaemonPromMetrics } from '../../specs/daemon.spec.dir/src/daemon-prom';

const { execute, executorHref } = vi.hoisted(() => ({
  execute: vi.fn(),
  // The daemon loads its executor through an absolute file:// URL resolved from
  // its own module (see getPipelineExecutorCandidates), so a test-relative
  // specifier does NOT register a mock for that import. Key the mock on the
  // exact href the daemon computes.
  executorHref: new URL('../../specs/pipeline.spec.dir/src/executor.ts', import.meta.url).href,
}));
vi.mock(executorHref, () => ({
  PipelineExecutor: class { execute = execute; },
}));
vi.mock('../../specs/daemon.spec.dir/src/daemon-prom', () => ({
  writeDaemonPromMetrics: vi.fn().mockResolvedValue(undefined),
}));

// Drive the existing pipeline boundary without changing its import candidates
// or invoking build/commit stages against the host repository.
describe('OBS-3 daemon pipeline metrics', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const runPipeline = (daemon: Daemon) =>
    (daemon as unknown as { executePipeline(result: unknown): Promise<void> })
      .executePipeline({ converged: true, cascadeDepth: 0, filesChanged: 0, duration: 0, timestamp: Date.now() });

  it('counts failed results and exceptions cumulatively across a success', async () => {
    const daemon = new Daemon();
    execute.mockResolvedValueOnce({ success: false, error: 'failed stage' })
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('executor threw'));
    const failed = vi.fn();
    const succeeded = vi.fn();
    daemon.on('pipeline_failed', failed);
    daemon.on('pipeline_success', succeeded);

    await runPipeline(daemon);
    await runPipeline(daemon);
    await runPipeline(daemon);

    expect(execute).toHaveBeenCalledTimes(3);
    expect(vi.mocked(writeDaemonPromMetrics).mock.calls.map(([, metrics]) => metrics.errors))
      .toEqual([1, 1, 2]);
    expect(failed).toHaveBeenCalledTimes(2);
    expect(succeeded).toHaveBeenCalledTimes(1);
  });

  it('warns on metrics I/O failure without turning pipeline success into failure', async () => {
    const daemon = new Daemon();
    execute.mockResolvedValueOnce({ success: true });
    vi.mocked(writeDaemonPromMetrics).mockRejectedValueOnce(new Error('disk full'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const succeeded = vi.fn();
    const failed = vi.fn();
    daemon.on('pipeline_success', succeeded);
    daemon.on('pipeline_failed', failed);

    await expect(runPipeline(daemon)).resolves.toBeUndefined();
    expect(succeeded).toHaveBeenCalledTimes(1);
    expect(failed).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[Daemon] Failed to write .speclang/daemon.prom:', expect.any(Error));
  });
});
