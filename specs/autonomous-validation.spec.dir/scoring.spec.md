# speclang-header lines:10
id: "@speclang/autonomous-validation/scoring"
version: 0.1.0
layer: 2
parent: "@speclang/autonomous-validation"
part: 2/2
project_level: Alpha
agent_support: agent_autonomous
tags: [validation, autonomous, agent, scoring]
short: Scoring algorithms for autonomous validation
---
# Autonomous Validation Scoring

Scoring algorithms and thresholds for autonomous validation criteria.

## Overview

```speclang
# @block:autonomous-validation/scoring-overview @kind:note
Autonomous validation uses a scoring system to evaluate specs against
the criteria defined in @ref:speclang/autonomous-validation/rules.

Each criterion receives a score (0-1) or pass/fail status.
Overall validation passes only if all criteria meet minimum thresholds.

Scoring helps:
- Identify borderline specs
- Provide quantitative improvement metrics
- Support gradual upgrades from `agent_assisted` to `agent_autonomous`
```

## Scoring Criteria

```speclang
# @block:autonomous-validation/scoring-criteria @kind:entity
ScoringCriteria:
  
  step_by_step_descriptions:
    weight: 0.25
    scoring_method: "clarity_score"
    threshold: 0.8
    description: "Score based on clarity of step-by-step descriptions"
    
  resolved_references:
    weight: 0.25
    scoring_method: "binary_pass_fail"
    threshold: 1.0
    description: "Pass if zero unresolved references, fail otherwise"
    
  unambiguous_language:
    weight: 0.20
    scoring_method: "ambiguity_count"
    threshold: "zero in operations, <= 2 in entities, <= 5 in notes"
    description: "Count ambiguous phrases, apply tolerance per block kind"
    
  required_metadata:
    weight: 0.15
    scoring_method: "field_completeness"
    threshold: 1.0
    description: "Pass if all required fields present and valid"
    
  completeness:
    weight: 0.15
    scoring_method: "layer_completeness"
    threshold: "layer-dependent"
    description: "Check for downstream specs based on layer"
```

## Clarity Scoring Algorithm

```speclang
# @block:autonomous-validation/clarity-scoring @kind:entity
ClarityScoring:
  
  algorithm:
    1. Parse operation block content
    2. Detect numbered/bulleted lists
    3. Count actionable steps
    4. Evaluate sentence structure:
       - Imperative mood (+0.2 per sentence)
       - Clear subject/object (+0.1)
       - Specific actions (+0.3)
       - Vague terms (-0.2 each)
    5. Compute raw score (0-1)
    6. Apply penalty for missing lists (-0.3)
    7. Normalize to 0-1 range
    
  scoring_rubric:
    0.0-0.5: Unacceptable – rewrite required
    0.5-0.7: Needs improvement – add step details
    0.7-0.8: Acceptable for agent_assisted
    0.8-1.0: Autonomous ready
    
  examples:
    high_clarity: |
      1. Receive email and password
      2. Validate email format with regex
      3. Hash password using bcrypt(12)
      4. Query users table where email = ?
      5. Compare hashed passwords
      6. Generate JWT token with 1h expiry
      7. Return token or invalid_credentials error
      Score: 0.95
    
    low_clarity: |
      Take credentials and check them.
      If valid, return token.
      Score: 0.45
```

## Ambiguity Scoring

```speclang
# @block:autonomous-validation/ambiguity-scoring @kind:entity
AmbiguityScoring:
  
  detection:
    - Regex patterns for ambiguous terms
    - Weighted by term severity
    - Context-aware (operation vs note)
    
  scoring:
    operation_blocks:
      tolerance: 0
      penalty_per_occurrence: 1.0 (immediate fail)
      
    entity_blocks:
      tolerance: 2
      penalty_per_occurrence: 0.5
      score = max(0, 1 - (count - tolerance) * penalty)
      
    note_blocks:
      tolerance: 5
      penalty_per_occurrence: 0.2
      score = max(0, 1 - (count - tolerance) * penalty)
    
  severity_levels:
    high: ["maybe", "perhaps", "probably", "should", "could"]
    medium: ["some", "few", "many", "several"]
    low: ["etc.", "and so on", "and more", "better", "worse"]
```

## Metadata Scoring

```speclang
# @block:autonomous-validation/metadata-scoring @kind:entity
MetadataScoring:
  
  field_scoring:
    id:
      weight: 0.2
      checks: [format, domain_valid, path_matches_file]
      score: 1.0 if all pass, 0.0 otherwise
      
    version:
      weight: 0.1
      checks: [semver_format, increments_on_change]
      score: 1.0 if semver, 0.5 if not incrementing
      
    layer:
      weight: 0.2
      checks: [integer_0_10, matches_content]
      score: 1.0 if valid, 0.0 if mismatch > 2 levels
      
    project_level:
      weight: 0.2
      checks: [valid_enum, meets_criteria]
      score: 1.0 if valid and meets, 0.5 if valid only
      
    agent_support:
      weight: 0.1
      checks: [equals_agent_autonomous]
      score: 1.0 if autonomous, 0.0 otherwise
      
    tags:
      weight: 0.1
      checks: [non_empty_array]
      score: 1.0 if non-empty, 0.0 otherwise
      
    short:
      weight: 0.1
      checks: [non_empty, length_lt_200]
      score: 1.0 if valid, 0.0 otherwise
    
  overall_score:
    weighted_sum = Σ(field_weight * field_score)
    threshold = 0.95  # Must meet almost all requirements
```

## Completeness Scoring

```speclang
# @block:autonomous-validation/completeness-scoring @kind:entity
CompletenessScoring:
  
  layer_based_requirements:
    depth_0_1: "No downstream requirements"
    depth_2_3: "Should have at least one child spec"
    depth_4_5: "Must have corresponding code spec (.go.spec, .ts.spec, etc.)"
    depth_6_7: "Must have implementation spec and test spec"
    depth_8_plus: "Must have deployment and monitoring specs"
    
  scoring:
    check_children:
      - Count child specs via `children` field or directory structure
      - Score = min(1.0, child_count / expected_count)
      
    check_code_specs:
      - Look for matching `.{ext}.spec` files
      - Score = 1.0 if exists, 0.0 otherwise
      
    check_tests:
      - Look for `.test.spec` files
      - Score = 1.0 if exists, 0.5 if planned, 0.0 otherwise
      
  overall_completeness_score:
    weighted average based on layer priority
```

## Overall Validation Score

```speclang
# @block:autonomous-validation/overall-scoring @kind:entity
OverallScoring:
  
  formula:
    overall_score = Σ(criterion_weight * criterion_score)
    
  weights:
    step_by_step_descriptions: 0.25
    resolved_references: 0.25
    unambiguous_language: 0.20
    required_metadata: 0.15
    completeness: 0.15
    
  thresholds:
    autonomous_ready: overall_score >= 0.95 AND all binary criteria pass
    agent_assisted: overall_score >= 0.70 OR any binary criteria fail
    needs_improvement: overall_score < 0.70
    
  reporting:
    - Detailed breakdown per criterion
    - Suggested improvements for low scores
    - Automatic downgrade recommendation if score < 0.70
```

## Integration with Validation Process

```speclang
# @block:autonomous-validation/scoring-integration @kind:entity
ScoringIntegration:
  
  when_scoring_applied:
    - After all validation criteria checked
    - Only for specs with `agent_support: agent_autonomous`
    - Scores logged to `.speclang/validation_scores.json`
    
  use_cases:
    - Gradual improvement tracking
    - Automated downgrade/upgrade decisions
    - Quality metrics for project dashboard
    - CI/CD quality gates
    
  tools:
    - `score_autonomous.py` companion script
    - Visual score dashboard
    - Historical trend analysis
```

## References

```speclang
# @block:autonomous-validation/scoring-references @kind:refs
refs:
  - "@ref:speclang/autonomous-validation/rules
  - "@ref:speclang/validation
  - "@ref:speclang/layer-definitions
  - "@ref:speclang/project-maturity-levels
```