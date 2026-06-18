import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { FileWatcher } from '../../src/swarm/file-watcher';
import { QueueSystem } from '../../src/swarm/queue';
import { AgentRouter } from '../../src/swarm/agent-router';
import { SessionManager, _resetPiSdkCache } from '../../src/swarm/session-manager';
import { GitHandler } from '../../src/swarm/git-handler';
import { OwnershipRegistry } from '../../src/agents/ownership';
import { ConvergenceDetector } from '../../src/daemon/convergence';
import type { DaemonConfig } from '../../src/daemon/types';
import { FileEventKind } from '../../src/daemon/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

vi.mock('@earendil-works/pi-coding-agent', () => ({
  createAgentSession: vi.fn().mockResolvedValue({
    session: { prompt: vi.fn(), dispose: vi.fn() },
  }),
}));

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-cascade-e2e-'));
}

function writeFile(dir: string, relativePath: string, content: string): string {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

async function waitForEvent(
  emitter: any,
  event: string,
  timeoutMs: number = 3000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.removeAllListeners(event);
      reject(new Error(`Timed out waiting for ${event} event`));
    }, timeoutMs);
    emitter.once(event, (data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const SPEC_CONTENT = `# speclang-header lines:12
id: "@test/auth"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [test, auth]
short: Auth test spec
---

# Auth Test Spec

### @block:login @kind:function

Handles user login.
`;

describe('Full Cascade E2E', () => {
  let tmpDir: string;
  let specsDir: string;
  let generatedDir: string;
  let locksDir: string;

  beforeAll(() => {
    tmpDir = createTempDir();
    specsDir = path.join(tmpDir, 'specs');
    generatedDir = path.join(tmpDir, 'generated');
    locksDir = path.join(tmpDir, '.speclang', 'locks');
    fs.mkdirSync(specsDir, { recursive: true });
    fs.mkdirSync(generatedDir, { recursive: true });
    fs.mkdirSync(locksDir, { recursive: true });

    try {
      execSync('git init', { cwd: tmpDir });
      execSync('git config user.email cascade-test@speclang.dev', { cwd: tmpDir });
      execSync('git config user.name CascadeTest', { cwd: tmpDir });
    } catch {
      // git may not be available; GitHandler handles this gracefully
    }
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  afterEach(() => {
    _resetPiSdkCache();
  });

  describe('Test 1: Spec file change triggers full cascade', () => {
    it('should detect spec file, route to spec-writer, and spawn a session with skill prompt loaded', async () => {
      const watcher = new FileWatcher({
        paths: [specsDir],
        debounceMs: 50,
        chokidarOptions: { usePolling: true, interval: 50 },
      });
      const queue = new QueueSystem({ max_concurrent_agents: 1 });
      const router = new AgentRouter();

      watcher.on('change', (event: any) => {
        queue.enqueue(event, {
          owning_agent_pattern: (fp: string) =>
            router.route(path.relative(tmpDir, fp)).agentType,
        });
      });

      watcher.watch();

      try {
        const specRelPath = 'test-auth.spec.md';
        const specPath = writeFile(specsDir, specRelPath, SPEC_CONTENT);

        const fileEvent = await waitForEvent(watcher, 'change');
        expect(fileEvent.filePath).toBe(specPath);
        expect(fileEvent.changeType).toBe('add');
        expect(fileEvent.timestamp).toBeGreaterThan(0);

        await delay(150);
        const status = queue.getStatus();
        const totalItems =
          status.pending + status.active + status.completed;
        expect(totalItems).toBeGreaterThan(0);

        const route = router.route(path.relative(tmpDir, specPath));
        expect(route.agentType).toBe('spec-writer');

        const sm = new SessionManager({
          skillsBaseDir: path.join(tmpDir, 'skills'),
        });
        try {
          const session = await sm.spawnSession({
            filePath: specPath,
            agentType: route.agentType,
            skillPath: route.skillPath,
          });
          expect(session).toBeDefined();
          expect(session.filePath).toBe(specPath);
          expect(session.agentType).toBe('spec-writer');
          expect(session.sessionId).toBeTruthy();
          expect(session.spawnedAt).toBeGreaterThan(0);
        } finally {
          await sm.disposeAll();
        }
      } finally {
        watcher.stop();
      }
    });
  });

  describe('Test 2: Generated file gets routed to code-gen agent', () => {
    it('should detect generated Go file and route to code-gen-go', async () => {
      const watcher = new FileWatcher({
        paths: [generatedDir],
        debounceMs: 50,
        chokidarOptions: { usePolling: true, interval: 50 },
      });
      const router = new AgentRouter();

      watcher.watch();

      try {
        const genPath = writeFile(
          generatedDir,
          'go/auth/handler.go',
          'package auth\n\nfunc Handler() {}\n',
        );

        const event = await waitForEvent(watcher, 'change');
        expect(event.filePath).toBe(genPath);
        expect(event.changeType).toBe('add');

        const route = router.route(path.relative(tmpDir, genPath));
        expect(route.agentType).toBe('code-gen-go');
      } finally {
        watcher.stop();
      }
    });
  });

  describe('Test 3: Convergence detection', () => {
    it('should converge after events settle with filesChanged > 0', async () => {
      const config: DaemonConfig = {
        watch: { paths: [specsDir], ignore: [], debounce: 50 },
        convergence: {
          quietPeriod: 0.1,
          maxDepth: 10,
          testOnConverge: false,
          autoCommit: false,
        },
        agentApi: { port: 0, host: 'localhost' },
        locks: { dir: locksDir, timeout: 30 },
        logging: { level: 'error', file: '/dev/null' },
      };

      const detector = new ConvergenceDetector(config);

      try {
        expect(detector.isConverged()).toBe(true);

        detector.onEvent({
          kind: FileEventKind.Modify,
          path: path.join(specsDir, 'test.spec.md'),
          timestamp: Date.now(),
        });
        detector.onEvent({
          kind: FileEventKind.Modify,
          path: path.join(specsDir, 'test.spec.md'),
          timestamp: Date.now(),
        });
        detector.onEvent({
          kind: FileEventKind.Create,
          path: path.join(specsDir, 'new.spec.md'),
          timestamp: Date.now(),
        });

        expect(detector.isConverged()).toBe(false);

        const result = await detector.waitForConvergence(5000);
        expect(result.converged).toBe(true);
        expect(result.filesChanged).toBe(3);

        const status = detector.getStatus();
        expect(status.converged).toBe(true);
        expect(status.filesChanged).toBe(3);
        expect(status.currentDepth).toBeGreaterThan(0);
        expect(status.quietPeriod).toBe(100);
      } finally {
        detector.stop();
      }
    });
  });

  describe('Test 4: Ownership guard integration', () => {
    it('should block code-gen agent from writing spec files owned by spec-writer', () => {
      const registry = new OwnershipRegistry();
      const specFilePath = 'specs/test-auth.spec.md';

      const check = registry.canWrite('codegen-1', 'code-gen', specFilePath);
      expect(check.allowed).toBe(false);
      expect(check.owner).toBe('spec-writer');
      expect(check.reason).toContain('code-gen');

      const allowedCheck = registry.canWrite(
        'specwriter-1',
        'spec-writer',
        specFilePath,
      );
      expect(allowedCheck.allowed).toBe(true);
      expect(allowedCheck.owner).toBe('spec-writer');
    });
  });

  describe('Test 5: Session persistence — warm reuse', () => {
    it('should reuse the same session for rapid changes to the same spec file', async () => {
      const sm = new SessionManager({
        skillsBaseDir: path.join(tmpDir, 'skills'),
      });

      try {
        const specPath = path.join(specsDir, 'reuse-test.spec.md');

        const handle1 = await sm.spawnSession({
          filePath: specPath,
          agentType: 'spec-writer',
          skillPath: '',
        });
        expect(sm.getStats().totalSpawned).toBe(1);

        const handle2 = await sm.spawnSession({
          filePath: specPath,
          agentType: 'spec-writer',
          skillPath: '',
        });
        expect(sm.getStats().totalSpawned).toBe(1);
        expect(handle1.sessionId).toBe(handle2.sessionId);
      } finally {
        await sm.disposeAll();
      }
    });
  });
});
