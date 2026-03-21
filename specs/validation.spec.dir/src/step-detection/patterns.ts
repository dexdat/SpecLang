/**
 * SPECLANG-GENERATED: Step detection patterns
 * Source: @specs/validation-tool/implementation#step-detection
 */

import { StepPattern } from './types';

export const DEFAULT_STEP_PATTERNS: StepPattern[] = [
  {
    pattern: /^\s*\d+\.\s+/,
    weight: 1.0,
    description: 'Numbered list'
  },
  {
    pattern: /^\s*[-*•]\s+/,
    weight: 1.0,
    description: 'Bulleted list'
  },
  {
    pattern: /^(first|then|next|finally|after|step|stage)\b/i,
    weight: 0.8,
    description: 'Sequence indicator'
  },
  {
    pattern: /^(create|implement|add|remove|update|delete|validate|check|run|execute|build|test|deploy)\b/i,
    weight: 0.7,
    description: 'Imperative verb'
  }
];

export function getPatternsForLevel(agentSupport: string): StepPattern[] {
  switch (agentSupport) {
    case 'agent_autonomous':
      return DEFAULT_STEP_PATTERNS;
    case 'agent_assisted':
      return DEFAULT_STEP_PATTERNS.slice(0, 3); // exclude imperative verb
    case 'human_only':
      return DEFAULT_STEP_PATTERNS.slice(0, 2); // only lists
    default:
      return DEFAULT_STEP_PATTERNS;
  }
}