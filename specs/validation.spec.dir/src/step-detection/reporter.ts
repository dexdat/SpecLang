/**
 * SPECLANG-GENERATED: Step detection reporting
 * Source: @specs/validation-tool/implementation#step-detection
 */

import { StepDetectionResult, StepBlockResult } from './types';

export class StepReporter {
  /**
   * Generate JSON report
   */
  static jsonReport(result: StepDetectionResult): any {
    return {
      spec: result.specId,
      agent_support: 'agent_autonomous', // TODO: get from spec header
      passed: result.passed,
      confidence: result.confidence,
      checks: {
        step_by_step: {
          passed: result.passed,
          coverage: result.coverage,
          totalSteps: result.totalSteps,
          totalSentences: result.totalSentences,
          missing: result.missing
        }
      },
      suggestions: result.suggestions
    };
  }

  /**
   * Generate human-readable report
   */
  static humanReport(result: StepDetectionResult): string {
    let report = `Step Detection Report: ${result.specId}\n`;
    report += '─'.repeat(50) + '\n';
    report += result.passed ? '✓ PASSED' : '✗ FAILED';
    report += ` (confidence: ${result.confidence.toFixed(2)})\n\n`;
    report += `Coverage: ${(result.coverage * 100).toFixed(1)}% (${result.totalSteps} steps / ${result.totalSentences} sentences)\n`;
    report += `Blocks: ${result.blocks.length} total, ${result.blocks.filter(b => b.passed).length} passed\n\n`;

    if (result.missing.length > 0) {
      report += 'Missing steps:\n';
      result.missing.forEach(m => report += `  • ${m}\n`);
    }

    if (result.suggestions.length > 0) {
      report += '\nSuggestions:\n';
      result.suggestions.forEach(s => report += `  • ${s}\n`);
    }

    return report;
  }

  /**
   * Generate detailed block-level report
   */
  static blockReport(blocks: StepBlockResult[]): string {
    let report = 'Block-level analysis:\n';
    blocks.forEach(block => {
      report += `\n${block.blockId} (${block.kind}):\n`;
      report += `  Coverage: ${(block.coverage * 100).toFixed(1)}% (${block.steps} steps / ${block.sentences} sentences)\n`;
      report += `  Status: ${block.passed ? '✓' : '✗'}\n`;
      if (block.patterns.length > 0) {
        report += `  Patterns detected: ${block.patterns.map(p => p.type).join(', ')}\n`;
      }
    });
    return report;
  }
}