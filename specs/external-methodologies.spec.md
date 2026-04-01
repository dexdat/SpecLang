# speclang-header lines:12
id: "@speclang/external-methodologies"
version: 0.1.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [methodology, bmad, comparison, external, reference]
children:
  - "@ref:specs/external-methodologies.spec.dir/bmad-comparison"  - "@ref:@ref:specs/external-methodologies.spec.dir/recommendations"  - "@ref:specs/external-methodologies.spec.dir/adoption-patterns"
short: External Methodologies - Analysis of BMAD and other AI-driven development frameworks
---

# External Methodologies

Analysis of external AI-driven development methodologies and their relationship to SpecLang. Provides guidance on when and how to integrate patterns from other frameworks.

## Overview

This spec analyzes external methodologies—particularly BMAD (Breakthrough Method for Agile AI-Driven Development)—to identify patterns that could enhance SpecLang while maintaining its unique philosophy.

**Key Principle**: SpecLang is a specification *language*, not a methodology. External methodologies provide workflows; SpecLang provides the format for expressing specifications.

## Related Specs

This spec is split into sub-specs:

- **[@ref:specs/external-methodologies.spec.dir/bmad-comparison]** – Detailed comparison between SpecLang and BMAD
- **[@ref:specs/external-methodologies.spec.dir/recommendations]** – Specific recommendations for adopting BMAD patterns  
- **[@ref:specs/external-methodologies.spec.dir/adoption-patterns]** – How to map external patterns to SpecLang

See [external-methodologies.spec.dir/_index.md](./external-methodologies.spec.dir/_index.md) for directory overview.

## Quick Reference

| External Framework | Relationship to SpecLang |
|-------------------|-------------------------|
| BMAD | Complementary methodology; SpecLang can express BMAD artifacts |
| GitHub Spec Kit | Similar spec-driven approach; different syntax |
| Vibe Coding | Unstructured; SpecLang provides structure |

## When to Reference External Methodologies

Use external methodologies when:
- You need workflow guidance (BMAD's four-phase approach)
- You're familiar with another framework and want to map concepts
- You want validation patterns from mature frameworks
- You're building SpecLang tooling that integrates with external systems

**Do NOT** use external methodologies when:
- Defining SpecLang's core format (specs are self-describing)
- Writing implementation specs (use SpecLang patterns)
- Agents need autonomous operation (SpecLang format is source of truth)
