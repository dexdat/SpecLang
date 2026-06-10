import type { FSWatcher } from "chokidar";
import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import yaml from 'js-yaml';

// ---- Types ----

export interface FileChangeEvent {
  path: string;
  kind: 'create' | 'modify' | 'delete';
  dependentSpecs: string[];
  timestamp: number;
}

export interface ConvergenceEvent {
  lastChange: number;
  quietPeriodMs: number;
  queueDepth: number;
}

export interface SpecHeader {
  id?: string;
  version?: string;
  layer?: number;
  targetLang?: string;
  output?: string;
  ownedBy?: string;
  model?: string;
  modelPool?: string;
  maxConcurrent?: number;
  dependsOn?: string[];
  watch?: {
    files?: string[];
    exclude?: string[];
  };
  status?: string;
  [key: string]: unknown;
}

interface NotificationEdge {
  sourcePath: string;
  dependentSpecId: string;
  matchType: 'literal' | 'glob' | 'ref';
}

// ---- Notification Graph ----

export class NotificationGraph {
  private edges: NotificationEdge[] = [];
  private specHeaders: Map<string, SpecHeader> = new Map();

  addSpec(specPath: string, header: SpecHeader): void {
    this.specHeaders.set(specPath, header);
    this.removeEdgesForSpec(specPath);

    // From depends_on
    if (header.dependsOn) {
      for (const dep of header.dependsOn) {
        this.edges.push({
          sourcePath: dep,
          dependentSpecId: header.id || specPath,
          matchType: 'ref',
        });
      }
    }

    // From watch.files
    if (header.watch?.files) {
      for (const pattern of header.watch.files) {
        this.edges.push({
          sourcePath: pattern,
          dependentSpecId: header.id || specPath,
          matchType: pattern.includes('*') ? 'glob' : 'literal',
        });
      }
    }
  }

  removeSpec(specPath: string): void {
    this.specHeaders.delete(specPath);
    this.removeEdgesForSpec(specPath);
  }

  private removeEdgesForSpec(specPath: string): void {
    this.edges = this.edges.filter(
      (e) => e.dependentSpecId !== specPath && e.dependentSpecId !== this.specHeaders.get(specPath)?.id
    );
  }

  getDependents(changedPath: string): string[] {
    const result = new Set<string>();
    for (const edge of this.edges) {
      if (edge.matchType === 'literal' && edge.sourcePath === changedPath) {
        result.add(edge.dependentSpecId);
      } else if (edge.matchType === 'glob') {
        const { minimatch } = require('minimatch');
        // Replace {lang} placeholder which minimatch interprets as brace expansion
        const cleanPattern = edge.sourcePath.replace(/\{lang\}/g, '*');
        if (minimatch(changedPath, cleanPattern)) {
          result.add(edge.dependentSpecId);
        }
      } else if (edge.matchType === 'ref') {
        // @ref: links are checked against the spec's id
        if (changedPath.includes(edge.sourcePath.replace('@ref:', ''))) {
          result.add(edge.dependentSpecId);
        }
      }
    }
    return Array.from(result);
  }

  getSize(): number {
    return this.edges.length;
  }
}

// ---- Header Parser ----

export async function parseHeader(filePath: string): Promise<SpecHeader | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const match = content.match(/^---\n(.*?)\n---\n/s);
    if (!match) return null;
    return yaml.load(match[1]) as SpecHeader;
  } catch {
    return null;
  }
}

// ---- Convergence Detector ----

export class ConvergenceDetector {
  private lastEventTime = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly quietPeriod: number;
  private queueDepth = 0;

  constructor(
    quietPeriod: number = 30000,
    private readonly onConvergence: (event: ConvergenceEvent) => void
  ) {
    this.quietPeriod = quietPeriod;
  }

  notifyActivity(depth: number): void {
    this.lastEventTime = Date.now();
    this.queueDepth = depth;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.onConvergence({
        lastChange: this.lastEventTime,
        quietPeriodMs: this.quietPeriod,
        queueDepth: this.queueDepth,
      });
    }, this.quietPeriod);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}

// ---- Daemon ----

export class SpeclangDaemon extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private graph = new NotificationGraph();
  private convergence: ConvergenceDetector | null = null;

  constructor(
    private readonly watchPath: string = 'specs/',
    quietPeriod: number = 30000
  ) {
    super();
    this.convergence = new ConvergenceDetector(quietPeriod, (event) => {
      this.emit('convergence', event);
    });
  }

  async start(): Promise<void> {
    // Initialize graph from existing specs
    await this.indexExistingSpecs();

    this.watcher = chokidar.watch(this.watchPath, {
      ignored: /(node_modules|\.git|dist)/,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('add', (p) => this.handleChange(p, 'create'))
      .on('change', (p) => this.handleChange(p, 'modify'))
      .on('unlink', (p) => this.handleChange(p, 'delete'));

    this.emit('started', { watchPath: this.watchPath });
  }

  stop(): void {
    if (this.watcher) this.watcher.close();
    if (this.convergence) this.convergence.stop();
    this.emit('stopped');
  }

  getGraphSize(): number {
    return this.graph.getSize();
  }

  private async indexExistingSpecs(): Promise<void> {
    const { default: glob } = await import('fast-glob');
    const specFiles = await glob('**/*.spec.md', { cwd: this.watchPath });
    for (const file of specFiles) {
      const fullPath = path.join(this.watchPath, file);
      const header = await parseHeader(fullPath);
      if (header) {
        this.graph.addSpec(fullPath, header);
      }
    }
  }

  private async handleChange(filePath: string, kind: 'create' | 'modify' | 'delete'): Promise<void> {
    if (kind === 'delete') {
      this.graph.removeSpec(filePath);
    } else {
      const header = await parseHeader(filePath);
      if (header) {
        this.graph.addSpec(filePath, header);
      }
    }

    const dependents = this.graph.getDependents(filePath);
    const event: FileChangeEvent = {
      path: filePath,
      kind,
      dependentSpecs: dependents,
      timestamp: Date.now(),
    };

    this.emit('file_change', event);
    if (this.convergence) {
      this.convergence.notifyActivity(dependents.length);
    }
  }
}

// ---- Main Entry ----

if (require.main === module) {
  const daemon = new SpeclangDaemon(process.argv[2] || 'specs/');
  daemon.on('file_change', (e: FileChangeEvent) => {
    console.log(`[speclangd] ${e.kind}: ${e.path} (${e.dependentSpecs.length} dependents)`);
  });
  daemon.on('convergence', (e: ConvergenceEvent) => {
    console.log(`[speclangd] Convergence: ${e.queueDepth} items in queue`);
  });
  daemon.on('started', () => console.log('[speclangd] Started'));
  daemon.start().catch(console.error);
}