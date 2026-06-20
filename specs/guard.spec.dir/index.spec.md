# speclang-header lines:10
id: "@specs/guard"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
target: src/guard/
tags: [guard, ownership, security]
short: Agent ownership and write access guard system
---

# Guard System Specification

The Guard System enforces file ownership rules to prevent agents from writing to files they don't own. It provides interceptors for write, delete, and rename operations.

## Overview

The Guard System is a security layer that:
- Defines ownership rules for each agent role
- Intercepts file write/delete/rename operations
- Tracks violations when unauthorized access is attempted
- Provides override capabilities for temporary ownership changes

## Architecture

### Components

1. **OwnershipRegistry** (`registry.ts`) - Manages ownership rules and pattern matching
2. **WriteInterceptor** (`interceptor.ts`) - Intercepts file operations and enforces rules
3. **ViolationTracker** (`violations.ts`) - Tracks all policy violations
4. **Rules** (`rules.ts`) - Default ownership rules
5. **Types** (`types.ts`) - TypeScript type definitions

### @block::ownership-rules @kind:data

Default ownership rules define which agent owns which files:

| Agent | Patterns | Priority |
|-------|----------|----------|
| north-star | project.scl, docs/NORTH_STAR.md, .speclang/project.yaml, SPEC.md | 100 |
| spec-writer | specs/**/*.spec.*, specs/**/*.scl | 50 |
| code-gen | src/**/*.{ts,js,go,py,rs}, generated/**/* | 40 |
| test-writer | tests/**/*.test.{ts,js}, tests/**/*.spec.{ts,js} | 30 |
| back-sync | generated/**/*, src-backup/**/* | 20 |

Higher priority wins when there are conflicts.

### @block::interceptor @kind:component

**WriteInterceptor** - Main interceptor class

**Responsibilities:**
- Intercept write/delete/rename operations
- Check ownership against registry
- Record violations when access is denied
- Track statistics

**Public API:**
```typescript
class WriteInterceptor {
  constructor(registry: OwnershipRegistry, violations: ViolationTracker, config?: Partial<GuardConfig>)
  
  async interceptWrite(agent: AgentRole, filepath: string, content?: string): Promise<InterceptResult>
  async interceptDelete(agent: AgentRole, filepath: string): Promise<InterceptResult>
  async interceptRename(agent: AgentRole, oldPath: string, newPath: string): Promise<InterceptResult>
  
  checkOwnership(agent: AgentRole, filepath: string): InterceptResult
  validateContent(filepath: string, content: string): Promise<ValidationResult>
  
  getStats(): GuardStats
  getRegistry(): OwnershipRegistry
  getViolations(): ViolationTracker
}
```

### @block::registry @kind:component

**OwnershipRegistry** - Rule management and pattern matching

**Responsibilities:**
- Store and query ownership rules
- Match file paths against glob patterns
- Manage override rules
- Resolve conflicts

**Public API:**
```typescript
class OwnershipRegistry {
  constructor(rules?: OwnershipRule[])
  
  getOwner(filepath: string): AgentRole | null
  canWrite(agent: AgentRole, filepath: string): OwnershipCheck
  addRule(rule: OwnershipRule): void
  removeRule(agent: AgentRole): void
  addOverride(override: OverrideRule): void
  resolveConflicts(): Conflict[]
}
```

### @block::violations @kind:component

**ViolationTracker** - Tracks policy violations

**Public API:**
```typescript
class ViolationTracker {
  constructor(maxViolations?: number)
  
  record(violation: Omit<Violation, 'id' | 'timestamp' | 'resolved'>): string
  resolve(violationId: string, resolution: Violation['resolution'], by: AgentRole): boolean
  
  getUnresolved(): Violation[]
  getByAgent(agent: AgentRole): Violation[]
  getByFilepath(filepath: string): Violation[]
  getAll(): Violation[]
  export(): ViolationReport
}
```

## Configuration

### @block::config @kind:data

```typescript
interface GuardConfig {
  enabled: boolean;              // Enable/disable guard
  enforceOnOrchestrator: boolean; // Apply rules to orchestrator
  logViolations: boolean;      // Log blocked attempts
  strictMode: boolean;         // Reject all unauthorized
}

const DEFAULT_GUARD_CONFIG = {
  enabled: true,
  enforceOnOrchestrator: false,
  logViolations: true,
  strictMode: false,
};
```

## Usage

### @block::usage @kind:example

```typescript
import { getGuard, checkOwnership, initGuard } from '@speclang/guard';

// Get default guard instance
const guard = getGuard();

// Check if agent can write to file
const result = guard.checkOwnership('code-gen', 'src/main.ts');
if (!result.allowed) {
  console.log(result.reason);
}

// Intercept a write
await guard.interceptWrite('spec-writer', 'src/main.ts');

// Initialize with custom rules
initGuard(customRules, { strictMode: true });
```

## References

- "@ref:specs/core#agents - Agent definitions"
- @ref:specs/agents/types - AgentRole type
