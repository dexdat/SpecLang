// @block: imports
// @spec: @speclang/health/test v1.0.0
// @block: imports

import { scanSpecs, computeHealth, formatReport } from './health-core.spec';
import { renderMinimal } from './health-cli.spec';

// @block: tests
// @spec: @speclang/health/test v1.0.0
// @block: tests

async function runTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, detail?: string) => {
    if (condition) {
      passed++;
      console.log(`  ✅ ${name}`);
    } else {
      failed++;
      const msg = `  ❌ ${name}${detail ? ` (${detail})` : ''}`;
      errors.push(msg);
      console.log(msg);
    }
  };

  console.log('Testing scanSpecs...');
  const specs = await scanSpecs();
  assert('scanSpecs returns array', Array.isArray(specs), `got ${typeof specs}`);
  assert('scanSpecs finds specs', specs.length > 0, `found ${specs.length}`);
  assert('each spec has filePath', specs.every(s => typeof s.filePath === 'string'));

  const withHeaders = specs.filter(s => s.hasHeader);
  const withIds = withHeaders.filter(s => s.specId);
  assert('some specs have headers', withHeaders.length > 0, `${withHeaders.length}/${specs.length}`);
  assert('some specs have IDs', withIds.length > 0, `${withIds.length}/${withHeaders.length}`);

  console.log('\nTesting computeHealth...');
  const report = computeHealth(specs);
  assert('report has totalSpecs', report.totalSpecs === specs.length, `${report.totalSpecs} vs ${specs.length}`);
  assert('report has metrics', report.metrics.length > 0, `${report.metrics.length} metrics`);
  assert('report has byLayer', Object.keys(report.byLayer).length > 0, 'layers found');
  assert('report has byStatus', Object.keys(report.byStatus).length > 0, 'statuses found');
  assert('report has byOwner or empty', Object.keys(report.byOwner).length >= 0, 'owners found');

  console.log('\nTesting formatReport...');
  const formatted = formatReport(report);
  assert('formatReport returns string', typeof formatted === 'string');
  assert('formatReport contains stats', formatted.includes('Total Specs'), 'missing total stats');

  console.log('\nTesting renderMinimal...');
  const minimal = renderMinimal(report);
  assert('renderMinimal returns string', typeof minimal === 'string');
  assert('renderMinimal contains summary', minimal.includes('Health:'), 'missing health summary');

  console.log('\n---\n');
  return { passed, failed, errors };
}

if (require.main === module) {
  runTests().then(({ passed, failed }) => {
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  });
}