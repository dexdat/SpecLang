---
id: "@speclang/assembler/daemon"
version: 1.0.0
layer: 2
target_lang: ts
output: .speclang/daemon.spec.ts
owned-by: assembler
model_pool: code-gen
max_concurrent: 1
seed: false
tags: [assembler, daemon, speclangd, chokidar, watcher]
short: "speclangd — chokidar file watcher daemon with notification graph"
watch:
  files:
    - "specs/assembler/*.spec.md"
depends_on:
  - "@ref:specs/assembler/file-watch-rules"
  - "@ref:specs/daemon"
status: draft
---

# speclangd — File Watcher Daemon

## Overview

speclangd is the SpecLang file watcher daemon. It uses chokidar to watch `specs/` for file changes, maintains the notification graph, detects convergence, and emits events to the cascade router.

### Architecture

```
chokidar.watch('specs/')
       |
       v
+------------------+
| Change Detector  |  Raw file events from chokidar
+------------------+
       |
       v
+------------------+
| Header Parser    |  Extracts YAML front matter from changed spec files
+------------------+
       |
       v
+------------------+
| Notification     |  Queries notification graph for dependent specs
| Graph Query      |
+------------------+
       |
       v
+------------------+
| Convergence      |  30s quiet period timer
| Detector         |
+------------------+
       |
       v
   FileChangeEvent   { path, kind, dependent_specs[], timestamp }
       |
       v
   Cascade Router
```

## Implementation

```typescript
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

// ---- Structured Logger ----

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  ts: string;
  level: LogLevel;
  tag: string;
  message: string;
  cascadeId?: string;
  specPath?: string;
  elapsedMs?: number;
  meta?: Record<string, unknown>;
}

export class Logger {
  private tag: string;
  private startTime: number;

  constructor(tag: string) {
    this.tag = tag;
    this.startTime = Date.now();
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      tag: this.tag,
      message,
      elapsedMs: Date.now() - this.startTime,
      ...(meta || {}),
    };
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    const pid = process?.pid ?? 0;
    const prefix = `${entry.ts} [${pid}] ${level.padEnd(5)} [${this.tag}]`;
    switch (level) {
      case 'ERROR': console.error(`${prefix} ${message}${metaStr}`); break;
      case 'WARN':  console.warn(`${prefix} ${message}${metaStr}`); break;
      default:      console.log(`${prefix} ${message}${metaStr}`);
    }
  }

  info(msg: string, meta?: Record<string, unknown>): void { this.write('INFO', msg, meta); }
  warn(msg: string, meta?: Record<string, unknown>): void { this.write('WARN', msg, meta); }
  error(msg: string, meta?: Record<string, unknown>): void { this.write('ERROR', msg, meta); }
  debug(msg: string, meta?: Record<string, unknown>): void { this.write('DEBUG', msg, meta); }

  /**
   * Create a child logger that inherits the parent's tag with a suffix.
   */
  child(suffix: string): Logger {
    const child = new Logger(`${this.tag}:${suffix}`);
    child.startTime = this.startTime;
    return child;
  }
}

export default Logger;

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
  private watcher: chokidar.FSWatcher | null = null;
  private graph = new NotificationGraph();
  private convergence: ConvergenceDetector | null = null;
  private log: Logger;
  private graphLog: Logger;
  private convergenceLog: Logger;

  constructor(
    private readonly watchPath: string = 'specs/',
    quietPeriod: number = 30000
  ) {
    super();
    this.log = new Logger('speclangd');
    this.graphLog = this.log.child('graph');
    this.convergenceLog = this.log.child('convergence');

    this.log.info('daemon constructed', { watchPath, quietPeriod });

    this.convergence = new ConvergenceDetector(quietPeriod, (event) => {
      this.convergenceLog.info('convergence detected', {
        lastChange: new Date(event.lastChange).toISOString(),
        quietPeriodMs: event.quietPeriodMs,
        queueDepth: event.queueDepth,
      });
      this.emit('convergence', event);
    });
  }

  async start(): Promise<void> {
    this.log.info('daemon starting', { watchPath: this.watchPath });

    // Initialize graph from existing specs
    await this.indexExistingSpecs();
    this.log.info('graph initialized', { edgeCount: this.graph.getSize() });

    this.watcher = chokidar.watch(this.watchPath, {
      ignored: /(node_modules|\.git|dist)/,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('add', (p) => {
        this.log.debug('watcher:add', { path: p });
        this.handleChange(p, 'create');
      })
      .on('change', (p) => {
        this.log.debug('watcher:change', { path: p });
        this.handleChange(p, 'modify');
      })
      .on('unlink', (p) => {
        this.log.debug('watcher:unlink', { path: p });
        this.handleChange(p, 'delete');
      });

    this.emit('started', { watchPath: this.watchPath });
  }

  stop(): void {
    this.log.info('daemon stopping');
    if (this.watcher) this.watcher.close();
    if (this.convergence) this.convergence.stop();
    this.emit('stopped');
    this.log.info('daemon stopped');
  }

  getGraphSize(): number {
    return this.graph.getSize();
  }

  private async indexExistingSpecs(): Promise<void> {
    const { default: glob } = await import('fast-glob');
    const specFiles = await glob('**/*.spec.md', { cwd: this.watchPath });
    this.log.info('indexing existing specs', { count: specFiles.length });
    let indexed = 0, skipped = 0;
    for (const file of specFiles) {
      const fullPath = path.join(this.watchPath, file);
      const header = await parseHeader(fullPath);
      if (header) {
        this.graph.addSpec(fullPath, header);
        this.graphLog.debug('indexed spec', { file, specId: header.id });
        indexed++;
      } else {
        skipped++;
        this.graphLog.debug('skipped spec (no header)', { file });
      }
    }
    this.log.info('indexing complete', { indexed, skipped, totalEdges: this.graph.getSize() });
  }

  private async handleChange(filePath: string, kind: 'create' | 'modify' | 'delete'): Promise<void> {
    this.log.info('file event', { kind, path: filePath });

    if (kind === 'delete') {
      this.graph.removeSpec(filePath);
      this.graphLog.info('spec removed from graph', { path: filePath });
    } else {
      const header = await parseHeader(filePath);
      if (header) {
        this.graph.addSpec(filePath, header);
        this.graphLog.info('spec added/updated in graph', {
          path: filePath,
          specId: header.id,
          dependsOn: header.dependsOn,
        });
      }
    }

    const dependents = this.graph.getDependents(filePath);
    this.log.info('dependents resolved', {
      path: filePath,
      kind,
      dependentCount: dependents.length,
      dependents,
    });

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
  const log = new Logger('speclangd:main');
  const daemon = new SpeclangDaemon(process.argv[2] || 'specs/');
  daemon.on('file_change', (e: FileChangeEvent) => {
    log.info('file change emitted', {
      kind: e.kind,
      path: e.path,
      dependentCount: e.dependentSpecs.length,
      dependents: e.dependentSpecs,
      timestamp: new Date(e.timestamp).toISOString(),
    });
  });
  daemon.on('convergence', (e: ConvergenceEvent) => {
    log.info('convergence emitted', {
      queueDepth: e.queueDepth,
      quietPeriodMs: e.quietPeriodMs,
      lastChangeAgo: `${Date.now() - e.lastChange}ms`,
    });
  });
  daemon.on('started', (meta) => log.info('daemon started', meta as Record<string, unknown>));
  daemon.on('stopped', () => log.info('daemon stopped'));
  daemon.start().catch((err) => log.error('daemon startup failed', { error: err.message }));
}
```

## Verification

```bash
npx tsx .speclang/daemon.spec.ts specs/  # Start daemon on specs/ dir
# Touch a spec file, observe change events
# Verify notification graph returns correct dependents
```
