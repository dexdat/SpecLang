# speclang-header lines:10
id: "@speclang/stdlib/types"
parent: "@ref:specs/stdlib"
short: "Standard library type definitions"
project_level: Alpha
agent_support: agent_autonomous
tags: [stdlib, types, definitions]
version: 0.1.0
layer: 1
---

# Standard Library Types

Core type definitions used across SpecLang.

## Primitive Types

### @block::primitives @kind:code

Basic type definitions.

```typescript
// Primitive type definitions
export type String = string;
export type Number = number;
export type Boolean = boolean;
export type Date = string & { __brand: 'Date' };
export type UUID = string & { __brand: 'UUID' };
export type Path = string & { __brand: 'Path' };
```

## Composite Types

### @block::composite @kind:code

Complex type definitions.

```typescript
// Reference to another spec (e.g., "@specs/auth#login")
export type SpecRef = string & { __brand: 'SpecRef' };

// Abstraction layer (0-10)
export type Layer = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Project maturity level
export type MaturityLevel = 
  | 'POC'
  | 'MVP'
  | 'Alpha'
  | 'Beta'
  | 'Production'
  | 'Startup'
  | 'SMB'
  | 'MSB'
  | 'Enterprise';

// Agent role enumeration
export type AgentRole = 
  | 'NorthStar'
  | 'SpecWriter'
  | 'CodeGen'
  | 'TestWriter'
  | 'Orchestrator'
  | 'BackSync';
```

## Utility Types

### @block::utility @kind:code

Generic utility types.

```typescript
// Optional type
export type Optional<T> = T | undefined;

// List type
export type List<T> = T[];

// Map type
export type Map<K extends string | number | symbol, V> = Record<K, V>;

// Result type
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```
