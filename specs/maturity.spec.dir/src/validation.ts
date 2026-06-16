// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.dir/validation.spec.md

import { ParsedSpec, MaturityResult, MaturityLevel } from './types';
import { CriteriaChecker } from './criteria';

/**
 * Validate if a spec meets maturity level requirements
 */
export function validateMaturity(spec: ParsedSpec): MaturityResult {
  const checker = new CriteriaChecker();
  const level = checker.suggestLevel(spec);
  const criteriaResult = checker.checkLevel(spec, level);
  
  return {
    valid: criteriaResult.meetsCriteria,
    level,
    criteriaResults: [criteriaResult],
    violations: criteriaResult.missing,
    suggestions: criteriaResult.warnings
  };
}