import express from 'express';
import path from 'path';
import fs from 'fs';

export interface SpecEntry {
  filePath: string;
  specId?: string;
  version?: string;
  layer?: number;
  ownedBy?: string;
  status?: string;
  targetLang?: string;
  tags?: string[];
  hasImplementation: boolean;
  hasHeader: boolean;
}

export interface HealthReport {
  totalSpecs: number;
  withHeader: number;
  withImplementation: number;
  missingHeader: number;
  noId: number;
  noVersion: number;
  byLayer: Record<number, number>;
  byStatus: Record<string, number>;
  byOwner: Record<string, number>;
  metrics: Array<{
    name: string;
    value: number | string;
    status: 'good' | 'warn' | 'critical';
  }>;
}

export interface CascadeInfo {
  status: 'idle' | 'running' | 'paused' | 'finalizing';
  depth: number;
  currentFile: string | null;
}

function parseYamlHeader(content: string): Record<string, unknown> | null {
  const lines = content.split('\n');

  let yamlStart = -1;
  let yamlEnd = -1;
  let headerLineEnd = -1;

  if (lines[0]?.startsWith('# speclang-header')) {
    const m = lines[0].match(/lines:(\d+)/);
    if (m) headerLineEnd = parseInt(m[1], 10);
  }

  for (let i = 0; i < Math.min(lines.length, headerLineEnd > 0 ? headerLineEnd : 30); i++) {
    if (lines[i].trim() === '---') {
      if (yamlStart === -1) {
        yamlStart = i + 1;
      } else {
        yamlEnd = i;
        break;
      }
    }
  }

  if (yamlStart === -1 || yamlEnd === -1) {
    if (yamlStart === -1) return null;
    yamlEnd = headerLineEnd > 0 ? headerLineEnd : Math.min(lines.length, 30);
  }

  const yamlLines = lines.slice(yamlStart, yamlEnd);
  const parsed: Record<string, unknown> = {};

  for (const line of yamlLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val: unknown = line.slice(colonIdx + 1).trim();

    if (typeof val === 'string') {
      if (val.startsWith('[') && val.endsWith(']')) {
        try {
          val = JSON.parse(val.replace(/'/g, '"'));
        } catch {
          val = (val as string).slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
        }
      } else if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      } else if (val === 'true') {
        val = true;
      } else if (val === 'false') {
        val = false;
      } else if (/^\d+$/.test(val as string)) {
        val = parseInt(val as string, 10);
      } else if (/^\d+\.\d+$/.test(val as string)) {
        val = parseFloat(val as string);
      }
    }

    parsed[key] = val;
  }

  return parsed;
}

function findSpecFiles(rootDir: string): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.name.endsWith('.spec.md') ||
        entry.name.endsWith('.spec.yaml') ||
        entry.name.endsWith('.scl') ||
        (entry.name === '_index.md' && dir.endsWith('.spec.dir'))
      ) {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

function hasImplementation(specFilePath: string, srcDir: string): boolean {
  const parsed = path.parse(specFilePath);
  const baseName = parsed.name.replace('.spec', '');

  const candidates = [
    path.join(srcDir, baseName, 'index.ts'),
    path.join(srcDir, baseName, 'index.js'),
    path.join(srcDir, baseName + '.ts'),
    path.join(srcDir, baseName + '.js'),
  ];

  const specDir = parsed.dir;
  if (fs.existsSync(path.join(specDir, 'src'))) {
    try {
      const srcEntries = fs.readdirSync(path.join(specDir, 'src'));
      if (srcEntries.some(e => e.endsWith('.ts') || e.endsWith('.js'))) {
        return true;
      }
    } catch { /* ignore */ }
  }

  if (specDir.endsWith('.spec.dir')) {
    const implDir = path.join(specDir, 'src');
    if (fs.existsSync(implDir)) {
      try {
        const implEntries = fs.readdirSync(implDir);
        if (implEntries.some(e => e.endsWith('.ts') || e.endsWith('.js'))) {
          return true;
        }
      } catch { /* ignore */ }
    }
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return true;
  }

  return false;
}

export function scanSpecs(projectDir: string): SpecEntry[] {
  const specsDir = path.join(projectDir, 'specs');
  const srcDir = path.join(projectDir, 'src');

  if (!fs.existsSync(specsDir)) return [];

  const specFiles = findSpecFiles(specsDir);
  const entries: SpecEntry[] = [];

  for (const filePath of specFiles) {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const header = parseYamlHeader(content);
    const relativePath = path.relative(projectDir, filePath);

    entries.push({
      filePath: relativePath,
      specId: typeof header?.id === 'string' ? header.id : undefined,
      version: typeof header?.version === 'string' ? header.version : undefined,
      layer: typeof header?.layer === 'number' ? header.layer : undefined,
      ownedBy: typeof header?.owner === 'string' ? header.owner : undefined,
      status: typeof header?.status === 'string' ? header.status : undefined,
      targetLang: typeof header?.target === 'string' ? header.target : undefined,
      tags: Array.isArray(header?.tags) ? (header.tags as string[]) : undefined,
      hasImplementation: hasImplementation(filePath, srcDir),
      hasHeader: header !== null,
    });
  }

  return entries;
}

export function buildHealthReport(specs: SpecEntry[]): HealthReport {
  const totalSpecs = specs.length;
  const withHeader = specs.filter(s => s.hasHeader).length;
  const withImplementation = specs.filter(s => s.hasImplementation).length;
  const missingHeader = specs.filter(s => !s.hasHeader).length;
  const noId = specs.filter(s => s.hasHeader && !s.specId).length;
  const noVersion = specs.filter(s => s.hasHeader && !s.version).length;

  const byLayer: Record<number, number> = {};
  const byStatus: Record<string, number> = {};
  const byOwner: Record<string, number> = {};

  for (const spec of specs) {
    if (spec.layer !== undefined) {
      byLayer[spec.layer] = (byLayer[spec.layer] || 0) + 1;
    }
    if (spec.status) {
      byStatus[spec.status] = (byStatus[spec.status] || 0) + 1;
    }
    if (spec.ownedBy) {
      byOwner[spec.ownedBy] = (byOwner[spec.ownedBy] || 0) + 1;
    }
  }

  const implRatio = totalSpecs > 0
    ? `${Math.round((withImplementation / totalSpecs) * 100)}%`
    : '0%';

  const metrics: HealthReport['metrics'] = [
    { name: 'Total Specs', value: totalSpecs, status: totalSpecs > 0 ? 'good' : 'critical' },
    { name: 'With Header', value: withHeader, status: withHeader === totalSpecs ? 'good' : 'warn' },
    { name: 'With Implementation', value: withImplementation, status: 'good' },
    { name: 'Implementation Ratio', value: implRatio, status: 'good' },
  ];

  if (missingHeader > 0) {
    metrics.push({ name: 'Missing Header', value: missingHeader, status: 'warn' });
  }
  if (noId > 0) {
    metrics.push({ name: 'Missing ID', value: noId, status: 'warn' });
  }
  if (noVersion > 0) {
    metrics.push({ name: 'Missing Version', value: noVersion, status: 'warn' });
  }

  return {
    totalSpecs,
    withHeader,
    withImplementation,
    missingHeader,
    noId,
    noVersion,
    byLayer,
    byStatus,
    byOwner,
    metrics,
  };
}

export function createDashboardServer(projectDir?: string) {
  const app = express();
  const dir = projectDir || process.cwd();

  let cascadeInfo: CascadeInfo = {
    status: 'idle',
    depth: 0,
    currentFile: null,
  };

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    try {
      const specs = scanSpecs(dir);
      const health = buildHealthReport(specs);
      res.json(health);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/specs', (_req, res) => {
    try {
      const specs = scanSpecs(dir);
      res.json(specs);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/cascade', (_req, res) => {
    res.json(cascadeInfo);
  });

  app.post('/api/cascade/trigger', (_req, res) => {
    cascadeInfo = { status: 'running', depth: 0, currentFile: null };
    res.json(cascadeInfo);
  });

  app.post('/api/cascade/pause', (_req, res) => {
    cascadeInfo = { ...cascadeInfo, status: 'paused' };
    res.json(cascadeInfo);
  });

  app.post('/api/cascade/resume', (_req, res) => {
    cascadeInfo = { ...cascadeInfo, status: 'running' };
    res.json(cascadeInfo);
  });

  app.post('/api/cascade/abort', (_req, res) => {
    cascadeInfo = { status: 'idle', depth: 0, currentFile: null };
    res.json(cascadeInfo);
  });

  app.post('/api/cascade/finalize', (_req, res) => {
    cascadeInfo = { ...cascadeInfo, status: 'finalizing' };
    res.json(cascadeInfo);
    setTimeout(() => {
      cascadeInfo = { status: 'idle', depth: 0, currentFile: null };
    }, 1500);
  });

  const dashboardDist = path.join(dir, 'dist', 'dashboard');
  if (fs.existsSync(dashboardDist)) {
    app.use(express.static(dashboardDist));
    app.get('{*path}', (_req, res) => {
      const indexPath = path.join(dashboardDist, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Dashboard not built. Run: npm run build:dashboard');
      }
    });
  }

  return app;
}

export function startServer(port: number = 3000, projectDir?: string) {
  const app = createDashboardServer(projectDir);
  const dir = projectDir || process.cwd();

  const server = app.listen(port, () => {
    console.log(`SpecLang Dashboard Server`);
    console.log(`  Project: ${dir}`);
    console.log(`  Dashboard: http://localhost:${port}`);
    console.log(`  API: http://localhost:${port}/api/health`);
    console.log(`  Specs: http://localhost:${port}/api/specs`);
    console.log(`  Cascade: http://localhost:${port}/api/cascade`);
  });

  process.on('SIGTERM', () => server.close());
  process.on('SIGINT', () => server.close());

  return server;
}

if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  const projectDir = process.env.PROJECT_DIR || process.cwd();
  startServer(port, projectDir);
}
