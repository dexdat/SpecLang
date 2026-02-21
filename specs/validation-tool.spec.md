# speclang-header lines:9
id: "@speclang/validation-tool"
version: 0.1.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [validation, tool, python, typescript, autonomous]
short: Implementation spec for autonomous validation tool
---
# Validation Tool Implementation

Tool that scans `agent_autonomous` specs for completeness and correctness.

## Overview

```speclang
# @block:validation-tool/overview @kind:note
The validation tool implements the rules defined in @ref:speclang/autonomous-validation.
It scans spec files, checks for step-by-step descriptions, reference resolution,
ambiguity, and metadata completeness.

Two implementations:
1. **Python**: Command-line tool for CI/CD and pre-commit hooks
2. **TypeScript**: Integrated into guard plugin for real-time validation

The tool produces detailed reports and can suggest fixes or downgrades.
```

## Requirements

```speclang
# @block:validation-tool/requirements @kind:entity
Requirements:
  
  input:
    - Single spec file path
    - Directory path (recursive scan)
    - List of spec IDs from `_index.json`
    
  output:
    - Validation report (JSON, YAML, or human-readable)
    - Pass/fail status per spec
    - Detailed error messages
    - Suggested fixes
    - Confidence scores
    
  checks:
    - Step-by-step description coverage
    - Reference resolution
    - Ambiguity detection
    - Metadata completeness
    - Cross-field consistency
    - Layer appropriateness
    
  integration:
    - Command-line interface
    - Python API
    - TypeScript/Node API
    - Pre-commit hook
    - CI/CD pipeline integration
    - Guard plugin integration
```

## Python Implementation

### Architecture

```speclang
# @block:validation-tool/python-architecture @kind:entity
PythonArchitecture:
  
  modules:
    - `validator.py`: Main validation logic
    - `scorer.py`: Confidence scoring
    - `reporter.py`: Report generation
    - `cli.py`: Command-line interface
    
  dependencies:
    - `pyyaml`: Parse YAML headers
    - `regex`: Advanced pattern matching
    - `rich`: Pretty console output
    - `pydantic`: Data validation
    
  entry_points:
    - `speclang-validate`: CLI command
    - `speclang-validate-file`: Validate single file
    - `speclang-validate-dir`: Validate directory
    - `speclang-validate-project`: Validate entire project
```

### CLI Interface

```speclang
# @block:validation-tool/cli @kind:code
```bash
# Basic usage
speclang-validate --file specs/auth.spec.md

# Recursive directory scan
speclang-validate --dir specs/ --recursive

# Project-wide scan using index
speclang-validate --project

# Output formats
speclang-validate --file x.spec.md --format json
speclang-validate --file x.spec.md --format yaml
speclang-validate --file x.spec.md --format human

# Fix suggestions
speclang-validate --file x.spec.md --suggest-fixes

# Auto-downgrade recommendations
speclang-validate --file x.spec.md --suggest-downgrade

# Confidence scoring
speclang-validate --file x.spec.md --confidence
```
```

### Validation Logic

```speclang
# @block:validation-tool/validation-logic @kind:operation
validate_spec(file_path: str) -> ValidationResult:

steps:
  1. Parse header (use lines:N if present)
  2. Check `agent_support` field
  3. If not `agent_autonomous`, run basic validation only
  4. If `agent_autonomous`:
     a. Extract all `@kind:operation` blocks
     b. Check each for step-by-step descriptions (regex for numbered/bulleted lists)
     c. Extract all `@ref:` references
     d. Check each against `_index.json`
     e. Scan for ambiguous language (keyword list)
     f. Validate metadata fields against requirements
     g. Compute confidence score
  5. Generate report
  6. Return pass/fail
```

### Step-by-Step Detection

```speclang
# @block:validation-tool/step-detection @kind:entity
StepDetection:
  
  patterns:
    - Numbered lists: `^\s*\d+\.\s+`
    - Bulleted lists: `^\s*[-*•]\s+`
    - Imperative sentences starting with action verbs
    - Clear sequence indicators ("first", "then", "next", "finally")
    
  scoring:
    - Count steps vs total sentences in operation block
    - Coverage percentage = steps / sentences
    - Threshold: >80% coverage required for `agent_autonomous`
    
  implementation:
    - Regex patterns for lists
    - NLP for imperative sentences (simple verb list)
    - Fallback: manual annotation required if unclear
```

### Reference Resolution

```speclang
# @block:validation-tool/ref-resolution @kind:entity
ReferenceResolution:
  
  process:
    1. Load `_index.json` into memory
    2. Parse all `@ref:` patterns in spec content
    3. For each reference:
       - Parse domain/path#block format
       - Look up in index
       - If not found, check if it's a forward reference in `depends_on`
       - If still not found, mark as unresolved
    4. Compute resolution percentage
    
  requirements:
    - 100% resolution for `agent_autonomous` specs
    - Exceptions: `@ref:northstar` always valid
    - Forward references allowed only in `depends_on`
```

### Ambiguity Detection

```speclang
# @block:validation-tool/ambiguity-detection @kind:entity
AmbiguityDetection:
  
  ambiguous_terms:
    - Modal verbs: should, could, might, may, would
    - Uncertainty: maybe, perhaps, possibly, probably
    - Vagueness: some, few, many, several, various
    - Imprecise: etc., and so on, and more, among others
    - Subjective: better, worse, fast, slow, easy, hard
    
  detection:
    - Simple regex for each term
    - Context awareness: ignore in comments/examples
    - Count occurrences per operation block
    - Threshold: zero tolerance for `agent_autonomous`
    
  implementation:
    - Configurable term list
    - Whitelist for certain contexts
    - Suggest replacements
```

## TypeScript Implementation

### Guard Plugin Integration

```speclang
# @block:validation-tool/guard-integration @kind:entity
GuardIntegration:
  
  hooks:
    - `on_file_edit`: Validate on every file change
    - `on_pre_cascade`: Validate before cascade starts
    - `on_agent_write`: Validate agent-written specs
    
  real_time_validation:
    - As user types, provide feedback
    - Highlight missing step-by-step descriptions
    - Warn about unresolved references
    - Suggest metadata improvements
    
  blocking:
    - Can block cascade if validation fails
    - Can block agent writes if validation fails
    - Configurable strictness per project level
```

### Node API

```speclang
# @block:validation-tool/node-api @kind:code
```typescript
interface ValidationResult {
  specId: string;
  agentSupport: string;
  passed: boolean;
  confidence: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: Suggestion[];
}

interface ValidationTool {
  validateFile(path: string): Promise<ValidationResult>;
  validateDirectory(path: string): Promise<ValidationResult[]>;
  validateProject(): Promise<ValidationResult[]>;
  suggestFixes(result: ValidationResult): Suggestion[];
  suggestDowngrade(result: ValidationResult): boolean;
}
```
```

## Confidence Scoring

```speclang
# @block:validation-tool/confidence-scoring @kind:entity
ConfidenceScoring:
  
  factors:
    - step_coverage: 0-1 (weight: 0.4)
    - reference_resolution: 0-1 (weight: 0.3)
    - ambiguity_score: 0-1 (higher = less ambiguous) (weight: 0.2)
    - metadata_completeness: 0-1 (weight: 0.1)
    
  formula:
    confidence = (step_coverage * 0.4) + (ref_resolution * 0.3) + 
                 (ambiguity_score * 0.2) + (metadata_completeness * 0.1)
    
  thresholds:
    - <0.6: Poor (downgrade recommended)
    - 0.6-0.8: Fair (autonomous with warnings)
    - 0.8-0.9: Good (fully autonomous)
    - >0.9: Excellent (exemplary spec)
```

## Report Formats

### JSON Report

```speclang
# @block:validation-tool/json-report @kind:code
```json
{
  "spec": "@specs/auth/login",
  "agent_support": "agent_autonomous",
  "passed": true,
  "confidence": 0.85,
  "checks": {
    "step_by_step": {
      "passed": true,
      "coverage": 0.9,
      "missing": []
    },
    "references": {
      "passed": true,
      "resolved": 42,
      "unresolved": 0
    },
    "ambiguity": {
      "passed": true,
      "ambiguous_terms": 0
    },
    "metadata": {
      "passed": true,
      "missing_fields": []
    }
  },
  "suggestions": [
    "Add step-by-step description for error handling"
  ]
}
```
```

### Human-Readable Report

```speclang
# @block:validation-tool/human-report @kind:code
```
Validation Report: @specs/auth/login
────────────────────────────────────
✓ PASSED (confidence: 0.85)

Checks:
  ✓ Step-by-step descriptions: 90% coverage
  ✓ References: 42/42 resolved
  ✓ Ambiguity: No ambiguous terms
  ✓ Metadata: All required fields present

Suggestions:
  • Add step-by-step description for error handling
```
```

## Integration with Safety Nets

```speclang
# @block:validation-tool/safety-integration @kind:entity
SafetyIntegration:
  
  with_safety_nets:
    - Validation tool provides data for confidence scoring
    - Validation tool triggers peer review when confidence low
    - Validation tool suggests fallback to human review
    
  automated_actions:
    - Auto-downgrade `agent_support` when confidence < 0.6
    - Create review tickets when confidence < 0.7
    - Block cascade when confidence < 0.5
```

## Implementation Plan

```speclang
# @block:validation-tool/implementation-plan @kind:entity
ImplementationPlan:
  
  phase_1_python_cli:
    - Basic validation (step-by-step, references)
    - CLI with JSON output
    - Integration with existing validation pipeline
    
  phase_2_typescript_guard:
    - Real-time validation in guard plugin
    - Editor integration
    - Blocking validation
    
  phase_3_advanced_features:
    - Ambiguity detection with NLP
    - Confidence scoring
    - Auto-fix suggestions
    - Integration with safety nets
    
  timeline:
    - Week 1: Python CLI
    - Week 2: TypeScript guard integration
    - Week 3: Advanced features
    - Week 4: Testing and refinement
```

## References

```speclang
# @block:validation-tool/references @kind:refs
refs:
  - @ref:speclang/autonomous-validation
  - @ref:speclang/safety-nets
  - @ref:speclang/validation
  - @ref:speclang/headers
```