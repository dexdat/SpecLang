// ---- Lazy PI SDK Import (ESM-only package — falls back to mock for CJS/testing) ----

let _createAgentSession: ((opts: Record<string, unknown>) => Promise<{ session: { prompt: (msg: string) => Promise<void>; dispose: () => void } }>) | null = null;
let _piSdkMocked = false;

async function getCreateAgentSession(): Promise<typeof _createAgentSession> {
  if (_createAgentSession) return _createAgentSession;
  try {
    const mod = await import('@earendil-works/pi-coding-agent') as { createAgentSession: typeof _createAgentSession };
    _createAgentSession = mod.createAgentSession;
    // Health check: verify it's not a no-op mock
    if (!_createAgentSession || typeof _createAgentSession !== 'function') {
      throw new Error('createAgentSession is not a function');
    }
  } catch (err) {
    // CJS/ESM mismatch or missing package — return a mock session factory
    _piSdkMocked = true;
    _createAgentSession = async () => ({
      session: {
        prompt: async () => {},
        dispose: () => {},
      },
    });
  }
  return _createAgentSession;
}

/**
 * Check if the Pi Agent SDK loaded successfully (not mocked).
 * Returns {ok: true} if real SDK, {ok: false, reason: string} if mocked.
 */
export async function checkPiAgentHealth(): Promise<{ ok: boolean; reason?: string }> {
  const hasDeepseekKey = !!(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);
  try {
    const mod = await import('@earendil-works/pi-coding-agent');
    if (!mod || !mod.createAgentSession) {
      return { ok: false, reason: 'Pi Agent SDK loaded but createAgentSession is missing' };
    }
    if (!hasDeepseekKey) {
      return { ok: false, reason: 'Pi Agent SDK found but no API keys set. Set DEEPSEEK_API_KEY or OPENAI_API_KEY.' };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: 'Pi Agent SDK not available — cascade will not generate code. Install: npm install @earendil-works/pi-coding-agent. Set env vars: DEEPSEEK_API_KEY, OPENAI_API_KEY.',
    };
  }
}

import { SpeclangDaemon, FileChangeEvent, ConvergenceEvent, parseHeader, Logger } from './daemon.spec';
import * as path from 'path';
import * as fs from 'fs/promises';

// ---- Helper: Collect files generated from a spec ----

async function collectOutputFiles(specPath: string): Promise<string[]> {
  try {
    const specDir = path.dirname(specPath);
    const files = await fs.readdir(specDir);
    // Filter for assembled output files (.ts, .py, .go, .rs, .js, .md)
    return files.filter(f =>
      /\.(ts|py|go|rs|js|md)$/.test(f) &&
      !f.endsWith('.spec.md') &&
      !f.endsWith('.spec.ts') &&
      !f.endsWith('.md')
    );
  } catch {
    return [];
  }
}

// ---- Types ----

interface CascadeItem {
  specPath: string;
  timestamp: number;
  cascadeId: string;
  depth: number;
  header?: Record<string, unknown>;
}

export interface CascadeEvent {
  type: 'started' | 'completed' | 'error';
  cascadeId: string;
  specPath: string;
  timestamp: number;
  error?: string;
}

// ---- Cascade ID Generator ----

export class CascadeIdGenerator {
  private sequence = 0;
  private today: string;

  constructor() {
    this.today = new Date().toISOString().slice(0, 10);
  }

  next(): string {
    this.sequence++;
    return `cascade-${this.today}-${String(this.sequence).padStart(3, '0')}`;
  }
}

// ---- Squash (Debounce) ----

export class SquashBuffer {
  private buffer = new Map<string, { item: CascadeItem; timer: ReturnType<typeof setTimeout> }>();
  private readonly windowMs: number;
  private log: Logger;
  private squashedCount = 0;
  private flushCount = 0;

  constructor(windowMs: number = 100) {
    this.windowMs = windowMs;
    this.log = new Logger('cascade:squash');
    this.log.info('squash buffer initialized', { windowMs });
  }

  push(item: CascadeItem, onFlush: (item: CascadeItem) => void): void {
    const existing = this.buffer.get(item.specPath);
    if (existing) {
      clearTimeout(existing.timer);
      this.squashedCount++;
      this.log.debug('squashed duplicate', {
        specPath: item.specPath,
        cascadeId: item.cascadeId,
        previousId: existing.item.cascadeId,
        totalSquashed: this.squashedCount,
      });
      existing.item = item; // Keep latest
      existing.timer = setTimeout(() => {
        this.buffer.delete(item.specPath);
        this.flushCount++;
        this.log.info('flushed from squash buffer', {
          specPath: item.specPath,
          cascadeId: existing.item.cascadeId,
          totalFlushed: this.flushCount,
        });
        onFlush(existing.item);
      }, this.windowMs);
    } else {
      const timer = setTimeout(() => {
        this.buffer.delete(item.specPath);
        this.flushCount++;
        this.log.info('flushed from squash buffer', {
          specPath: item.specPath,
          cascadeId: item.cascadeId,
          totalFlushed: this.flushCount,
        });
        onFlush(item);
      }, this.windowMs);
      this.buffer.set(item.specPath, { item, timer });
      this.log.debug('queued in squash buffer', {
        specPath: item.specPath,
        cascadeId: item.cascadeId,
        bufferSize: this.buffer.size,
      });
    }
  }

  flushAll(): CascadeItem[] {
    const items: CascadeItem[] = [];
    for (const [path, entry] of this.buffer) {
      clearTimeout(entry.timer);
      items.push(entry.item);
    }
    this.buffer.clear();
    return items;
  }
}

// ---- Throttle (Fairness Queue with Deferral) ----

export class ThrottleController {
  private queueCount = new Map<string, number[]>();
  private deferralCount = new Map<string, number>();
  private readonly hotThreshold: number;
  private readonly windowSeconds: number;
  private log: Logger;

  constructor(hotThreshold: number = 5, windowSeconds: number = 60) {
    this.hotThreshold = hotThreshold;
    this.windowSeconds = windowSeconds;
    this.log = new Logger('cascade:throttle');
    this.log.info('throttle controller initialized', { hotThreshold, windowSeconds });
  }

  isHot(specPath: string): boolean {
    this.prune(specPath);
    const count = this.queueCount.get(specPath)?.length || 0;
    return count >= this.hotThreshold;
  }

  recordQueue(specPath: string): void {
    const now = Date.now();
    const entries = this.queueCount.get(specPath) || [];
    entries.push(now);
    this.queueCount.set(specPath, entries);
    const recentCount = entries.filter(t => now - t < this.windowSeconds * 1000).length;
    this.log.debug('queue recorded', { specPath, recentCount, threshold: this.hotThreshold });
  }

  recordDeferral(specPath: string): number {
    const count = (this.deferralCount.get(specPath) || 0) + 1;
    this.deferralCount.set(specPath, count);
    this.log.warn('file deferred', { specPath, deferralCount: count, backoffMs: this.getBackoffMs(specPath) });
    return count;
  }

  getDeferralCount(specPath: string): number {
    return this.deferralCount.get(specPath) || 0;
  }

  getBackoffMs(specPath: string): number {
    const deferrals = this.getDeferralCount(specPath);
    return Math.min(1000 * Math.pow(2, deferrals), 60000); // 2s, 4s, 8s, max 60s
  }

  private prune(specPath: string): void {
    const now = Date.now();
    const entries = this.queueCount.get(specPath) || [];
    const cutoff = now - this.windowSeconds * 1000;
    this.queueCount.set(specPath, entries.filter((t) => t > cutoff));
  }
}

// ---- Model Pool Resolver ----

export class ModelPoolResolver {
  private defaultModel: string;

  constructor(defaultModel = '') {
    this.defaultModel = defaultModel || process.env.CASCADE_DEFAULT_MODEL || '';
  }

  resolve(header: Record<string, unknown>): { model?: string; pool?: string } {
    // Layer 1: explicit model
    if (header.model) return { model: header.model as string };

    // Layer 2: model pool
    if (header.modelPool) return { pool: header.modelPool as string };

    // Layer 3: default model from env or constructor
    if (this.defaultModel) return { model: this.defaultModel };

    return {};
  }

  checkRateLimit(
    header: Record<string, unknown>,
    poolConfig: { maxConcurrent?: number }
  ): boolean {
    const specMax = (header.maxConcurrent as number) || Infinity;
    const poolMax = poolConfig.maxConcurrent || Infinity;
    return true; // Actual check depends on running session counts
  }
}

// ---- Cascade Router ----

export class CascadeRouter {
  private daemon: SpeclangDaemon;
  private squash: SquashBuffer;
  private throttle: ThrottleController;
  private idGen: CascadeIdGenerator;
  private runningSessions = 0;
  private listeners: Array<(event: CascadeEvent) => void> = [];
  private log: Logger;
  private cascadeLog: Logger;
  private sessionsLaunched = 0;
  private errorsLogged = 0;

  constructor(daemon: SpeclangDaemon) {
    this.daemon = daemon;
    this.squash = new SquashBuffer();
    this.throttle = new ThrottleController();
    this.idGen = new CascadeIdGenerator();
    this.modelResolver = new ModelPoolResolver();
    this.log = new Logger('cascade');
    this.cascadeLog = this.log.child('dispatch');

    this.log.info('cascade router initialized');

    // Check Pi Agent SDK health
    checkPiAgentHealth().then(health => {
      if (health.ok) {
        this.log.info('pi agent sdk: OK');
      } else {
        this.log.error('pi agent sdk: NOT AVAILABLE', { reason: health.reason });
        console.error(`\n⚠️  ${health.reason}\n`);
      }
    });

    daemon.on('file_change', (event: FileChangeEvent) => {
      this.log.info('routing file change', {
        kind: event.kind,
        path: event.path,
        dependentCount: event.dependentSpecs.length,
        dependents: event.dependentSpecs,
      });

      // Collect all spec files to process: the changed file itself + any dependents
      const allSpecs = new Set<string>();
      const isSpecFile = (p: string) =>
        p.endsWith('.spec.md') || p.endsWith('.spec.py.md') || p.endsWith('.spec.meta.md');
      if (isSpecFile(event.path)) allSpecs.add(event.path);
      for (const spec of event.dependentSpecs) allSpecs.add(spec);

      for (const spec of allSpecs) {
        const cascadeId = this.idGen.next();
        this.log.info('queuing cascade item', {
          cascadeId,
          specPath: spec,
        });
        this.squash.push(
          {
            specPath: spec,
            timestamp: event.timestamp,
            cascadeId,
            depth: 0,
          },
          (item) => this.processItem(item)
        );
      }
    });
  }

  private modelResolver: ModelPoolResolver;

  on(event: 'cascade', listener: (event: CascadeEvent) => void): void {
    this.listeners.push(listener);
  }

  private emit(event: CascadeEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  private async processItem(item: CascadeItem): Promise<void> {
    this.cascadeLog.info('processing cascade item', {
      cascadeId: item.cascadeId,
      specPath: item.specPath,
      depth: item.depth,
      runningSessions: this.runningSessions,
    });

    // Throttle check
    this.throttle.recordQueue(item.specPath);
    if (this.throttle.isHot(item.specPath)) {
      const deferrals = this.throttle.recordDeferral(item.specPath);
      const backoff = this.throttle.getBackoffMs(item.specPath);
      this.cascadeLog.warn('throttled: file too hot', {
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        deferrals,
        backoffMs: backoff,
      });
      if (deferrals >= 3) {
        this.errorsLogged++;
        this.cascadeLog.error('cascade abort: circular dependency suspected', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          deferrals,
        });
        this.emit({
          type: 'error',
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          timestamp: Date.now(),
          error: `File deferred ${deferrals}x. Possible circular dependency.`,
        });
      }
      setTimeout(() => this.processItem(item), backoff);
      return;
    }

    // Resolve model
    const header = await parseHeader(item.specPath);
    const resolved = this.modelResolver.resolve(header || {});
    this.cascadeLog.info('model resolved', {
      cascadeId: item.cascadeId,
      specPath: item.specPath,
      model: resolved.model || resolved.pool || 'default',
    });

    this.sessionsLaunched++;
    this.runningSessions++;
    this.cascadeLog.info('spawning pi session', {
      cascadeId: item.cascadeId,
      specPath: item.specPath,
      sessionNumber: this.sessionsLaunched,
      runningsSessions: this.runningSessions,
    });

    this.emit({
      type: 'started',
      cascadeId: item.cascadeId,
      specPath: item.specPath,
      timestamp: Date.now(),
    });

    try {
      // Spawn Pi agent session
      const sessionFn = await getCreateAgentSession();
      if (_piSdkMocked) {
        this.cascadeLog.warn('using mock pi session (SDK not available)', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
        });
      }

      // Resolve spec ID to file path if needed (e.g. @spec/chimera/rewriter → actual path)
      let resolvedPath = item.specPath;
      if (item.specPath.startsWith('@')) {
        const found = this.daemon.getSpecById(item.specPath);
        if (found) {
          resolvedPath = found;
          this.cascadeLog.info('resolved spec id to path', { specId: item.specPath, path: found });
        }
      }

      // Resolve project root (parent of specs directory)
      const specDir = path.dirname(resolvedPath);
      const projectRoot = path.resolve(specDir, '..');
      const projectSclPath = path.join(projectRoot, 'project.scl');
      const outputDir = path.join(projectRoot, 'src');

      // Read spec body and project context for prompt assembly
      let specBody = '';
      let projectContext = '';
      let targetLang = 'py';
      try {
        specBody = await fs.readFile(resolvedPath, 'utf-8');
        const header = await parseHeader(resolvedPath);
        targetLang = (header?.targetLang as string) || (header?.target_lang as string) || 'py';
      } catch { /* spec file gone */ }
      try {
        projectContext = await fs.readFile(projectSclPath, 'utf-8');
      } catch { /* no project.scl */ }

      // Load skill content for the target language
      let skillContext = '';
      const skillDir = path.join(path.dirname(import.meta.url.replace('file://', '')), '..', 'specs', 'skills.spec.dir');
      const skillFiles = [`code-gen-${targetLang}.spec.md`, `test-writer-${targetLang}.spec.md`];
      for (const sf of skillFiles) {
        try {
          const skillPath = path.join(skillDir, sf);
          const skillContent = await fs.readFile(skillPath, 'utf-8');
          skillContext += `\n## Skill: ${sf}\n${skillContent.slice(0, 4000)}\n`;
        } catch { /* skill not found */ }
      }

      // Get git diff for the changed spec (what changed)
      let specDiff = '';
      try {
        const { execSync } = await import('child_process');
        specDiff = execSync(`git -C ${projectRoot} diff -- "${resolvedPath}"`, {
          encoding: 'utf-8', timeout: 5000, maxBuffer: 50 * 1024,
        }).trim();
      } catch { /* no git or no diff */ }

      // Inventory existing output files
      let existingCode = '';
      try {
        const entries = await fs.readdir(outputDir, { recursive: true, withFileTypes: true });
        const codeFiles = entries
          .filter((e: any) => e.isFile() && /\\.(ts|py|go|rs|js)$/.test(e.name) && !e.name.includes('node_modules'))
          .map((e: any) => `  ${path.relative(outputDir, path.join(e.parentPath || e.path, e.name))}`)
          .slice(0, 50);
        if (codeFiles.length > 0) {
          existingCode = `Existing output files (update these, don't regenerate from scratch):\n${codeFiles.join('\n')}`;
        }
      } catch { /* no output dir */ }

      // Track output directory before session to detect generated files
      const getOutputFiles = async () => {
        try {
          const entries = await fs.readdir(outputDir, { recursive: true });
          return entries.filter((f: string) => /\.(ts|py|go|rs|js)$/.test(f) && !f.includes('node_modules'));
        } catch { return []; }
      };
      const beforeFiles = await getOutputFiles();

      const sessionStart = Date.now();
      const { session } = await sessionFn({
        cwd: projectRoot,
        tools: ['read', 'edit', 'bash', 'glob'],
      });

      const modelInfo = resolved.model ? ` using model ${resolved.model}` : '';
      this.cascadeLog.info('pi session spawned, running prompt', {
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        projectRoot,
        targetLang,
        setupMs: Date.now() - sessionStart,
      });

      const promptStart = Date.now();
      const prompt = [
        `You are the ${header?.ownedBy || 'codegen'} agent for SpecLang cascade ${item.cascadeId}.`,
        ``,
        `## Project Context`,
        `Project root: ${projectRoot}`,
        `Target language: ${targetLang}`,
        `Output directory: ${outputDir}`,
        ``,
        `## project.scl`,
        `\`\`\`yaml`,
        projectContext.slice(0, 8000),
        `\`\`\``,
        ``,
        skillContext ? `## Skills (HOW to generate correct ${targetLang} code)` : '',
        skillContext,
        ``,
        specDiff ? `## What Changed (git diff of spec)` : '',
        specDiff ? `\`\`\`diff\n${specDiff.slice(0, 4000)}\n\`\`\`` : '',
        ``,
        existingCode,
        ``,
        `## Spec: ${path.basename(resolvedPath)}`,
        `\`\`\`markdown`,
        specBody.slice(0, 12000),
        `\`\`\``,
        ``,
        `## Instructions`,
        `1. Read the spec above, the project.scl context, and the skills for ${targetLang} conventions`,
        `2. Read the existing output files listed above to understand what's already built`,
        `3. If a git diff is shown above, it tells you EXACTLY what changed in the spec — only update code affected by those changes`,
        `4. Generate/update ${targetLang} code in ${outputDir}/ following the skill conventions`,
        `5. Run tests: \`cd ${projectRoot} && ${targetLang === 'py' ? 'pip install -e . && pytest' : targetLang === 'ts' ? 'npm test' : 'make test'}\``,
        `6. Report: which files you created/modified, test results, any issues`,
      ].filter(Boolean).join('\n');

      await session.prompt(prompt);

      session.dispose();
      this.runningSessions--;

      const durationMs = Date.now() - promptStart;
      const totalDurationMs = Date.now() - sessionStart;

      // Check if any files were generated
      const afterFiles = await getOutputFiles();
      const newFiles = afterFiles.filter(f => !beforeFiles.includes(f));
      const generatedCount = newFiles.length;

      if (generatedCount === 0 && _piSdkMocked) {
        this.cascadeLog.warn('cascade completed but 0 files generated (mock SDK)', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          durationMs,
        });
      } else if (generatedCount === 0) {
        this.cascadeLog.warn('cascade completed but 0 files were generated', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          durationMs,
          hint: 'Check: (1) Pi Agent SDK installed, (2) API keys in env vars, (3) spec has @speclang blocks with @kind:operation or @kind:code annotations.',
        });
      } else {
        this.cascadeLog.info('cascade item completed', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          durationMs,
          totalDurationMs,
          generatedFiles: generatedCount,
        });
      }

      this.emit({
        type: 'completed',
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        timestamp: Date.now(),
      });
    } catch (err) {
      this.errorsLogged++;
      this.runningSessions--;
      const errMsg = err instanceof Error ? err.message : String(err);
      this.cascadeLog.error('cascade item failed', {
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        error: errMsg,
        totalErrors: this.errorsLogged,
      });
      this.emit({
        type: 'error',
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        timestamp: Date.now(),
        error: errMsg,
      });
    }
  }
}