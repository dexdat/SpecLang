// @block: imports
// @spec: @speclang/health/cli v1.0.0
// @block: imports

import { scanSpecs, computeHealth, formatReport, HealthReport } from './health-core.spec';

// @block: dashboard
// @spec: @speclang/health/cli v1.0.0
// @block: dashboard

export function renderDashboard(report: HealthReport): void {
  console.clear();
  console.log(formatReport(report));
  console.log('');
  console.log(`  Last updated: ${new Date().toISOString()}`);
  console.log('  Press Ctrl+C to exit');
}

export function renderMinimal(report: HealthReport): string {
  const good = report.metrics.filter(m => m.status === 'good').length;
  const warn = report.metrics.filter(m => m.status === 'warn').length;
  const critical = report.metrics.filter(m => m.status === 'critical').length;

  return [
    `📊 Health: ${report.totalSpecs} specs | ${report.withImplementation} with impl | `,
    `  ✅ ${good} good | ⚠️  ${warn} warn | ❌ ${critical} critical`,
    `  Layers: ${Object.keys(report.byLayer).join(', ')}`,
    `  Owners: ${Object.keys(report.byOwner).length} unique`,
  ].join('\n');
}

// @block: live
// @spec: @speclang/health/cli v1.0.0
// @block: live

export async function liveDashboard(dir: string = 'specs/', intervalMs: number = 5000): Promise<void> {
  const run = async () => {
    const specs = await scanSpecs(dir);
    const report = computeHealth(specs);
    renderDashboard(report);
  };

  await run();
  const timer = setInterval(run, intervalMs);

  process.on('SIGINT', () => {
    clearInterval(timer);
    console.log('\nHealth dashboard stopped.');
    process.exit(0);
  });
}

// @block: main
// @spec: @speclang/health/cli v1.0.0
// @block: main

if (require.main === module) {
  const dir = process.argv[2] || 'specs/';
  const interval = parseInt(process.argv[3] || '5000', 10);
  liveDashboard(dir, interval).catch(console.error);
}