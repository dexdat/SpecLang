# speclang-header lines:6
id: "@specs/docs"
version: 1.0.0
layer: 5
short: Documentation specifications
tags: [docs, documentation]
---
# Documentation Specifications

SpecLang documentation is generated from specs and follows a consistent structure.

## Overview

```speclang
# @block:docs/overview @kind:entity
DocumentationSystem:
  purpose: Generate and maintain documentation from specs
  sources:
    - specs: Primary source of truth
    - generated code: Auto-generated API docs
    - user guides: Manual documentation
  
  outputs:
    - README.md: Project overview
    - docs/: Detailed documentation
    - API references: Generated from code
    - tutorials: Step-by-step guides
```

## Documentation Types

```speclang
# @block:docs/types @kind:entity
DocumentationTypes:
  project_documentation:
    - NORTH_STAR.md: Vision and principles
    - AGENTS.md: Development guide for AI agents
    - CONTEXT.md: Session context for agents
    - GETTING_STARTED.md: Quick start guide
  
  spec_documentation:
    - Each spec file is self-documenting
    - Header fields provide metadata
    - Block structure provides content
  
  generated_documentation:
    - API docs from TypeScript/Go code
    - CLI help from command definitions
    - Configuration reference from schema
```

## Documentation Generation

```speclang
# @block:docs/generation @kind:operation
DocumentationGeneration:
  steps:
    - Extract documentation blocks from specs
    - Generate markdown files in docs/
    - Update README with project status
    - Generate API documentation using TypeDoc/JSDoc
    - Create CLI help pages
  
  automation:
    - Cascade triggers documentation updates
    - Documentation is regenerated when specs change
    - Versioned documentation for each release
```

## Documentation Structure

```speclang
# @block:docs/structure @kind:entity
DocumentationStructure:
  docs/ directory:
    - NORTH_STAR.md: Vision and principles
    - AGENTS.md: AI agent development guide
    - CONTEXT.md: Session context
    - GETTING_STARTED.md: Quick start
    - ARCHITECTURE.md: System architecture
    - API.md: API reference
    - CLI.md: Command-line interface reference
    - EXAMPLES.md: Example projects
    - TROUBLESHOOTING.md: Common issues
  
  spec documentation:
    - Each spec file includes its own documentation
    - Use @kind:note blocks for explanatory content
    - Use @kind:entity blocks for structured data
```

## Implementation

```speclang
# @block:docs/implementation @kind:note
Documentation generation is implemented in scripts/generate-docs.py.

Key features:
- Parses spec headers and blocks
- Generates markdown with table of contents
- Updates existing documentation files
- Ensures links are valid

The documentation system is self-documenting: this spec describes how documentation works.
```