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
async function preProcessSpec(specPath: string, targetLang: string, projectRoot: string): Promise<string | null> {
  try {
    const assembledDir = path.join(projectRoot, '.speclang', 'assembled');
    const content = await fs.readFile(specPath, 'utf-8');
    const lines = content.split('\n');
    const codeBlocks: string[] = [];
    let inSpeclangFence = false;
    let inCodeFence = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Track speclang code fences — collect content, strip DSL annotations
      if (trimmed.startsWith('```speclang')) {
        inSpeclangFence = true;
        inCodeFence = false;
        continue;
      }
      if (inSpeclangFence && trimmed === '```') {
        inSpeclangFence = false;
        codeBlocks.push(''); // separator between blocks
        continue;
      }

      // Track any language code fence (```ts, ```py, ```go, etc.) — extract as clean code
      if (!inSpeclangFence && trimmed.startsWith('```') && !trimmed.startsWith('```speclang')) {
        inCodeFence = true;
        continue;
      }
      if (inCodeFence && trimmed === '```') {
        inCodeFence = false;
        codeBlocks.push(''); // separator between blocks
        continue;
      }

      // Inside speclang fence: collect code, strip DSL annotations
      if (inSpeclangFence) {
        if (!trimmed.startsWith('@speclang') && !trimmed.startsWith('@dataclass') && !trimmed.startsWith('@pydantic') && !trimmed.startsWith('@kind:') && !trimmed.startsWith('@block:')) {
          codeBlocks.push(line);
        }
        continue;
      }

      // Inside any code fence: collect as clean code
      if (inCodeFence) {
        codeBlocks.push(line);
        continue;
      }
    }

    const cleanCode = codeBlocks.join('\n').trim();
    const baseName = path.basename(specPath).replace(/\.spec\..*$/, '').replace(/\.spec$/, '');

    // Extract spec ID from header
    let specId = '';
    let sectionAnchor = 'implementation';
    try {
      const hdr = await parseHeader(specPath);
      specId = (hdr?.id as string) || '';
    } catch {}

    // Try to determine the section name from the spec content
    try {
      const specContent = await fs.readFile(specPath, 'utf-8');
      const headingMatch = specContent.match(/^##\s+(.+)$/m);
      if (headingMatch) {
        sectionAnchor = headingMatch[1]
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
    } catch {}

    // Build trace header block (canonical single-line format)
    const traceHeaders = [
      `// spec:trace spec=${specPath}#${sectionAnchor}`,
      '// spec:generated DO NOT EDIT — edit the spec instead',
    ].filter(Boolean).join('\n');

    const fullOutput = `${traceHeaders}\n\n${cleanCode}`;
    const outputPath = path.join(assembledDir, `${baseName}.code.${targetLang}`);

    await fs.mkdir(assembledDir, { recursive: true });
    await fs.writeFile(outputPath, fullOutput, 'utf-8');

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
      // Match .spec.md, .spec.ts.md, .spec.py.md, .spec.go.md, .spec.rs.md, etc.
      const isSpecFile = (p: string) =>
        /\.spec(\.\w+)?\.md$/.test(p);
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
    cleanSpecPath = await preProcessSpec(resolvedPath, targetLang, projectRoot);
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
      const skillDir = (() => { try { return path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'specs', 'skills.spec.dir'); } catch { return path.join(process.cwd(), 'specs', 'skills.spec.dir'); } })();
      const stageSkillFiles: Record<string, string[]> = {
        thinker: [`code-gen-${targetLang}.spec.md`, `test-writer-${targetLang}.spec.md`, `spec-writer-${targetLang}.spec.md`],
        assembler: [`code-gen-${targetLang}.spec.md`, `test-writer-${targetLang}.spec.md`, `spec-writer-${targetLang}.spec.md`],
        codegen: [`code-gen-${targetLang}.spec.md`, `test-writer-${targetLang}.spec.md`],
        testwriter: [`code-gen-${targetLang}.spec.md`, `test-writer-${targetLang}.spec.md`],
      };
      const skillFiles = stageSkillFiles[item.stage] || stageSkillFiles.codegen;
      for (const sf of skillFiles) {
        try {
          const skillPath = path.join(skillDir, sf);
          const skillContent = await fs.readFile(skillPath, 'utf-8');
          skillContext += `\n## Skill: ${sf}\n${skillContent}\n`;
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
          encoding: 'utf-8', timeout: 5000, maxBuffer: 500 * 1024,
        }).trim();
      } catch { /* no git or no diff */ }

      // Inventory existing output files
      let existingCode = '';
      try {
        const entries = await fs.readdir(outputDir, { recursive: true, withFileTypes: true });
        const codeFiles = entries
          .filter((e: any) => e.isFile() && isTrackableOutput(e.name, path.join(e.parentPath || e.path, e.name)))
          .map((e: any) => `  ${path.relative(outputDir, path.join(e.parentPath || e.path, e.name))}`)
          .slice(0, 200);
        if (codeFiles.length > 0) {
          existingCode = `Existing output files in ${outputDir} (update these, don't regenerate from scratch):\n${codeFiles.join('\n')}`;
        }
      } catch { /* no output dir */ }

      // Track files across whole project before session to detect generated/modified files
      const scanProjectFiles = async (): Promise<string[]> => {
        const { glob } = await import('glob');
        try {
          const entries = await glob('**/*', {
            cwd: projectRoot,
            nodir: true,
            ignore: [
              '**/node_modules/**',
              '**/.git/**',
              '**/__pycache__/**',
              '**/*.pyc',
              '**/.speclang/assembled/**',
              '**/dist/**',
              '**/coverage/**',
              '**/.ralph/**',
              '**/.opencode/**',
            ],
          });
          return entries.filter(f => !f.startsWith('.'));
        } catch { return []; }
      };

      let beforeMtimes = new Map<string, number>();
      for (const relPath of await scanProjectFiles()) {
        const fp = path.join(projectRoot, relPath);
        try { const s = await fs.stat(fp); beforeMtimes.set(fp, s.mtimeMs); } catch {}
      }

      const beforeFiles = Array.from(beforeMtimes.keys());

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
      const projectAssembledDir = path.join(projectRoot, '.speclang', 'assembled');
      const stageInstructions: Record<string, string> = {
        thinker: [
          `## STAGE: Thinker (Phase 0 — Spec Expansion)`,
          ``,
          `### ROLE`,
          `You are the SpecLang Thinker. Your job is to READ high-level intent and EXPAND it into detailed`,
          `specifications that downstream agents (assembler, codegen, testwriter) can execute.`,
          ``,
          `### INPUTS (use read() to access ALL of these)`,
          `1. The meta spec: ${resolvedPath}`,
          `2. Project architecture: ${projectSclPath}`,
          `3. ALL files in specs/ with @ref: links pointing at or from this spec`,
          `4. The SpecLang skill reference files (included below)`,
          ``,
          `### OUTPUTS (write to specs/ in ${projectRoot}/specs/)`,
          `1. {name}.spec.plan.md — Implementation plan with phases, architecture decisions, approach rationale`,
          `2. One .spec.{lang}.md per component — with full @kind:operation blocks, type definitions, edge cases`,
          ``,
          `### TRACE FORMAT (EVERY output block MUST include this)`,
          ``,
          `Use the canonical single-line format:`,

          `  spec:trace spec=<path#section> plan=<phase/task/step> evidence=<path> cascade=<id>`,
          ``,
          `For markdown thinking files:`,
          ``,
          `  ## Decision: Use JWT for Authentication`,
          `  > spec:trace spec=specs/auth.spec.md#auth-strategy L12-34 plan=phase-1/architecture/step-2 evidence=.speclang/evidence/auth-decision.md cascade=PLACEHOLDER`,
          `  > **Confidence:** HIGH (3 sources)`,
          `  > **Sources:** specs/auth.spec.md#auth-strategy, specs/security.spec.md#token-format, project.scl#auth`,
          ``,
          `  At file bottom, add a Trace Index:`,
          `  ## Trace Index`,
          `  - specs/auth.spec.md#auth-strategy → this file §Decision`,
          `  - specs/security.spec.md#token-format → this file §Token Structure`,
          ``,
          `For generated spec code blocks:`,
          `  <!-- spec:trace spec=specs/auth.spec.md#login-flow L45-89 -->`,
          ``,
          `### QUALITY GATES`,
          `- [ ] EVERY @ref: target has been read and merged`,
          `- [ ] EVERY generated spec block has a spec:trace annotation`,
          `- [ ] EVERY thinking file section has Trace + Confidence + Sources`,
          `- [ ] Cover ALL components from project.scl — no gaps`,
          `- [ ] Report unresolved @ref: links explicitly`,
          `- [ ] Confidence scores are HONEST — do not mark MEDIUM as HIGH`,
          ``,
          `### HOW TO WORK`,
          `1. read() the meta spec + project.scl + ALL @ref: targets`,
          `2. Understand the full architecture before writing anything`,
          `3. write() each generated spec file with proper headers, @ref: backlinks, and spec:trace annotations`,
          `4. After all files: report what was created, what @ref: links remain unresolved, and overall confidence`,
        ].join('\n'),
        assembler: [
          `## STAGE: Assembler (Phase 1 — Code Extraction)`,
          ``,
          `### ROLE`,
          `You are the SpecLang Assembler. Extract clean code blocks from specs and assemble them into`,
          `compilable files. Do NOT generate new code — extract and clean what already exists.`,
          ``,
          `### INPUT`,
          `Read the pre-processed spec at: ${cleanSpecPath || '(fallback to raw spec at ' + resolvedPath + ')'}`,
          ``,
          `### OUTPUT`,
          `Write clean, compilable code files to: ${projectAssembledDir}/`,
          `Each file MUST compile standalone. Strip ALL DSL annotations. Keep only executable code.`,
          ``,
          `### TRACE FORMAT`,
          `Every assembled code file MUST begin with a trace block:`,
          `// spec:trace spec=${resolvedPath}#implementation L<start>-<end> cascade=${item.cascadeId}`,
          `// spec:generated DO NOT EDIT — edit the spec instead`,
          ``,
          `### QUALITY GATES`,
          `- [ ] The assembled code COMPILES with the target language toolchain`,
          `- [ ] No DSL annotations (@speclang, @kind:, @block:) remain in output`,
          `- [ ] Every file has spec:trace annotations`,
          `- [ ] Imports are resolved and correct`,
          ``,
          `### HOW TO WORK`,
          `1. read() the pre-processed spec`,
          `2. Extract every code block — remove all @speclang DSL annotations`,
          `3. write() each assembled file with trace headers to ${projectAssembledDir}/`,
          `4. DO NOT write to ${outputDir}/ — that's the codegen stage's job`,
        ].join('\n'),
        codegen: [
          `## STAGE: Codegen (Phase 2 — Implementation)`,
          ``,
          `### ROLE`,
          `You are the SpecLang Code Generator. Read assembled specs and generate production-ready`,
          `${targetLang} code with full type safety, error handling, and testability.`,
          ``,
          `### INPUTS`,
          `1. Assembled code at: ${projectAssembledDir}/`,
          `2. The original spec: ${resolvedPath}`,
          `3. Existing generated code in: ${outputDir}/`,
          `4. SpecLang skill reference files (included below) for ${targetLang} conventions`,
          ``,
          `### OUTPUT`,
          `Write .${targetLang} files to: ${outputDir}/`,
          `Update existing files — NEVER regenerate from scratch. Read first, then apply targeted edits.`,
          ``,
          `### TRACE FORMAT`,
          `Every generated file MUST carry traceability:`,
          `// spec:trace spec=<source-spec>#<section> L<lines> plan=<phase/task/step> test=<path> cascade=${item.cascadeId}`,
          ``,
          `### QUALITY GATES`,
          `- [ ] All types are explicit — no 'any' unless truly dynamic`,
          `- [ ] Error paths are handled — every function has error handling`,
          `- [ ] The code COMPILES with the target language toolchain`,
          `- [ ] Existing files are UPDATED, not regenerated`,
          `- [ ] Every file has spec:trace annotations`,
          ``,
          `### HOW TO WORK`,
          `1. read() the assembled code from ${projectAssembledDir}/`,
          `2. read() existing files in ${outputDir}/ — understand what's already there`,
          `3. write() or edit() each file with full type safety and error handling`,
          `4. bash() the compiler/linter to verify`,
          `5. Fix any errors, then report what was generated`,
        ].join('\n'),
        testwriter: [
          `## STAGE: TestWriter (Phase 3 — Verification)`,
          ``,
          `### ROLE`,
          `You are the SpecLang Test Writer. Generate comprehensive tests that verify the generated`,
          `code against the original spec's acceptance criteria.`,
          ``,
          `### INPUTS`,
          `1. Generated code at: ${outputDir}/`,
          `2. Original spec: ${resolvedPath}`,
          `3. Project test conventions (read existing tests first)`,
          ``,
          `### OUTPUT`,
          `Write test files that verify every @kind:operation in the spec.`,
          ``,
          `### TRACE FORMAT`,
          `Every test MUST reference which spec block it validates:`,
          `// spec:trace spec=${resolvedPath}#<section> L<lines> test=<test-path> cascade=${item.cascadeId}`,
          ``,
          `### QUALITY GATES`,
          `- [ ] Every @kind:operation in the spec has at least one test`,
          `- [ ] Edge cases from the spec are covered`,
          `- [ ] Error paths from the spec are tested`,
          `- [ ] Tests PASS when run`,
          ``,
          `### HOW TO WORK`,
          `1. read() the generated code and the original spec`,
          `2. Map every @kind:operation to test cases`,
          `3. write() test files with spec:trace annotations`,
          `4. bash() the test runner — FIX any failures`,
          `5. Report: tests written, pass/fail, coverage of spec operations`,
        ].join('\n'),
      };

      const promptStart = Date.now();
      const prompt = [
        `# SpecLang Cascade — ${item.stage.toUpperCase()} Stage`,
        ``,
        `## Identity`,
        `You are a SpecLang cascade agent in the ${item.stage} stage.`,
        `Cascade ID: ${item.cascadeId}`,
        `Project root: ${projectRoot}`,
        `Target language: ${targetLang}`,
        ``,
        `## Context`,
        `Your spec file (FULL PATH): ${resolvedPath}`,
        `Output directory: ${item.stage === 'thinker' ? path.join(projectRoot, 'specs') : item.stage === 'assembler' ? projectAssembledDir : outputDir}`,
        ``,
        specDiff ? `## Trigger (what changed)` : '',
        specDiff ? `\`\`\`diff\n${specDiff}\n\`\`\`` : '',
        specDiff ? `This diff triggered the cascade. Focus your changes on what actually changed.` : '',
        ``,
        `## Stage Instructions`,
        stageInstructions[item.stage] || '',
        ``,
        `## Source Spec`,
        `\`\`\`markdown`,
        specBody,
        `\`\`\``,
        ``,
        `## Referenced Files`,
        `This spec contains @ref: annotations to other files. Use read() to read EVERY one.`,
        `Merge details from ALL @ref: files into your output — they contain context, conventions, and dependencies.`,
        `You can read ANY file in ${projectRoot} with the read() tool.`,
        ``,
        existingCode ? `## Existing Code` : '',
        existingCode ? existingCode : '',
        existingCode ? `Update existing files — NEVER regenerate from scratch.` : '',
        ``,
        skillContext ? `## Skill Reference` : '',
        skillContext ? skillContext : '',
        ``,
        `## The SpecLang Trace System`,
        ``,
        `Every generated artifact MUST carry trace annotations. This is NOT optional.`,
        `Traces create a fully auditable, bidirectional, grep-friendly graph:`,
        `  Requirement → Design → Implementation → Verification`,
        ``,
        `### Canonical Trace Format (Single Line, grep-friendly)`,
        ``,
        `spec:trace spec=<path#section> plan=<phase/task/step> test=<path> evidence=<path> cascade=<id>`,
        ``,
        `All fields except \`spec\` are optional but SHOULD be filled as they become known.`,
        `Placeholders are allowed: \`test=\`, \`evidence=\`, \`plan=\`.`,
        ``,
        `### Field Reference`,
        ``,
        `| Field | Required | Meaning | Example |`,
        `|-------|----------|---------|---------|`,
        `| spec | YES | Source spec path + #section anchor + L<lines> | specs/auth.spec.md#login-flow L45-89 |`,
        `| plan | SHOULD | Implementation plan reference | phase-2/auth-service/step-3 |`,
        `| test | SHOULD | Test file(s) verifying this | tests/auth/login.test.ts::test_invalid_creds |`,
        `| evidence | SHOULD | Verification evidence path | .speclang/evidence/auth-verification.md |`,
        `| cascade | SHOULD | Cascade run ID | ${item.cascadeId} |`,
        `| ac | MAY | Acceptance Criteria satisfied | AC-003 |`,
        `| requires | MAY | Dependencies on other spec sections | specs/security.spec.md#password-hash L90-112 |`,
        `| implements | MAY | @kind:operation or @block: implemented | @kind:operation loginUser |`,
        ``,
        `### Placement Rules`,
        ``,
        `Trace markers MUST appear near:`,
        `- Function/method definitions implementing spec-defined behavior`,
        `- Class definitions implementing spec-defined concepts`,
        `- API endpoint handlers`,
        `- Test functions that verify spec requirements`,
        ``,
        `Trace markers SHOULD appear in:`,
        `- Configuration files implementing spec-defined defaults`,
        `- Documentation files generated from specs`,
        `- Thinking files (plan, decision, context, pattern)`,
        ``,
        `### Language-Specific Examples`,
        ``,
        `**TypeScript / JavaScript:**`,
        `// spec:trace spec=specs/auth.spec.md#login-flow L45-89 plan=phase-2/auth/step-3 test=tests/auth/login.test.ts cascade=${item.cascadeId}`,
        `export async function loginUser(credentials: Credentials): Promise<Session> {`,
        ``,
        `**Python:**`,
        `# spec:trace spec=specs/auth.spec.py.md#login-flow L45-89 plan=phase-2/auth/step-3 test=tests/auth/test_login.py::test_invalid cascade=${item.cascadeId}`,
        `def login_user(credentials: Credentials) -> Session:`,
        ``,
        `**Go:**`,
        `// spec:trace spec=specs/auth.spec.go.md#login-flow L45-89 plan=phase-2/auth/step-3 test=tests/auth/login_test.go cascade=${item.cascadeId}`,
        `func LoginUser(creds Credentials) (*Session, error) {`,
        ``,
        `**Markdown thinking files:**`,
        `## Decision: Use JWT over Session Tokens`,
        `> spec:trace spec=specs/auth.spec.md#auth-strategy L12-34 plan=phase-1/architecture/step-2 evidence=.speclang/evidence/auth-decision.md cascade=${item.cascadeId}`,
        `> **Confidence:** HIGH (3 sources: auth.spec.md, security.spec.md, project.scl)`,
        `> **Sources:**`,
        `>   - specs/auth.spec.md#auth-strategy L12-34 — comparison of auth approaches`,
        `>   - specs/security.spec.md#token-format L45-67 — JWT structure requirements`,
        `>   - specs/project.scl#auth-component — architecture constraints`,
        ``,
        `### Bidirectional Traces`,
        ``,
        `FORWARD (code knows its source):`,
        `  // spec:trace spec=specs/auth.spec.md#login-flow L45-89`,
        ``,
        `REVERSE (spec knows its implementation):`,
        `After generating code, UPDATE the source spec:`,
        `  ## Generated → src/auth/login.ts L23-67 (codegen stage, cascade ${item.cascadeId})`,
        `  ## Verified by → tests/auth/login.test.ts L12-34`,
        ``,
        `### Trace Confidence Rules`,
        `- **HIGH**: Section-level trace with line numbers + at least 2 sources + plan reference`,
        `- **MEDIUM**: File-level trace only + single source. Needs cross-validation.`,
        `- **LOW**: Extrapolated from convention. No direct spec section. Flag for human review.`,
        ``,
        `### Why Traces Matter`,
        ``,
        `Without traces, every model starts from scratch guessing what code does.`,
        `With traces, a model reads a function and immediately knows:`,
        `  1. Which spec section produced it (read() the exact section)`,
        `  2. Where it fits in the implementation plan`,
        `  3. Which tests verify it`,
        `  4. Whether to update or replace it`,
        ``,
        (item.stage === 'thinker' && projectContext ? `## Project Architecture (project.scl)` : ''),
        (item.stage === 'thinker' && projectContext ? `\`\`\`json\n${projectContext}\n\`\`\`` : ''),
        (item.stage === 'thinker' && projectContext ? `This defines ALL components that must be covered. No gaps.` : ''),
        ``,
        `## Verification`,
        `After writing all files, verify:`,
        `\`cd ${projectRoot} && ${targetLang === 'py' ? 'python -m pytest tests/ -x -q 2>&1 | tail -10' : targetLang === 'ts' ? 'npm test 2>&1 | tail -10' : 'make test 2>&1 | tail -10'}\``,
        ``,
        `## Execution Rules`,
        `- read(filePath) — read the spec, @ref: files, existing code, and skill references`,
        `- write(filePath, content) — create a new file (overwrite is OK for generated files)`,
        `- edit(filePath, oldStr, newStr) — targeted update to an existing file`,
        `- bash(command) — run compiler, linter, test runner, or any shell command`,
        `- glob(pattern) — discover files matching a pattern`,
        ``,
        `CRITICAL: USE the tools NOW. Do NOT plan. Do NOT describe. Execute.`,
        `Every file MUST have spec:trace annotations on functions, classes, and endpoints.`,
        `Every thinking section needs Confidence scoring.`,
        `After all files: report what you created, trace completeness, unresolved @ref: links, and overall confidence.`,
      ].filter(Boolean).join('\n');

      await session.prompt(prompt);

      session.dispose();
      this.runningSessions--;

      const durationMs = Date.now() - promptStart;
      const totalDurationMs = Date.now() - sessionStart;

      // Check if any files were generated or modified
      const afterFiles = await scanProjectFiles();
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
