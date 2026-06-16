# speclang-header lines:8
id: "@specs/safety-confidence"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [safety, confidence, validation]
short: Safety Confidence Scoring system for validation decisions
---

# Safety Confidence Scoring

This spec defines the confidence scoring system for safety validation decisions in SpecLang autonomous operations.

## @block:overview @kind:note

The Safety Confidence Scoring system:
1. **Signal Analysis**: Weight multiple safety signals
2. **Threshold Matrix**: Project level based thresholds
3. **Confidence Levels**: high, medium, low, none
4. **Decision Rules**: When to proceed, fallback, or abort

## @block:references @kind:ref

- "@ref:speclang/safety-nets
- @ref:speclang/autonomous-validation
- @ref:speclang/security

## @block:implementation @kind:note

Implementation lives in:
- `specs/safety-confidence.spec.dir/src/confidence-scorer.ts`
- `specs/safety-confidence.spec.dir/src/index.ts`
