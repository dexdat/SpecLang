---
name: sip-046-validation-tool-speclang-v0
title: "SIP 46: Validation Tool"
version: 0.1.0
description: Autonomous validation tool for spec completeness and correctness
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 46: Validation Tool

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Validation Tool—a Python/TypeScript tool that scans `agent_autonomous` specs for completeness and correctness.

### Quick Start

Validation levels:
1. **Syntax**: Header format, YAML validity
2. **References**: All @ref: resolve to existing blocks
3. **Completeness**: Required fields present, no TODOs
4. **Correctness**: Type safety, constraint validation
5. **Safety**: No dangerous patterns, security checks

### When to Read This

- **Running validation**: Before marking specs as agent_autonomous
- **CI/CD integration**: Automated spec quality gates
- **Report generation**: Understanding validation output

### Related SIPs

- SIP 16: Autonomous Validation
- SIP 22: Validation
- SIP 23: Safety Nets
- SIP 21: Semantic Definitions

## Abstract

This SIP defines the Validation Tool that autonomously validates specs labeled `agent_autonomous`. The tool performs multi-level validation, generates reports, and integrates with safety nets to ensure specs are truly ready for autonomous agent operation.

## Motivation

Autonomous agents need complete, unambiguous specs:
- Missing references cause agent failures
- Ambiguous language leads to wrong implementations
- Incomplete specs require human intervention
- Invalid specs propagate errors

The Validation Tool catches these issues before agents run.

## Rationale

**Multi-level validation:**

1. **Fast syntax check**: Quick feedback on format errors
2. **Reference resolution**: Ensure dependency graph is valid
3. **Completeness scan**: No placeholders or missing sections
4. **Semantic validation**: Type and constraint checking
5. **Safety analysis**: Pattern detection for dangerous code

## Specification

### Validation Levels

```yaml
ValidationLevels:
  level_1_syntax:
    description: "Fast format validation"
    checks:
      - Header present with # speclang-header
      - lines:N matches actual line count
      - YAML within header is valid
      - Required fields present (id, version, layer)
      - Tags is non-empty array
      - ID matches file path convention
    timing: "< 10ms per file"
    on_failure: "block"
    
  level_2_references:
    description: "Reference resolution"
    checks:
      - All @ref: paths exist in _index.json
      - Block references (#block-name) resolve
      - No circular references
      - Import statements resolve
      - Children references are valid
    timing: "< 50ms per file"
    on_failure: "warn or block"
    
  level_3_completeness:
    description: "Content completeness"
    checks:
      - No TODO/FIXME/XXX markers
      - No empty sections
      - All @block: have content
      - Required blocks present per spec type
      - Short description meaningful (> 10 chars)
    timing: "< 30ms per file"
    on_failure: "warn"
    
  level_4_semantic:
    description: "Semantic correctness"
    checks:
      - Type annotations valid
      - Kind values are recognized
      - Layer value in range 0-10
      - Version follows semver
      - project_level is valid enum
      - agent_support is valid enum
    timing: "< 20ms per file"
    on_failure: "warn or block"
    
  level_5_safety:
    description: "Safety analysis"
    checks:
      - No shell injection patterns
      - No hardcoded secrets
      - No dangerous file operations
      - No unbounded recursion
      - SQL queries parameterized
    timing: "< 100ms per file"
    on_failure: "block"
```

### Report Format

```yaml
ValidationReport:
  format: JSON
  
  schema:
    spec_id: string
    spec_path: string
    timestamp: ISO8601
    overall_status: pass | fail | warn
    
    levels:
      - level: integer (1-5)
        status: pass | fail | warn | skip
        duration_ms: integer
        checks:
          - name: string
            status: pass | fail | skip
            message: string (on failure)
            location: string (line:col)
            
    summary:
      total_checks: integer
      passed: integer
      failed: integer
      warnings: integer
      skipped: integer
      
    confidence_score: float (0.0 - 1.0)
    
    recommendations:
      - priority: high | medium | low
        action: string
        location: string
```

### Confidence Scoring

```yaml
ConfidenceScoring:
  formula: "weighted_average(check_scores)"
  
  weights:
    syntax: 0.30
    references: 0.25
    completeness: 0.20
    semantic: 0.15
    safety: 0.10
    
  thresholds:
    agent_autonomous: 0.95
    agent_assisted: 0.75
    human_only: 0.50
    
  adjustments:
    - has_examples: +0.05
    - has_implementation: +0.05
    - has_tests: +0.05
    - has_todos: -0.20
    - empty_sections: -0.15
    - ambiguous_language: -0.10
```

### CLI Interface

```yaml
ValidationCLI:
  commands:
    validate:
      usage: "speclang validate [specs...]"
      options:
        --level: "Validation level (1-5, default: all)"
        --format: "Output format (json, yaml, markdown)"
        --output: "Output file path"
        --strict: "Treat warnings as failures"
        --ci: "CI mode (exit code on failure)"
        
    watch:
      usage: "speclang validate --watch"
      description: "Re-validate on file changes"
      
    report:
      usage: "speclang validate --report report.md"
      description: "Generate markdown report"
      
  exit_codes:
    0: "All validations passed"
    1: "Validation failures"
    2: "Configuration error"
    3: "Runtime error"
```

### Node API

```yaml
ValidationAPI:
  module: "@speclang/validation"
  
  functions:
    validateSpec:
      params:
        path: string
        options: ValidationOptions
      returns: ValidationReport
      
    validateAll:
      params:
        specsPath: string
        options: ValidationOptions
      returns: ValidationReport[]
      
    validateLevel:
      params:
        path: string
        level: integer (1-5)
      returns: LevelReport
      
  types:
    ValidationOptions:
      level: integer (default: 5)
      strict: boolean (default: false)
      includeWarnings: boolean (default: true)
      timeout: integer (default: 5000)
```

### Integration with Safety Nets

```yaml
SafetyNetIntegration:
  triggers:
    on_validation_failure:
      - Log to .speclang/validation-failures.log
      - Notify relevant agent
      - Block autonomous execution
      - Suggest fixes if available
      
  auto_fix:
    enabled: false (requires explicit opt-in)
    safe_fixes:
      - Trim trailing whitespace
      - Normalize line endings
      - Sort YAML keys
    requires_review:
      - Add missing header fields
      - Fix reference paths
      
  monitoring:
    - Track validation scores over time
    - Alert on score degradation
    - Weekly validation reports
```

## Examples

### Example 1: Basic Validation

```bash
$ speclang validate specs/auth.spec.md

Validation Report: specs/auth.spec.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Level 1 (Syntax): ✓ PASS (12ms)
Level 2 (References): ✓ PASS (34ms)
Level 3 (Completeness): ⚠ WARN (8ms)
  - Empty section: ## Future Work (line 142)
Level 4 (Semantic): ✓ PASS (5ms)
Level 5 (Safety): ✓ PASS (45ms)

Overall: WARN
Confidence: 0.87

Recommendations:
  - [MEDIUM] Remove or populate empty section at line 142
```

### Example 2: JSON Report

```json
{
  "spec_id": "@speclang/auth",
  "spec_path": "specs/auth.spec.md",
  "timestamp": "2025-02-22T10:30:00Z",
  "overall_status": "warn",
  "levels": [
    {
      "level": 1,
      "status": "pass",
      "duration_ms": 12,
      "checks": [
        {"name": "header_present", "status": "pass"},
        {"name": "yaml_valid", "status": "pass"},
        {"name": "required_fields", "status": "pass"}
      ]
    },
    {
      "level": 3,
      "status": "warn",
      "duration_ms": 8,
      "checks": [
        {"name": "no_todos", "status": "pass"},
        {"name": "no_empty_sections", "status": "fail", "message": "Empty section: Future Work", "location": "142:1"}
      ]
    }
  ],
  "summary": {
    "total_checks": 18,
    "passed": 17,
    "failed": 0,
    "warnings": 1,
    "skipped": 0
  },
  "confidence_score": 0.87,
  "recommendations": [
    {"priority": "medium", "action": "Remove or populate empty section", "location": "142:1"}
  ]
}
```

### Example 3: CI Integration

```yaml
# .github/workflows/validate.yml
name: Spec Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: speclang/setup@v1
      - run: speclang validate --ci --strict specs/
      - run: speclang validate --format markdown --report validation-report.md
      - uses: actions/upload-artifact@v4
        with:
          name: validation-report
          path: validation-report.md
```

### Example 4: Node API Usage

```typescript
import { validateSpec, validateAll } from "@speclang/validation";

const report = await validateSpec("specs/auth.spec.md", {
  level: 5,
  strict: true,
});

if (report.overall_status === "fail") {
  console.error("Validation failed:");
  for (const level of report.levels) {
    for (const check of level.checks) {
      if (check.status === "fail") {
        console.error(`  ${check.name}: ${check.message}`);
      }
    }
  }
}

const allReports = await validateAll("specs/", { strict: false });
const avgConfidence = allReports.reduce((sum, r) => sum + r.confidence_score, 0) / allReports.length;
console.log(`Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
```

## Implementation

```python
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
import yaml
import json
import re
from datetime import datetime
from pathlib import Path

class ValidationStatus(Enum):
    PASS = "pass"
    FAIL = "fail"
    WARN = "warn"
    SKIP = "skip"

@dataclass
class CheckResult:
    name: str
    status: ValidationStatus
    message: Optional[str] = None
    location: Optional[str] = None

@dataclass
class LevelReport:
    level: int
    status: ValidationStatus
    duration_ms: int
    checks: list[CheckResult] = field(default_factory=list)

@dataclass
class ValidationReport:
    spec_id: str
    spec_path: str
    timestamp: str
    overall_status: ValidationStatus
    levels: list[LevelReport] = field(default_factory=list)
    confidence_score: float = 0.0
    recommendations: list[dict] = field(default_factory=list)

class ValidationTool:
    LEVEL_WEIGHTS = {1: 0.30, 2: 0.25, 3: 0.20, 4: 0.15, 5: 0.10}
    
    def __init__(self, index_path: str = "specs/_index.json"):
        self.index_path = index_path
        self.index = self._load_index()
        
    def validate(self, spec_path: str, level: int = 5) -> ValidationReport:
        content = Path(spec_path).read_text()
        report = ValidationReport(
            spec_id=self._extract_id(content),
            spec_path=spec_path,
            timestamp=datetime.utcnow().isoformat() + "Z",
            overall_status=ValidationStatus.PASS,
        )
        
        for lvl in range(1, level + 1):
            level_report = self._validate_level(lvl, content, spec_path)
            report.levels.append(level_report)
            
        report.confidence_score = self._calculate_confidence(report)
        report.overall_status = self._determine_overall_status(report)
        report.recommendations = self._generate_recommendations(report)
        
        return report
        
    def _validate_level(self, level: int, content: str, path: str) -> LevelReport:
        import time
        start = time.time()
        
        checks = []
        if level == 1:
            checks = self._syntax_checks(content)
        elif level == 2:
            checks = self._reference_checks(content)
        elif level == 3:
            checks = self._completeness_checks(content)
        elif level == 4:
            checks = self._semantic_checks(content)
        elif level == 5:
            checks = self._safety_checks(content)
            
        duration = int((time.time() - start) * 1000)
        status = ValidationStatus.PASS
        if any(c.status == ValidationStatus.FAIL for c in checks):
            status = ValidationStatus.FAIL
        elif any(c.status == ValidationStatus.WARN for c in checks):
            status = ValidationStatus.WARN
            
        return LevelReport(level=level, status=status, duration_ms=duration, checks=checks)
        
    def _syntax_checks(self, content: str) -> list[CheckResult]:
        results = []
        
        if "# speclang-header" not in content:
            results.append(CheckResult("header_present", ValidationStatus.FAIL, "Missing speclang-header"))
        else:
            results.append(CheckResult("header_present", ValidationStatus.PASS))
            
        lines_match = re.search(r"speclang-header lines:(\d+)", content)
        if lines_match:
            declared = int(lines_match.group(1))
            actual = content.find("---\n")
            if actual > 0:
                actual_lines = content[:actual].count("\n") + 1
                if actual_lines == declared:
                    results.append(CheckResult("lines_match", ValidationStatus.PASS))
                else:
                    results.append(CheckResult("lines_match", ValidationStatus.WARN, 
                        f"Declared {declared} but header is {actual_lines} lines"))
                    
        yaml_match = re.search(r"# speclang-header lines:\d+\n(.*?)---", content, re.DOTALL)
        if yaml_match:
            try:
                yaml.safe_load(yaml_match.group(1))
                results.append(CheckResult("yaml_valid", ValidationStatus.PASS))
            except yaml.YAMLError as e:
                results.append(CheckResult("yaml_valid", ValidationStatus.FAIL, str(e)))
                
        return results
        
    def _reference_checks(self, content: str) -> list[CheckResult]:
        results = []
        refs = re.findall(r"@ref:([^\s\]]+)", content)
        
        for ref in set(refs):
            if self._reference_exists(ref):
                results.append(CheckResult(f"ref_{ref}", ValidationStatus.PASS))
            else:
                results.append(CheckResult(f"ref_{ref}", ValidationStatus.FAIL, f"Reference not found: {ref}"))
                
        return results
        
    def _reference_exists(self, ref: str) -> bool:
        return ref in self.index.get("references", {})
        
    def _completeness_checks(self, content: str) -> list[CheckResult]:
        results = []
        
        todos = re.findall(r"\b(TODO|FIXME|XXX)\b", content)
        if todos:
            results.append(CheckResult("no_todos", ValidationStatus.WARN, f"Found {len(todos)} TODO/FIXME markers"))
        else:
            results.append(CheckResult("no_todos", ValidationStatus.PASS))
            
        empty_sections = re.findall(r"^##\s+\w+\s*$\n(?!\s*\S)", content, re.MULTILINE)
        if empty_sections:
            results.append(CheckResult("no_empty_sections", ValidationStatus.WARN, f"Found {len(empty_sections)} empty sections"))
        else:
            results.append(CheckResult("no_empty_sections", ValidationStatus.PASS))
            
        return results
        
    def _semantic_checks(self, content: str) -> list[CheckResult]:
        results = []
        
        yaml_match = re.search(r"# speclang-header lines:\d+\n(.*?)---", content, re.DOTALL)
        if yaml_match:
            meta = yaml.safe_load(yaml_match.group(1))
            
            layer = meta.get("layer", -1)
            if 0 <= layer <= 10:
                results.append(CheckResult("layer_range", ValidationStatus.PASS))
            else:
                results.append(CheckResult("layer_range", ValidationStatus.FAIL, f"Layer {layer} not in 0-10"))
                
            valid_levels = ["POC", "MVP", "Alpha", "Beta", "Production", "Startup", "SMB", "MSB", "Enterprise"]
            if meta.get("project_level") in valid_levels:
                results.append(CheckResult("project_level", ValidationStatus.PASS))
            else:
                results.append(CheckResult("project_level", ValidationStatus.FAIL, f"Invalid project_level: {meta.get('project_level')}"))
                
        return results
        
    def _safety_checks(self, content: str) -> list[CheckResult]:
        results = []
        
        if re.search(r"eval\s*\(|exec\s*\(|subprocess\.call.*shell=True", content):
            results.append(CheckResult("no_code_injection", ValidationStatus.FAIL, "Potential code injection pattern"))
        else:
            results.append(CheckResult("no_code_injection", ValidationStatus.PASS))
            
        if re.search(r"(password|secret|api_key|token)\s*=\s*['\"]", content, re.IGNORECASE):
            results.append(CheckResult("no_secrets", ValidationStatus.WARN, "Potential hardcoded secret"))
        else:
            results.append(CheckResult("no_secrets", ValidationStatus.PASS))
            
        return results
        
    def _calculate_confidence(self, report: ValidationReport) -> float:
        score = 0.0
        for level in report.levels:
            level_score = sum(1 for c in level.checks if c.status == ValidationStatus.PASS)
            level_score /= max(len(level.checks), 1)
            score += level_score * self.LEVEL_WEIGHTS.get(level.level, 0.1)
        return min(score, 1.0)
        
    def _determine_overall_status(self, report: ValidationReport) -> ValidationStatus:
        if any(l.status == ValidationStatus.FAIL for l in report.levels):
            return ValidationStatus.FAIL
        if any(l.status == ValidationStatus.WARN for l in report.levels):
            return ValidationStatus.WARN
        return ValidationStatus.PASS
        
    def _generate_recommendations(self, report: ValidationReport) -> list[dict]:
        recs = []
        for level in report.levels:
            for check in level.checks:
                if check.status in (ValidationStatus.FAIL, ValidationStatus.WARN):
                    recs.append({
                        "priority": "high" if check.status == ValidationStatus.FAIL else "medium",
                        "action": check.message or f"Fix {check.name}",
                        "location": check.location or "unknown",
                    })
        return recs
        
    def _extract_id(self, content: str) -> str:
        yaml_match = re.search(r"# speclang-header lines:\d+\n(.*?)---", content, re.DOTALL)
        if yaml_match:
            meta = yaml.safe_load(yaml_match.group(1))
            return meta.get("id", "unknown")
        return "unknown"
        
    def _load_index(self) -> dict:
        try:
            with open(self.index_path) as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
```

## References

- "@ref:speclang/validation-tool
- @ref:speclang/autonomous-validation
- @ref:speclang/safety-nets
- SIP 16: Autonomous Validation
- SIP 22: Validation
- SIP 23: Safety Nets

## Copyright

This document is in the public domain.
