# speclang-header lines:11
id: "@speclang/scripts-analyze-completeness"
version: 0.1.0
layer: 2
tags: [scripts, analysis, completeness, safety-nets]
parent: ""@ref:speclang/scriptsstatus: draft
project_level: Alpha
agent_support: agent_assisted
short: Analyze Spec Completeness Script
target: scripts/analyze_completeness.py
---

# Analyze Spec Completeness Script

Analyzes spec completeness for safety nets, computing step-by-step coverage, reference resolution, ambiguity score, metadata completeness, and dependency graph completeness.

Implements the analysis component from @ref:speclang/safety-nets/analysis.

## Overview

```speclang
# @block:overview @kind:note
The analyze-completeness script evaluates how complete a spec is across multiple
dimensions. It computes coverage metrics that help determine if a spec is ready
for autonomous agent execution or needs human review.
```

## Analysis Dimensions

```speclang
# @block:dimensions @kind:entity
CompletenessDimensions:
  step_coverage:
    description: Percentage of steps with detailed descriptions
    weight: 0.25
  
  reference_resolution:
    description: Percentage of @ref: that resolve correctly
    weight: 0.20
  
  ambiguity_score:
    description: Measure of unclear or ambiguous language
    weight: 0.15
  
  metadata_completeness:
    description: Presence of required header fields
    weight: 0.15
  
  dependency_coverage:
    description: All dependencies documented
    weight: 0.15
  
  validation_rules:
    description: Presence of validation rules
    weight: 0.10
```

## Implementation

```speclang
# @block:implementation @kind:function
def analyze_completeness(spec_path: str, options: dict) -> dict:
    """
    Analyze spec completeness across multiple dimensions.
    
    Args:
        spec_path: Path to spec file
        options: Analysis configuration
    
    Returns:
        Dict with completeness_scores, recommendations, overall_rating
    """
```

## Algorithm

```speclang
# @block:algorithm @kind:note
1. Parse spec file and header
2. Analyze each completeness dimension:
   a. Step coverage: Count steps vs described steps
   b. Reference resolution: Validate all @ref: links
   c. Ambiguity: Check for vague language
   d. Metadata: Verify required fields present
   e. Dependencies: Check all dependencies documented
   f. Validation rules: Look for error handling
3. Compute weighted overall score
4. Generate recommendations for improvement
5. Output detailed analysis report
```

## Scoring

```speclang
# @block:scoring @kind:table
| Score | Rating | Action |
|-------|--------|--------|
| 0.9-1.0 | Excellent | Ready for autonomous |
| 0.7-0.9 | Good | Minor improvements needed |
| 0.5-0.7 | Fair | Review recommended |
| 0.3-0.5 | Poor | Significant work needed |
| 0.0-0.3 | Critical | Not ready for use |
```

## Usage

```speclang
# @block:usage @kind:note
# Analyze single spec
python3 scripts/analyze_completeness.py specs/auth.spec.md

# Analyze all specs in directory
python3 scripts/analyze_completeness.py specs/ --recursive

# Detailed output
python3 scripts/analyze_completeness.py specs/auth.spec.md --detailed

# JSON output for automation
python3 scripts/analyze_completeness.py specs/ --json

# Only check specific dimension
python3 scripts/analyze_completeness.py specs/ --dimension step_coverage

# Threshold filter
python3 scripts/analyze_completeness.py specs/ --min-score 0.7
```

## Output Format

```speclang
# @block:output @kind:note
Completeness Analysis:
  Spec: specs/auth.spec.md
  Overall Score: 0.82 (Good)
  
  Dimensions:
    Step Coverage: 0.95 ✓
    Reference Resolution: 1.00 ✓
    Ambiguity Score: 0.75 ✓
    Metadata: 0.80 ✓
    Dependencies: 0.70 ⚠
    Validation Rules: 0.72 ⚠
  
  Recommendations:
    - Add more detailed steps for login flow
    - Document validation error handling
    - Add dependency on specs/validation
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/safety-nets - Safety net specifications
- @ref:speclang/safety-nets/analysis - Analysis component
- @ref:speclang/autonomous - Autonomous requirements
- @ref:speclang/validation - Validation rules
```