---
name: sip-101-behavior-matrix-speclang-v0
title: "SIP 101: Agent Behavior Matrix"
version: 0.1.0
description: Matrix defining agent behavior across agent_support and project_level combinations
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 101: Agent Behavior Matrix

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the behavior matrix for agent actions based on agent_support and project_level combinations.

### Quick Start

The matrix maps:
- Rows: agent_support levels (human_only, agent_assisted, agent_autonomous)
- Columns: project_level (POC, MVP, Alpha, Beta, Production)
- Cells: Permitted actions

### When to Read This

- Configuring agent behavior
- Determining what agents can do
- Planning transitions
- Validating appropriate levels

### Related SIPs

- SIP 19: Agent Support Levels
- SIP 99: Agent-Assisted
- SIP 100: Agent-Autonomous
- SIP 18: Maturity Levels

## Abstract

This SIP defines an explicit matrix that maps agent_support levels and project_levels to specific agent behaviors. This provides clear expectations for what agents can and cannot do in any given context.

## Matrix Overview

### Core Matrix

```yaml
BehaviorMatrix:
  dimensions:
    - agent_support: [human_only, agent_assisted, agent_autonomous]
    - project_level: [POC, MVP, Alpha, Beta, Production, Startup, SMB, MSB, Enterprise]
    
  action_categories:
    - spec_reading
    - spec_writing
    - code_generation
    - test_generation
    - deployment
    - self_correction
```

### Simplified Matrix

| agent_support | project_level | Code Gen | Tests | Deploy | Commit |
|---------------|----------------|----------|-------|--------|--------|
| human_only    | POC            | No       | No    | No     | No     |
| human_only    | MVP            | No       | No    | No     | No     |
| human_only    | Alpha          | No       | No    | No     | No     |
| human_only    | Beta           | No       | No    | No     | No     |
| human_only    | Production     | No       | No    | No     | No     |
| agent_assisted| POC            | Draft    | Draft | No     | Review |
| agent_assisted| MVP            | Draft    | Draft | No     | Review |
| agent_assisted| Alpha          | Full     | Full  | No     | Review |
| agent_assisted| Beta           | Full     | Full  | No     | Review |
| agent_assisted| Production     | Full     | Full  | Review | Review |
| agent_autonomous| POC         | **Invalid** | **Invalid** | **Invalid** | **Invalid** |
| agent_autonomous| MVP          | **Invalid** | **Invalid** | **Invalid** | **Invalid** |
| agent_autonomous| Alpha        | **Invalid** | **Invalid** | **Invalid** | **Invalid** |
| agent_autonomous| Beta         | Full     | Full  | No     | Auto   |
| agent_autonomous| Production   | Full     | Full  | Auto   | Auto   |

## Detailed Rules

### human_only Rules

```yaml
human_onlyRules:
  POC:
    can:
      - "Read specs"
      - "Suggest improvements"
      - "Provide research"
    cannot:
      - "Generate code"
      - "Generate tests"
      - "Commit anything"
      - "Deploy anything"
      
  MVP:
    can:
      - "Read specs"
      - "Suggest improvements"
      - "Find patterns"
    cannot:
      - "Generate code"
      - "Generate tests"
      - "Commit anything"
      
  Alpha, Beta, Production:
    can:
      - "Read specs"
      - "Suggest improvements"
      - "Analyze code"
    cannot:
      - "Generate anything"
      - "Commit anything"
```

### agent_assisted Rules

```yaml
agent_assistedRules:
  POC:
    can:
      - "Read specs"
      - "Draft documentation"
      - "Generate draft code"
      - "Generate draft tests"
    cannot:
      - "Commit without approval"
      - "Deploy"
    must_have_approval:
      - "All commits"
      - "All code changes"
      
  MVP:
    can:
      - "Full code generation"
      - "Full test generation"
      - "Documentation"
      - "Refactoring"
    cannot:
      - "Deploy"
      - "Commit without approval"
    must_have_approval:
      - "All commits"
      - "New features"
      
  Alpha:
    can:
      - "Full code generation"
      - "Full test generation"
      - "Bug fixes"
      - "Refactoring"
    cannot:
      - "Deploy"
      - "Breaking changes"
    must_have_approval:
      - "All commits"
      - "New features"
      
  Beta:
    can:
      - "Full code generation"
      - "Full test generation"
      - "Bug fixes"
      - "Minor refactoring"
    cannot:
      - "Deploy to production"
    must_have_approval:
      - "Production deploys"
      - "Breaking changes"
      
  Production:
    can:
      - "Full code generation"
      - "Full test generation"
      - "Bug fixes"
      - "Non-breaking changes"
    must_have_approval:
      - "All production deploys"
      - "All breaking changes"
```

### agent_autonomous Rules

```yaml
agent_autonomousRules:
  Beta:
    can:
      - "Full code generation"
      - "Full test generation"
      - "Bug fixes"
      - "Refactoring"
      - "Commit autonomously"
      - "Deploy to staging"
    cannot:
      - "Deploy to production"
    must_escalate:
      - "Security issues"
      - "Production incidents"
      
  Production:
    can:
      - "Full code generation"
      - "Full test generation"
      - "Bug fixes"
      - "Refactoring"
      - "Commit autonomously"
      - "Deploy autonomously (non-breaking)"
    cannot:
      - "Deploy breaking changes"
      - "Expose secrets"
    must_escalate:
      - "Security vulnerabilities"
      - "Major incidents"
```

## Invalid Combinations

### Why Some Combinations Are Invalid

```yaml
invalidCombinations:
  agent_autonomous + POC:
    reason: "POC is experimental, needs human judgment"
    suggestion: "Use human_only or agent  agent_autonomous + MVP:
   _assisted"
    
 reason: "MVP has unvalidated features"
    suggestion: "Use agent_assisted until features validated"
    
  agent_autonomous + Alpha:
    reason: "Alpha has incomplete features"
    suggestion: "Use agent_assisted until feature complete"
```

### Validation Rules

```yaml
validationForCombinations:
  rules:
    - "POC + agent_autonomous = Invalid"
    - "MVP + agent_autonomous = Invalid"  
    - "Alpha + agent_autonomous = Invalid"
    
  warnings:
    - "Production + human_only = Inefficient"
    - "POC + agent_assisted = Review recommended"
    
  valid:
    - "Any + human_only"
    - "Any + agent_assisted (with approvals)"
    - "Beta/Production + agent_autonomous"
```

## Special Cases

### Startup and SMB Levels

```yaml
StartupSMBRules:
  Startup:
    typical: "agent_assisted"
    allowed: ["human_only", "agent_assisted"]
    autonomous: "Rare (only for trivial changes)"
    
  SMB:
    typical: "agent_assisted to agent_autonomous"
    allowed: ["agent_assisted", "agent_autonomous"]
    autonomous: "For well-documented features"
```

### MSB and Enterprise Levels

```yaml
MSBEnterpriseRules:
  MSB:
    typical: "agent_autonomous"
    requirements:
      - "Complete documentation"
      - "Full test coverage"
      - "Security review"
      - "Compliance checks"
      
  Enterprise:
    typical: "agent_autonomous with constraints"
    requirements:
      - "All MSB requirements"
      - "Audit trail"
      - "Compliance validation"
      - "Executive approval for production"
```

## Action Permissions

### Code Generation

```yaml
CodeGenPermissions:
  human_only:
    - "None"
    
  agent_assisted:
    - "Draft code (needs review)"
    - "Draft tests (needs review)"
    - "Refactor suggestions"
    
  agent_autonomous:
    - "Full code generation"
    - "Full test generation"
    - "Self-correction"
    - "Refactoring"
```

### Deployment

```yaml
DeploymentPermissions:
  human_only:
    - "None"
    
  agent_assisted:
    - "Staging (with approval)"
    - "Production (with approval)"
    
  agent_autonomous:
    - "Staging (full)"
    - "Production (non-breaking only)"
    - "Breaking (requires approval)"
```

### Commit

```yaml
CommitPermissions:
  human_only:
    - "None (humans commit)"
    
  agent_assisted:
    - "Draft commits (needs review)"
    - "Full commits (needs approval)"
    
  agent_autonomous:
    - "Full commits autonomously"
    - "Auto-merge on passing tests"
```

## Matrix Lookup

### Algorithm

```yaml
LookupAlgorithm:
  input:
    - agent_support
    - project_level
    
  steps:
    1. "Check if combination is valid"
    2. "If invalid, return error with suggestion"
    3. "If valid, return permitted actions"
    4. "Highlight actions requiring approval"
    5. "Show escalation requirements"
    
  output:
    - can_do: [list of actions]
    - cannot_do: [list of actions]
    - approval_required: [list of actions]
    - escalate: [list of triggers]
```

## Examples

### Example 1: Production + agent_autonomous

```yaml
context:
  agent_support: agent_autonomous
  project_level: Production
  
result:
  can_do:
    - "Generate code from specs"
    - "Write tests"
    - "Fix bugs"
    - "Refactor"
    - "Commit autonomously"
    - "Deploy non-breaking"
    
  cannot_do:
    - "Deploy breaking changes"
    - "Expose secrets"
    
  approval_required:
    - "Breaking changes"
    - "New dependencies"
    
  escalate:
    - "Security vulnerabilities"
    - "Major incidents"
```

### Example 2: Alpha + agent_assisted

```yaml
context:
  agent_support: agent_assisted
  project_level: Alpha
  
result:
  can_do:
    - "Generate code"
    - "Write tests"
    - "Refactor"
    - "Fix bugs"
    
  cannot_do:
    - "Deploy to production"
    
  approval_required:
    - "All commits"
    - "New features"
```

## Summary

| Combination | Code | Tests | Commit | Deploy |
|-------------|------|-------|--------|--------|
| human_only + Any | No | No | No | No |
| assisted + POC | Draft | Draft | Review | No |
| assisted + MVP/Alpha | Full | Full | Review | Review |
| assisted + Beta/Prod | Full | Full | Review | Review |
| autonomous + Beta | Full | Full | Auto | Staging |
| autonomous + Prod | Full | Full | Auto | Non-breaking |

## References

- "@ref:speclang/agent-support-levels
- @ref:speclang/agent-assisted
- @ref:speclang/agent-autonomous
- @ref:speclang/maturity-levels
- SIP 19: Agent Support Levels

## Copyright

This document is in the public domain.
