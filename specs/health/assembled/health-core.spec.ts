// @block: types
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'fast-glob';
import yaml from 'js-yaml';

// @spec: @speclang/health/core v1.0.0
// @block: types

export interface SpecInfo {
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

export interface HealthMetric {
  name: string;
  value: number | string;
  status: 'good' | 'warn' | 'critical';
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
  metrics: HealthMetric[];
}

// @block: scanner
// @spec: @speclang/health/core v1.0.0
// @block: scanner

export async function scanSpecs(dir: string = 'specs/'): Promise<SpecInfo[]> {
  const files = await glob('**/*.spec.md', { cwd: dir, ignore: ['node_modules/**', '.git/**'] });
  const results: SpecInfo[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const content = await fs.readFile(fullPath, 'utf-8').catch(() => '');
    const headerMatch = content.match(/^---\n(.*?)\n---\n([\s\S]*)$/s);

    if (!headerMatch) {
      results.push({
        filePath: file,
        hasHeader: false,
        hasImplementation: false,
      });
      continue;
    }

    let header: Record<string, unknown> = {};
    try {
      header = yaml.load(headerMatch[1]) as Record<string, unknown>;
    } catch {
      // YAML parse failed
    }

    const body = headerMatch[2] || '';
    const hasImpl = body.includes('type') && (
      body.includes('Implementation') || body.includes('@block:')
    );

    results.push({
      filePath: file,
      specId: header.id as string | undefined,
      version: header.version as string | undefined,
      layer: header.layer as number | undefined,
      ownedBy: header.ownedBy as string || header['owned-by'] as string || undefined,
      status: header.status as string | undefined,
      targetLang: header.targetLang as string | undefined,
      tags: header.tags as string[] | undefined,
      hasHeader: true,
      hasImplementation: hasImpl,
    });
  }

  return results;
}

// @block: analyzer
// @spec: @speclang/health/core v1.0.0
// @block: analyzer

export function computeHealth(specs: SpecInfo[]): HealthReport {
  const byLayer: Record<number, number> = {};
  const byStatus: Record<string, number> = {};
  const byOwner: Record<string, number> = {};

  for (const spec of specs) {
    if (spec.layer !== undefined) byLayer[spec.layer] = (byLayer[spec.layer] || 0) + 1;
    if (spec.status) byStatus[spec.status] = (byStatus[spec.status] || 0) + 1;
    if (spec.ownedBy) byOwner[spec.ownedBy] = (byOwner[spec.ownedBy] || 0) + 1;
  }

  const noId = specs.filter(s => s.hasHeader && !s.specId).length;
  const noVersion = specs.filter(s => s.hasHeader && !s.version).length;

  const metrics: HealthMetric[] = [
    { name: 'Total Specs', value: specs.length, status: specs.length > 0 ? 'good' : 'critical' },
    { name: 'With Header', value: specs.filter(s => s.hasHeader).length, status: 'good' },
    { name: 'With Implementation', value: specs.filter(s => s.hasImplementation).length, status: 'good' },
    { name: 'Missing Header', value: specs.filter(s => !s.hasHeader).length, status: specs.filter(s => !s.hasHeader).length > 50 ? 'warn' : 'good' },
    { name: 'Missing ID', value: noId, status: noId > 0 ? 'warn' : 'good' },
    { name: 'Missing Version', value: noVersion, status: noVersion > 0 ? 'warn' : 'good' },
    { name: 'Implementation Ratio', value: `${Math.round((specs.filter(s => s.hasImplementation).length / Math.max(specs.length, 1)) * 100)}%`, status: 'good' },
  ];

  return {
    totalSpecs: specs.length,
    withHeader: specs.filter(s => s.hasHeader).length,
    withImplementation: specs.filter(s => s.hasImplementation).length,
    missingHeader: specs.filter(s => !s.hasHeader).length,
    noId,
    noVersion,
    byLayer,
    byStatus,
    byOwner,
    metrics,
  };
}

// @block: formatter
// @spec: @speclang/health/core v1.0.0
// @block: formatter

export function formatReport(report: HealthReport): string {
  const lines: string[] = [];
  lines.push('╔══════════════════════════════════════╗');
  lines.push('║   SpecLang Health Report             ║');
  lines.push('╚══════════════════════════════════════╝');
  lines.push('');

  for (const m of report.metrics) {
    const icon = m.status === 'good' ? '✅' : m.status === 'warn' ? '⚠️ ' : '❌';
    lines.push(`  ${icon} ${m.name.padEnd(25)} ${m.value}`);
  }

  lines.push('');
  lines.push(`  Layers:`);
  for (const [layer, count] of Object.entries(report.byLayer).sort(([a], [b]) => Number(a) - Number(b))) {
    const bar = '█'.repeat(Math.min(count, 40));
    lines.push(`    L${layer.padEnd(3)} ${bar} ${count}`);
  }

  lines.push('');
  lines.push(`  Statuses:`);
  for (const [status, count] of Object.entries(report.byStatus).sort(([, a], [, b]) => b - a)) {
    lines.push(`    ${status.padEnd(15)} ${count}`);
  }

  lines.push('');
  lines.push(`  Top Owners:`);
  const topOwners = Object.entries(report.byOwner).sort(([, a], [, b]) => b - a).slice(0, 10);
  for (const [owner, count] of topOwners) {
    lines.push(`    ${owner.padEnd(20)} ${count}`);
  }

  return lines.join('\n');
}

// @block: entry
// @spec: @speclang/health/core v1.0.0
// @block: entry

export async function runHealthReport(dir: string = 'specs/'): Promise<HealthReport> {
  const specs = await scanSpecs(dir);
  return computeHealth(specs);
}