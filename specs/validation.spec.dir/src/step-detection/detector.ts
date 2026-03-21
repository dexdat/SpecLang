/**
 * SPECLANG-GENERATED: Step detection logic
 * Source: @specs/validation-tool/implementation#step-detection
 */

import { StepPattern, StepBlockResult, StepPatternMatch, StepDetectionCriteria, StepDetectionResult } from './types';
import { SpecBlock } from '../completeness/types';
import { getPatternsForLevel } from './patterns';

export class StepDetector {
  private patterns: StepPattern[];

  constructor(agentSupport: string = 'agent_autonomous') {
    this.patterns = getPatternsForLevel(agentSupport);
  }

  /**
   * Detect steps in a single block
   */
  detectBlock(block: SpecBlock, criteria: StepDetectionCriteria): StepBlockResult {
    const sentences = this.countSentences(block.content);
    const matches = this.findPatternMatches(block.content);
    const steps = matches.length;
    const coverage = sentences > 0 ? steps / sentences : 0;
    const passed = coverage >= criteria.minCoverage && steps >= criteria.minStepsPerBlock;

    return {
      blockId: block.id,
      kind: block.kind,
      passed,
      sentences,
      steps,
      coverage,
      patterns: matches
    };
  }

  /**
   * Detect steps across all blocks in a spec
   */
  detectSpec(blocks: SpecBlock[], criteria: StepDetectionCriteria, specId: string): StepDetectionResult {
    const blockResults: StepBlockResult[] = [];
    let totalSentences = 0;
    let totalSteps = 0;

    for (const block of blocks) {
      const result = this.detectBlock(block, criteria);
      blockResults.push(result);
      totalSentences += result.sentences;
      totalSteps += result.steps;
    }

    const coverage = totalSentences > 0 ? totalSteps / totalSentences : 0;
    const passed = coverage >= criteria.minCoverage;
    const confidence = this.calculateConfidence(coverage, blockResults);

    const missing = this.identifyMissingSteps(blockResults, criteria);
    const suggestions = this.generateSuggestions(missing, coverage);

    return {
      specId,
      passed,
      confidence,
      coverage,
      totalSentences,
      totalSteps,
      blocks: blockResults,
      missing,
      suggestions
    };
  }

  private countSentences(content: string): number {
    // Simple sentence splitting by punctuation followed by space or newline
    const sentences = content.split(/[.!?]+(\s|\n|$)/).filter(s => s.trim().length > 0);
    return sentences.length;
  }

  private findPatternMatches(content: string): StepPatternMatch[] {
    const lines = content.split('\n');
    const matches: StepPatternMatch[] = [];

    lines.forEach((line, index) => {
      for (const pattern of this.patterns) {
        if (pattern.pattern.test(line)) {
          matches.push({
            type: pattern.description,
            text: line.trim(),
            line: index + 1
          });
        }
      }
    });

    return matches;
  }

  private calculateConfidence(coverage: number, blocks: StepBlockResult[]): number {
    // Simple confidence based on coverage and block pass rate
    const passedBlocks = blocks.filter(b => b.passed).length;
    const blockPassRate = blocks.length > 0 ? passedBlocks / blocks.length : 0;
    return (coverage * 0.7) + (blockPassRate * 0.3);
  }

  private identifyMissingSteps(blocks: StepBlockResult[], criteria: StepDetectionCriteria): string[] {
    const missing: string[] = [];
    for (const block of blocks) {
      if (!block.passed) {
        missing.push(`Block "${block.blockId}" (${block.kind}): coverage ${(block.coverage * 100).toFixed(1)}% (needs ${criteria.minCoverage * 100}%)`);
      }
    }
    return missing;
  }

  private generateSuggestions(missing: string[], coverage: number): string[] {
    const suggestions: string[] = [];
    if (coverage < 0.8) {
      suggestions.push('Add numbered lists or bullet points for each step');
      suggestions.push('Use imperative verbs (create, implement, add, etc.)');
      suggestions.push('Include sequence indicators (first, then, next, finally)');
    }
    if (missing.length > 0) {
      suggestions.push(`Improve step descriptions in ${missing.length} block(s)`);
    }
    return suggestions;
  }
}