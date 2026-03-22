# speclang-header lines:8
id: "@speclang/bugs"
version: 1.0.0
layer: 5
tags: [bugs, issues, fixes]
short: Collection of bug reports and fixes
---

# Bugs Collection

This directory contains bug reports and their fixes discovered during development and dogfooding.

## Overview

### @block::bug-process @kind:entity

BugProcess:
  discovery:
    - Automated tests reveal failures
    - Manual testing finds issues
    - User reports problems
    
  tracking:
    - Create bug spec in bugs.spec.dir/
    - Document expected vs actual behavior
    - Include reproduction steps
    
  resolution:
    - Fix implemented in relevant spec
    - Test added to prevent regression
    - Bug spec marked as resolved

### @block::bug-reports @kind:entity

BugReports:
  - id: cli-missing-generate-command
    title: CLI missing generate command
    status: resolved
    fix: Added generate command to CLI
    
  - id: cascade-generates-zero-files
    title: Cascade generates 0 files without error
    status: resolved
    fix: Added generateTypeScriptFromBlock function

### @block::resolution-patterns @kind:entity

ResolutionPatterns:
  spec_fix:
    description: Bug was in spec definition
    action: Update spec with correct behavior
    
  implementation_fix:
    description: Bug was in generated code
    action: Fix codegen logic
    
  validation_fix:
    description: Bug was in validation
    action: Add validation rule

### @block::quality-gates @kind:entity

QualityGates:
  - All specs must pass validation
  - All tests must pass
  - Build must compile without errors
  - No regressions allowed
