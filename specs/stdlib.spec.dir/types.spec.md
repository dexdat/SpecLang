# speclang-header lines:9
id: "@speclang/stdlib/types"
parent: ""@ref:specs/stdlib"short: "Standard library type definitions"
project_level: Alpha
agent_support: agent_autonomous
tags: [stdlib, types, definitions]
version: 0.1.0
layer: 1
---

# Standard Library Types

Core type definitions used across SpecLang.

## Primitive Types

### @stdlib/types/primitives

Basic type definitions.

**Types:**
- `String`: Unicode text
- `Number`: Integer or floating point
- `Boolean`: true/false
- `Date`: ISO 8601 datetime
- `UUID`: Unique identifier
- `Path`: File system path

## Composite Types

### @stdlib/types/composite

Complex type definitions.

**Types:**
- `SpecRef`: Reference to another spec
- `Version`: Semantic version
- `Layer`: Abstraction layer (0-10)
- `MaturityLevel`: Project maturity level
- `AgentRole`: Agent role enumeration

## Utility Types

### @stdlib/types/utility

Generic utility types.

**Types:**
- `Optional<T>`: T or undefined
- `List<T>`: Ordered collection
- `Map<K,V>`: Key-value mapping
- `Result<T,E>`: Success or error
