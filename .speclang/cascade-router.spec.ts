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
import * as crypto from 'crypto';

// ---- Checksum Helpers ----

const CHECKSUMS_PATH = path.join(process.cwd(), '.speclang', 'checksums.json');

async function computeChecksum(filePath: string): Promise<string | null> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    // Normalize: strip trailing whitespace, normalize line endings
    content = content.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd();
    return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
  } catch {
    return null;
  }
}

async function readChecksums(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(CHECKSUMS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeChecksums(checksums: Record<string, string>): Promise<void> {
  try {
    await fs.mkdir(path.dirname(CHECKSUMS_PATH), { recursive: true });
    await fs.writeFile(CHECKSUMS_PATH, JSON.stringify(checksums, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write checksums:', err);
  }
}

// ---- Output File Filter (project-agnostic: exclude noise, accept everything) ----

/**
 * Returns true if a file should be tracked as cascade output.
 * Blacklist: exclude known noise, accept everything else.
 * SpecLang targets any language — we can't predict extensions.
 */
function isTrackableOutput(filename: string, fullPath: string): boolean {
  if (filename.startsWith('.')) return false;
  if (filename.endsWith('.pyc')) return false;
  if (fullPath.includes('node_modules')) return false;
  if (fullPath.includes('__pycache__')) return false;
  return true;
}

// ---- Spec Pre-processor ----

const ASSEMBLED_DIR = path.join(process.cwd(), '.speclang', 'assembled');

/**
 * Pre-process a spec file:
 * 1. Strip DSL annotations (@speclang, @kind:, @block:)
 * 2. Extract only target-language code blocks
 * 3. Write clean output to .speclang/assembled/{name}.code.{lang}
 * Returns the path to the clean output file, or null on failure.
 */
async function preProcessSpec(specPath: string, targetLang: string): Promise<string | null> {
  try {
    const content = await fs.readFile(specPath, 'utf-8');
    const lines = content.split('\n');
    const codeBlocks: string[] = [];
    let inSpeclangFence = false;
    let inTargetFence = false;
    const targetLangFence = '```' + targetLang;

    for (const line of lines) {
      const trimmed = line.trim();

      // Track speclang code fences — collect content, strip DSL annotations
      if (trimmed.startsWith('```speclang')) {
        inSpeclangFence = true;
        continue;
      }
      if (inSpeclangFence && trimmed === '```') {
        inSpeclangFence = false;
        codeBlocks.push(''); // separator between blocks
        continue;
      }

      // Track target-language code fences — skip clean code (already processed)
      if (trimmed.startsWith(targetLangFence)) {
        inTargetFence = true;
        continue;
      }
      if (inTargetFence && trimmed === '```') {
        inTargetFence = false;
        continue;
      }

      // Inside speclang fence: collect code, strip DSL annotations
      if (inSpeclangFence) {
        if (!trimmed.startsWith('@speclang') && !trimmed.startsWith('@dataclass') && !trimmed.startsWith('@pydantic') && !trimmed.startsWith('@kind:') && !trimmed.startsWith('@block:')) {
          codeBlocks.push(line);
        }
        continue;
      }

      // Skip target-language fence content (already clean code)
      if (inTargetFence) continue;
    }

    const cleanCode = codeBlocks.join('\n').trim();
    const baseName = path.basename(specPath).replace(/\.spec\..*$/, '').replace(/\.spec$/, '');
    const outputPath = path.join(ASSEMBLED_DIR, `${baseName}.code.${targetLang}`);

    await fs.mkdir(ASSEMBLED_DIR, { recursive: true });
    await fs.writeFile(outputPath, cleanCode, 'utf-8');

    return outputPath;
  } catch (err) {
    console.error(`Pre-process failed for ${specPath}:`, err);
    return null;
  }
}

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

// ---- Thinker Coverage Checker ----

async function checkThinkerCoverage(projectRoot: string, metaSpecPath: string): Promise<string[]> {
  const unresolved: string[] = [];
  const specsDir = path.join(projectRoot, 'specs');

  let specFiles: string[] = [];
  try {
    specFiles = await fs.readdir(specsDir);
  } catch { /* no specs dir */ }

  // Read project.scl for required components
  const projectSclPath = path.join(projectRoot, 'project.scl');
  try {
    const sclContent = await fs.readFile(projectSclPath, 'utf-8');
    const parsed = JSON.parse(sclContent);
    if (parsed.components) {
      const requiredComponents = parsed.components.map((c: any) => c.name || c);
      for (const comp of requiredComponents) {
        const hasSpec = specFiles.some(f => f.startsWith(comp) && f.endsWith('.spec.md'));
        if (!hasSpec) unresolved.push(`component:${comp}`);
      }
    }
  } catch { /* no project.scl */ }

  // Scan ALL spec files in specs/ for @ref: links
  const specMdFiles = specFiles.filter(f => f.endsWith('.spec.md'));
  for (const specFile of specMdFiles) {
    try {
      const sContent = await fs.readFile(path.join(specsDir, specFile), 'utf-8');
      const refRegex = /@ref:(\S+)/g;
      let match: RegExpExecArray | null;
      while ((match = refRegex.exec(sContent)) !== null) {
        const ref = match[1];
        const refPath = ref.startsWith('specs/')
          ? path.join(projectRoot, ref)
          : path.join(specsDir, ref);
        try {
          await fs.access(refPath);
        } catch {
          const label = `ref:${ref}`;
          if (!unresolved.includes(label)) unresolved.push(label);
        }
      }
    } catch { /* cannot read spec file */ }
  }

  return unresolved;
}

// ---- Types ----

interface CascadeItem {
  specPath: string;
  timestamp: number;
  cascadeId: string;
  depth: number;
  stage: 'thinker' | 'assembler' | 'codegen' | 'testwriter';
  header?: Record<string, unknown>;
}

export interface CascadeEvent {
  type: 'started' | 'completed' | 'error';
  cascadeId: string;
  specPath: string;
  timestamp: number;
  stage?: string;
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

// ---- Stage Order for Multi-stage Cascade Chaining ----

const STAGE_ORDER: Array<'thinker' | 'assembler' | 'codegen' | 'testwriter'> = ['thinker', 'assembler', 'codegen', 'testwriter'];

function getNextStage(current: 'thinker' | 'assembler' | 'codegen' | 'testwriter'): 'thinker' | 'assembler' | 'codegen' | 'testwriter' | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
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

    daemon.on('file_change', async (event: FileChangeEvent) => {
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
        // Determine starting stage based on spec type
        let startStage: 'thinker' | 'assembler' = 'assembler';
        try {
          const hdr = await parseHeader(spec);
          const tl = (hdr?.targetLang || hdr?.target_lang || '') as string;
          if (['meta', 'plan', 'decision', 'context'].includes(tl)) {
            startStage = 'thinker';
          }
        } catch {}

        this.squash.push(
          {
            specPath: spec,
            timestamp: event.timestamp,
            cascadeId,
            depth: 0,
            stage: startStage,
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
      stage: item.stage,
      runningSessions: this.runningSessions,
    });

    // ---- Checksum check: skip if file unchanged ----
    const newHash = await computeChecksum(item.specPath);
    const checksums = await readChecksums();
    const oldHash = checksums[item.specPath] || null;
    if (newHash && oldHash === newHash) {
      this.cascadeLog.info('checksum unchanged, skipping cascade', {
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        stage: item.stage,
      });
      // Still emit 'completed' so downstream knows this item was processed (no-op)
      this.emit({
        type: 'completed',
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        timestamp: Date.now(),
        stage: item.stage,
      });
      return;
    }

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
          stage: item.stage,
          error: `File deferred ${deferrals}x. Possible circular dependency.`,
        });
      }
      setTimeout(() => this.processItem(item), backoff);
      return;
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

    // Resolve model
    const header = await parseHeader(resolvedPath);
    const resolved = this.modelResolver.resolve(header || {});
    this.cascadeLog.info('model resolved', {
      cascadeId: item.cascadeId,
      specPath: item.specPath,
      stage: item.stage,
      model: resolved.model || resolved.pool || 'default',
    });

    // Resolve project root (parent of specs directory) and output dirs
    const specDir = path.dirname(resolvedPath);
    const projectRoot = path.resolve(specDir, '..');
    const projectSclPath = path.join(projectRoot, 'project.scl');
    const outputDir = path.join(projectRoot, 'src');

    // ---- Pre-process spec: strip DSL and extract code blocks ----
    let cleanSpecPath: string | null = null;
    let targetLang = 'py';
    try {
      const hdr = await parseHeader(resolvedPath);
      targetLang = (hdr?.targetLang as string) || (hdr?.target_lang as string) || 'py';
    } catch { /* no header */ }
    cleanSpecPath = await preProcessSpec(resolvedPath, targetLang);
    if (cleanSpecPath) {
      this.cascadeLog.info('pre-processed spec', {
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        cleanOutput: cleanSpecPath,
        stage: item.stage,
      });
    } else {
      this.cascadeLog.warn('pre-process produced no output, falling back to raw spec', {
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        stage: item.stage,
      });
    }

    this.sessionsLaunched++;
    this.runningSessions++;
    this.cascadeLog.info('spawning pi session', {
      cascadeId: item.cascadeId,
      specPath: item.specPath,
      stage: item.stage,
      sessionNumber: this.sessionsLaunched,
      runningsSessions: this.runningSessions,
    });

    this.emit({
      type: 'started',
      cascadeId: item.cascadeId,
      specPath: item.specPath,
      timestamp: Date.now(),
      stage: item.stage,
    });

    try {
      // Spawn Pi agent session
      const sessionFn = await getCreateAgentSession();
      if (_piSdkMocked) {
        this.cascadeLog.warn('using mock pi session (SDK not available)', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          stage: item.stage,
        });
      }

      // Read spec body for prompt assembly
      let specBody = '';
      let projectContext = '';
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
        // Verify this is a git repo before attempting diff (avoids git usage page spew)
        execSync(`git -C ${projectRoot} rev-parse --git-dir`, {
          encoding: 'utf-8', timeout: 5000,
        });
        specDiff = execSync(`git -C ${projectRoot} diff -- "${resolvedPath}"`, {
          encoding: 'utf-8', timeout: 5000, maxBuffer: 50 * 1024,
        }).trim();
      } catch { /* no git or no diff */ }

      // Inventory existing output files
      let existingCode = '';
      try {
        const entries = await fs.readdir(outputDir, { recursive: true, withFileTypes: true });
        const codeFiles = entries
          .filter((e: any) => e.isFile() && isTrackableOutput(e.name, path.join(e.parentPath || e.path, e.name)))
          .map((e: any) => `  ${path.relative(outputDir, path.join(e.parentPath || e.path, e.name))}`)
          .slice(0, 50);
        if (codeFiles.length > 0) {
          existingCode = `Existing output files (update these, don't regenerate from scratch):\n${codeFiles.join('\n')}`;
        }
      } catch { /* no output dir */ }

      // Track output directory before session to detect generated files
      let beforeMtimes = new Map<string, number>();
      try {
        const before = await fs.readdir(outputDir, { recursive: true, withFileTypes: true });
        for (const e of before) {
          const fp = path.join(e.parentPath || e.path, e.name);
          if (e.isFile() && isTrackableOutput(e.name, fp)) {
            try { const s = await fs.stat(fp); beforeMtimes.set(fp, s.mtimeMs); } catch {}
          }
        }
      } catch { /* no output dir */ }

      const getOutputFiles = async () => {
        try {
          const entries = await fs.readdir(outputDir, { recursive: true, withFileTypes: true });
          return entries
            .filter((e: any) => e.isFile() && isTrackableOutput(e.name, path.join(e.parentPath || e.path, e.name)))
            .map((e: any) => path.join(e.parentPath || e.path, e.name));
        } catch { return []; }
      };
      const beforeFiles = await getOutputFiles();

      const sessionStart = Date.now();
      const { session } = await sessionFn({
        cwd: projectRoot,
        tools: ['read', 'edit', 'bash', 'glob', 'write'],
      });

      const modelInfo = resolved.model ? ` using model ${resolved.model}` : '';
      this.cascadeLog.info('pi session spawned, running prompt', {
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        stage: item.stage,
        projectRoot,
        targetLang,
        setupMs: Date.now() - sessionStart,
      });

      // ---- Stage-specific instructions ----
      const stageInstructions: Record<string, string> = {
        thinker: [
          'Read the meta spec carefully. Understand the WHY — problem space, design philosophy, stakeholders.',
          `Also read ${projectSclPath} for the full component tree, architecture, and constraints.`,
          'Generate these expanded specs in the project specs/ directory:',
          '  1. {name}.spec.plan.md — implementation plan with phases, ADRs, approach',
          '  2. One .spec.{lang}.md per component in the architecture — with full @kind:operation blocks',
          'Each generated spec MUST have proper YAML headers with @ref: backlinks to the meta spec.',
          'Output: write files to specs/ (the project specs directory).',
          'After writing, report: what files were created, and what @ref: links remain unresolved.',
        ].join('\n'),
        assembler: [
          `Read the pre-processed spec at: ${cleanSpecPath || '(fallback to raw spec)'}`,
          `Extract code blocks from the spec.`,
          `Write clean code files to ${ASSEMBLED_DIR}/`,
          `Do NOT write to ${outputDir}/ — that is the codegen stage's job.`,
        ].join('\n'),
        codegen: [
          `Read the assembled code at ${ASSEMBLED_DIR}/`,
          `Write actual .${targetLang} files to ${outputDir}/.`,
          `Do NOT regenerate from scratch — update existing files.`,
          `Read existing files first, then apply targeted updates.`,
        ].join('\n'),
        testwriter: [
          `Read the generated code at ${outputDir}/`,
          `Write tests for the generated code.`,
          `Run ${targetLang === 'py' ? 'pytest' : targetLang === 'ts' ? 'npm test' : 'the test suite'} after writing.`,
          `Report results in your response.`,
        ].join('\n'),
      };

      const promptStart = Date.now();
      const prompt = [
        `You are generating ${targetLang} code from a SpecLang spec.`,
        ``,
        `## Task`,
        `Read the spec and generate the corresponding ${targetLang} code.`,
        `Spec file: ${path.basename(resolvedPath)}`,
        `Output directory: ${item.stage === 'thinker' ? path.join(projectRoot, 'specs') : item.stage === 'assembler' ? ASSEMBLED_DIR : outputDir}`,
        `Project root: ${projectRoot}`,
        ``,
        `## Stage: ${item.stage}`,
        stageInstructions[item.stage] || '',
        ``,
        specDiff ? `## What Changed\n\`\`\`diff\n${specDiff.slice(0, 2000)}\n\`\`\`` : '',
        ``,
        `## Spec`,
        `\`\`\`markdown`,
        specBody.slice(0, 8000),
        `\`\`\``,
        ``,
        `## Rules`,
        `- STRIP @speclang and @dataclass annotations (SpecLang DSL, not real ${targetLang})`,
        `- @kind:operation → implementation code`,
        `- @kind:code → content IS code, just strip annotations`,
        `- @kind:note → docstrings only`,
        `- Use proper imports and type hints`,
        `- Read existing files before editing — never regenerate from scratch`,
        ``,
        (item.stage === 'thinker' && projectContext ? `## Project Context (project.scl)\n\`\`\`json\n${projectContext.slice(0, 4000)}\n\`\`\`` : ''),
        `## Verify`,
        `Run: \`cd ${projectRoot} && ${targetLang === 'py' ? 'python -m pytest tests/ -x -q 2>&1 | tail -10' : targetLang === 'ts' ? 'npm test 2>&1 | tail -10' : 'make test 2>&1 | tail -10'}\``,
      ].filter(Boolean).join('\n');

      await session.prompt(prompt);

      session.dispose();
      this.runningSessions--;

      const durationMs = Date.now() - promptStart;
      const totalDurationMs = Date.now() - sessionStart;

      // Check if any files were generated or modified
      const afterFiles = await getOutputFiles();
      // Check for new files AND modified files (mtime changed)
      const newFiles = afterFiles.filter(f => !beforeFiles.includes(f));
      let modifiedCount = 0;
      for (const f of afterFiles) {
        if (beforeFiles.includes(f)) {
          try {
            const s = await fs.stat(f);
            const beforeMs = beforeMtimes.get(f) || 0;
            if (s.mtimeMs > beforeMs + 1000) modifiedCount++;
          } catch {}
        }
      }
      const generatedCount = newFiles.length + modifiedCount;

      if (generatedCount === 0 && _piSdkMocked) {
        this.cascadeLog.warn('cascade completed but 0 files generated (mock SDK)', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          stage: item.stage,
          durationMs,
        });
      } else if (generatedCount === 0) {
        this.cascadeLog.warn('cascade completed but 0 files were generated', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          stage: item.stage,
          durationMs,
          hint: 'Check: (1) Pi Agent SDK installed, (2) API keys in env vars, (3) spec has @speclang blocks with @kind:operation or @kind:code annotations.',
        });
      } else {
        this.cascadeLog.info('cascade item completed', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          stage: item.stage,
          durationMs,
          totalDurationMs,
          newFiles: newFiles.length,
          modifiedFiles: modifiedCount,
          generatedFiles: generatedCount,
        });
      }

      // ---- Update checksum after successful processing ----
      const finalHash = await computeChecksum(item.specPath);
      if (finalHash) {
        const updatedChecksums = await readChecksums();
        updatedChecksums[item.specPath] = finalHash;
        await writeChecksums(updatedChecksums);
      }

      this.emit({
        type: 'completed',
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        timestamp: Date.now(),
        stage: item.stage,
      });

      // ---- Coverage check after thinker completes ----
      if (item.stage === 'thinker') {
        const unresolved = await checkThinkerCoverage(projectRoot, item.specPath);
        if (unresolved.length > 0) {
          this.cascadeLog.warn('thinker coverage gaps found, queueing another pass', {
            cascadeId: item.cascadeId,
            specPath: item.specPath,
            unresolved,
          });
          setTimeout(() => {
            this.processItem({
              specPath: item.specPath,
              timestamp: Date.now(),
              cascadeId: item.cascadeId,
              depth: item.depth + 1,
              stage: 'thinker',
            });
          }, 100);
          // Don't chain to next stage — coverage not complete
          return;
        }
        this.cascadeLog.info('thinker coverage complete, chaining to assembler', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
        });
      }

      // ---- Multi-stage chaining: queue next stage if applicable ----
      const nextStage = getNextStage(item.stage);
      if (nextStage) {
        this.cascadeLog.info('chaining to next cascade stage', {
          cascadeId: item.cascadeId,
          specPath: item.specPath,
          fromStage: item.stage,
          toStage: nextStage,
        });
        setTimeout(() => {
          this.processItem({
            specPath: item.specPath,
            timestamp: Date.now(),
            cascadeId: item.cascadeId,
            depth: item.depth + 1,
            stage: nextStage,
          });
        }, 100);
      }
    } catch (err) {
      this.errorsLogged++;
      this.runningSessions--;
      const errMsg = err instanceof Error ? err.message : String(err);
      this.cascadeLog.error('cascade item failed', {
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        stage: item.stage,
        error: errMsg,
        totalErrors: this.errorsLogged,
      });
      this.emit({
        type: 'error',
        cascadeId: item.cascadeId,
        specPath: item.specPath,
        timestamp: Date.now(),
        stage: item.stage,
        error: errMsg,
      });
      // Do NOT chain to next stage on failure
    }
  }
}
