/**
 * OBS-1: Prometheus /metrics exposition tests.
 *
 * Covers the scrape payload the MCP HTTP server serves at `GET /metrics`:
 * Tier-1 families from specs/ui.spec.dir/components/system-metrics.spec.md
 * (cpu, memory, disk, network) plus process/uptime series, the text-format
 * grammar, and the registry's label/value formatting rules.
 */

import { describe, it, expect } from 'vitest';
import {
  MetricsRegistry,
  PROMETHEUS_CONTENT_TYPE,
  collectMetrics,
  renderMetrics
} from '../../src/mcp/metrics.js';

const SAMPLE_LINE = /^speclang_[a-zA-Z0-9_]+(\{[^}]*\})? (?:-?[0-9][0-9.eE+-]*|NaN|\+Inf|-Inf)$/;
const NAME_AND_TYPE = /^# TYPE (speclang_[a-zA-Z0-9_]+) (counter|gauge)$/;

interface ParsedExposition {
  families: Map<string, { help: string; type: string; samples: string[] }>;
  sampleLines: string[];
}

/** Parse the payload the way a scraper would: comments then samples. */
function parseExposition(body: string): ParsedExposition {
  const families = new Map<string, { help: string; type: string; samples: string[] }>();
  const sampleLines: string[] = [];

  for (const line of body.split('\n')) {
    if (line === '') continue;

    if (line.startsWith('# HELP ')) {
      const rest = line.slice('# HELP '.length);
      const space = rest.indexOf(' ');
      const name = space === -1 ? rest : rest.slice(0, space);
      const help = space === -1 ? '' : rest.slice(space + 1);
      const family = families.get(name) ?? { help: '', type: '', samples: [] };
      family.help = help;
      families.set(name, family);
      continue;
    }

    if (line.startsWith('# TYPE ')) {
      const match = NAME_AND_TYPE.exec(line);
      expect(match, `malformed TYPE line: ${line}`).not.toBeNull();
      const name = match![1];
      const family = families.get(name) ?? { help: '', type: '', samples: [] };
      family.type = match![2];
      families.set(name, family);
      continue;
    }

    expect(line.startsWith('#'), `unexpected comment line: ${line}`).toBe(false);
    expect(SAMPLE_LINE.test(line), `malformed sample line: ${line}`).toBe(true);
    sampleLines.push(line);

    const name = line.slice(0, line.indexOf('{') === -1 ? line.indexOf(' ') : line.indexOf('{'));
    const family = families.get(name);
    expect(family, `sample for undeclared family: ${name}`).toBeDefined();
    family!.samples.push(line);
  }

  return { families, sampleLines };
}

describe('renderMetrics', () => {
  const body = renderMetrics();

  it('declares the canonical Prometheus content type', () => {
    expect(PROMETHEUS_CONTENT_TYPE).toBe('text/plain; version=0.0.4; charset=utf-8');
  });

  it('uses LF line endings and ends with exactly one newline', () => {
    expect(body.includes('\r')).toBe(false);
    expect(body.endsWith('\n')).toBe(true);
    expect(body.endsWith('\n\n')).toBe(false);
  });

  it('emits only valid exposition lines', () => {
    const { sampleLines } = parseExposition(body);
    expect(sampleLines.length).toBeGreaterThan(0);
  });

  it('exposes at least one series for every Tier-1 family', () => {
    const { families } = parseExposition(body);
    const names = [...families.keys()];

    for (const family of ['cpu', 'memory', 'disk', 'network']) {
      const matching = names.filter(name => name.startsWith(`speclang_${family}_`));
      const withSamples = matching.filter(name => (families.get(name)?.samples.length ?? 0) > 0);
      expect(withSamples, `no speclang_${family}_ series with samples`).not.toHaveLength(0);
    }
  });

  it('declares HELP and TYPE for every family it exposes', () => {
    const { families } = parseExposition(body);
    for (const [name, family] of families) {
      expect(family.help.length, `${name} has no HELP text`).toBeGreaterThan(0);
      expect(['counter', 'gauge'], `${name} has no TYPE`).toContain(family.type);
    }
  });

  it('reports host uptime and process self-observation series', () => {
    const { families } = parseExposition(body);
    expect(families.get('speclang_uptime_seconds')?.samples.length).toBe(1);
    expect(families.get('speclang_process_resident_memory_bytes')?.samples.length).toBe(1);
    expect(families.get('speclang_process_heap_used_bytes')?.samples.length).toBe(1);
    expect(families.get('speclang_process_uptime_seconds')?.samples.length).toBe(1);
  });

  it('types monotonic byte counters as counters', () => {
    const { families } = parseExposition(body);
    expect(families.get('speclang_process_cpu_user_seconds_total')?.type).toBe('counter');
    expect(families.get('speclang_process_cpu_system_seconds_total')?.type).toBe('counter');
  });

  it('is deterministic: two scrapes share family order', () => {
    const namesA = [...parseExposition(renderMetrics()).families.keys()];
    const namesB = [...parseExposition(renderMetrics()).families.keys()];
    expect(namesA).toEqual(namesB);
    expect(namesA).toEqual([...namesA].sort((a, b) => a.localeCompare(b)));
  });

  it('reports real memory and cpu values from the host', () => {
    const { families } = parseExposition(body);
    const total = Number(families.get('speclang_memory_total_bytes')!.samples[0].split(' ')[1]);
    const used = Number(families.get('speclang_memory_used_bytes')!.samples[0].split(' ')[1]);
    expect(total).toBeGreaterThan(0);
    expect(used).toBeGreaterThan(0);
    expect(used).toBeLessThanOrEqual(total);

    const cores = Number(families.get('speclang_cpu_cores')!.samples[0].split(' ')[1]);
    expect(cores).toBeGreaterThan(0);
  });
});

describe('collectMetrics', () => {
  it('reports the disk collector as unavailable instead of inventing capacity', () => {
    const registry = collectMetrics('/nonexistent-obs-1-path');
    const body = registry.render();
    const { families } = parseExposition(body);

    expect(families.get('speclang_disk_collector_available')?.samples).toEqual([
      'speclang_disk_collector_available 0'
    ]);
    // No fabricated numbers: the capacity families carry no samples at all.
    expect(families.get('speclang_disk_total_bytes')?.samples ?? []).toHaveLength(0);
  });

  it('labels disk samples with the probed path', () => {
    const registry = collectMetrics('/');
    const { families } = parseExposition(registry.render());
    const total = families.get('speclang_disk_total_bytes')!.samples[0];
    expect(total).toContain('path="/"');
    expect(Number(total.split(' ').pop())).toBeGreaterThan(0);
  });
});

describe('MetricsRegistry', () => {
  it('renders HELP, TYPE and samples in Prometheus text format', () => {
    const registry = new MetricsRegistry();
    registry.set('speclang_demo_total', 'Demo counter.', 'counter', 3);
    registry.add('speclang_demo_gauge', 'Demo gauge.', 'gauge', 1.5, { kind: 'a' });

    expect(registry.render()).toBe(
      [
        '# HELP speclang_demo_gauge Demo gauge.',
        '# TYPE speclang_demo_gauge gauge',
        'speclang_demo_gauge{kind="a"} 1.5',
        '# HELP speclang_demo_total Demo counter.',
        '# TYPE speclang_demo_total counter',
        'speclang_demo_total 3',
        ''
      ].join('\n')
    );
  });

  it('sorts label keys and escapes quotes, backslashes and newlines', () => {
    const registry = new MetricsRegistry();
    registry.add('speclang_demo', 'Demo.', 'gauge', 1, {
      zulu: 'last',
      alpha: 'quote"and\\slash',
      mike: 'line\nbreak'
    });

    expect(registry.render()).toContain(
      'speclang_demo{alpha="quote\\"and\\\\slash",mike="line\\nbreak",zulu="last"} 1'
    );
  });

  it('spells non-finite values the way the exposition format requires', () => {
    const registry = new MetricsRegistry();
    registry.add('speclang_nan', 'NaN sample.', 'gauge', NaN);
    registry.add('speclang_pos_inf', 'Positive infinity.', 'gauge', Infinity);
    registry.add('speclang_neg_inf', 'Negative infinity.', 'gauge', -Infinity);

    const body = registry.render();
    expect(body).toContain('\nspeclang_nan NaN\n');
    expect(body).toContain('\nspeclang_pos_inf +Inf\n');
    expect(body).toContain('\nspeclang_neg_inf -Inf\n');
  });

  it('keeps the first HELP/TYPE declaration for a repeated family', () => {
    const registry = new MetricsRegistry();
    registry.set('speclang_dup', 'First help.', 'gauge', 1);
    registry.add('speclang_dup', 'Second help.', 'counter', 2);

    const lines = registry.render().split('\n').filter(line => line.startsWith('#'));
    expect(lines).toEqual(['# HELP speclang_dup First help.', '# TYPE speclang_dup gauge']);
  });

  it('renders an empty registry as an empty payload', () => {
    expect(new MetricsRegistry().render()).toBe('');
  });
});
