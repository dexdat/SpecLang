/**
 * SPECLANG-GENERATED: Completeness reporter
 * Source: @specs/validation/completeness-reporter
 */

import { CompletenessResult } from './types';

export class CompletenessReporter {
  formatHuman(result: CompletenessResult): string {
    const lines: string[] = [];
    
    lines.push('Completeness Check Report');
    lines.push('═'.repeat(50));
    lines.push(`Spec: ${result.specId}`);
    lines.push(`Score: ${result.score.toFixed(2)}/1.00`);
    lines.push(`Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
    lines.push('');
    
    lines.push('Checks:');
    lines.push(`  Metadata:   ${this.formatCheck(result.checks.metadata.passed)} (${result.checks.metadata.present.length}/${result.checks.metadata.present.length + result.checks.metadata.missing.length})`);
    lines.push(`  Blocks:     ${this.formatCheck(result.checks.blocks.passed)} (${result.checks.blocks.total} blocks, ${Object.keys(result.checks.blocks.kinds).length} kinds)`);
    lines.push(`  References: ${this.formatCheck(result.checks.references.passed)} (${result.checks.references.resolved}/${result.checks.references.total})`);
    lines.push(`  Steps:      ${this.formatCheck(result.checks.steps.passed)} (${result.checks.steps.coverage * 100}% coverage)`);
    lines.push('');
    
    if (result.missing.length > 0) {
      lines.push('Missing:');
      for (const m of result.missing) {
        lines.push(`  • ${m}`);
      }
      lines.push('');
    }
    
    if (result.suggestions.length > 0) {
      lines.push('Suggestions:');
      for (const s of result.suggestions) {
        lines.push(`  • ${s}`);
      }
    }
    
    return lines.join('\n');
  }
  
  formatJson(result: CompletenessResult): string {
    return JSON.stringify(result, null, 2);
  }
  
  private formatCheck(passed: boolean): string {
    return passed ? '✓' : '✗';
  }
}
