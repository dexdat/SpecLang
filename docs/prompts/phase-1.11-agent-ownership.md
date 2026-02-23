# Bootstrap Phase 1.11: Agent File Ownership

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.11 of the bootstrap process.

**Prerequisites**: 
- Phase 0 (Foundation) complete
- Phase 1.1-1.10 (Daemon, Agents, Sessions) in progress

## Your Task
Implement the file ownership system that controls which agents can write to which files, with write interception and violation tracking.

## Read These Specs First
1. `specs/agent-protocol.spec.dir/ownership.spec.md` - Ownership definitions
2. `specs/agent-protocol.spec.dir/rules.spec.md` - Ownership rules
3. `specs/agent-protocol.spec.dir/violations.spec.md` - Violation tracking
4. `specs/core.spec.dir/agents.spec.md` - Agent roles

## What to Build

### Files to Create
```
src/agents/
├── ownership/
│   ├── index.ts           # Main exports
│   ├── types.ts           # Ownership types
│   ├── registry.ts        # Ownership registry
│   ├── rules.ts           # Default rules
│   ├── guard.ts           # Write interceptor
│   ├── violations.ts      # Violation tracker
│   └── transfer.ts        # Ownership transfer

tests/
└── agent-ownership.test.ts
```

### Requirements

#### 1. Ownership Types

```typescript
// src/agents/ownership/types.ts

type AgentRole = 
  | 'orchestrator'   // User's primary AI - highest priority
  | 'spec-writer'    // Expands specs
  | 'code-gen'       // Generates code
  | 'test-writer'    // Writes tests
  | 'back-sync';     // Syncs code to spec

interface OwnershipRule {
  agent: AgentRole;
  patterns: string[];      // Glob patterns
  priority: number;        // Higher wins on conflict
  exclusive?: boolean;     // Only this agent can write
}

interface OwnershipMatch {
  agent: AgentRole;
  pattern: string;
  priority: number;
}

interface Violation {
  id: string;
  agent: AgentRole;
  filepath: string;
  attempted_at: Date;
  reason: string;
  resolved: boolean;
}
```

#### 2. Default Rules

```typescript
// src/agents/ownership/rules.ts

export const DEFAULT_RULES: OwnershipRule[] = [
  {
    agent: 'orchestrator',
    patterns: ['project.scl', '.speclang/**/*'],
    priority: 100,
    exclusive: true
  },
  {
    agent: 'spec-writer',
    patterns: [
      'specs/**/*.scl',
      'specs/**/*.spec.md',
      'specs/**/*.spec.yaml'
    ],
    priority: 50
  },
  {
    agent: 'code-gen',
    patterns: [
      'src/**/*.ts',
      'src/**/*.go',
      'generated/**/*'
    ],
    priority: 40
  },
  {
    agent: 'test-writer',
    patterns: [
      'tests/**/*.test.ts',
      'tests/**/*.test.go',
      'tests/**/*.spec.ts'
    ],
    priority: 30
  },
  {
    agent: 'back-sync',
    patterns: [], // No direct ownership - reads only
    priority: 20
  }
];

export const ORCHESTRATOR_RULE: OwnershipRule = {
  agent: 'orchestrator',
  patterns: ['**/*'], // Can write anywhere
  priority: 100,
  exclusive: false
};

export function isExemptFromGuard(role: AgentRole): boolean {
  // Orchestrator bypasses all guards
  return role === 'orchestrator';
}

export function getAgentPriority(role: AgentRole): number {
  const rule = DEFAULT_RULES.find(r => r.agent === role);
  return rule?.priority || 0;
}

export function validateRules(
  rules: OwnershipRule[]
): { valid: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  
  // Check for overlapping patterns with same priority
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      if (rules[i].priority === rules[j].priority) {
        const overlap = findPatternOverlap(
          rules[i].patterns,
          rules[j].patterns
        );
        if (overlap.length > 0) {
          conflicts.push(
            `Rules for ${rules[i].agent} and ${rules[j].agent} ` +
            `conflict on patterns: ${overlap.join(', ')}`
          );
        }
      }
    }
  }
  
  return {
    valid: conflicts.length === 0,
    conflicts
  };
}
```

#### 3. Ownership Registry

```typescript
// src/agents/ownership/registry.ts

export class OwnershipRegistry {
  private rules: OwnershipRule[];
  private overrides: Map<string, AgentRole>;
  
  constructor(rules: OwnershipRule[] = DEFAULT_RULES) {
    this.rules = [...rules].sort((a, b) => b.priority - a.priority);
    this.overrides = new Map();
  }
  
  getOwner(filepath: string): AgentRole | null {
    // Check overrides first
    const override = this.overrides.get(filepath);
    if (override) return override;
    
    // Find matching rule with highest priority
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (this.matchPattern(filepath, pattern)) {
          return rule.agent;
        }
      }
    }
    
    return null;
  }
  
  canWrite(agent: AgentRole, filepath: string): boolean {
    // Orchestrator can always write
    if (isExemptFromGuard(agent)) return true;
    
    const owner = this.getOwner(filepath);
    
    // No owner means anyone can write
    if (!owner) return true;
    
    return owner === agent;
  }
  
  getOwnedFiles(role: AgentRole): string[] {
    const rule = this.rules.find(r => r.agent === role);
    if (!rule) return [];
    
    const files: string[] = [];
    for (const pattern of rule.patterns) {
      files.push(...globSync(pattern));
    }
    return files;
  }
  
  createOverride(
    filepath: string, 
    newOwner: AgentRole
  ): void {
    this.overrides.set(filepath, newOwner);
  }
  
  removeOverride(filepath: string): void {
    this.overrides.delete(filepath);
  }
  
  register(rule: OwnershipRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }
  
  private matchPattern(filepath: string, pattern: string): boolean {
    // Simple glob matching
    const regex = pattern
      .replace(/\*\*/g, '<<DOUBLESTAR>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<DOUBLESTAR>>/g, '.*')
      .replace(/\?/g, '[^/]');
    
    return new RegExp(`^${regex}$`).test(filepath);
  }
}
```

#### 4. Write Guard/Interceptor

```typescript
// src/agents/ownership/guard.ts

export class WriteInterceptor {
  private registry: OwnershipRegistry;
  private violationTracker: ViolationTracker;
  private enabled: boolean;
  
  constructor(
    registry: OwnershipRegistry,
    violationTracker: ViolationTracker
  ) {
    this.registry = registry;
    this.violationTracker = violationTracker;
    this.enabled = true;
  }
  
  enable(): void {
    this.enabled = true;
  }
  
  disable(): void {
    this.enabled = false;
  }
  
  async interceptWrite(
    agent: AgentRole,
    filepath: string,
    content: string
  ): Promise<InterceptResult> {
    if (!this.enabled) {
      return { allowed: true };
    }
    
    // Check if exempt
    if (isExemptFromGuard(agent)) {
      return { allowed: true };
    }
    
    // Check ownership
    if (!this.registry.canWrite(agent, filepath)) {
      const owner = this.registry.getOwner(filepath);
      
      // Record violation
      this.violationTracker.record({
        agent,
        filepath,
        reason: `File owned by ${owner}, not ${agent}`,
        attempted_at: new Date()
      });
      
      return {
        allowed: false,
        reason: 'access_denied',
        owner: owner || undefined,
        message: `Agent ${agent} cannot write to ${filepath}. Owned by ${owner}.`
      };
    }
    
    return { allowed: true };
  }
  
  getFileOwner(filepath: string): AgentRole | null {
    return this.registry.getOwner(filepath);
  }
}

interface InterceptResult {
  allowed: boolean;
  reason?: 'access_denied' | 'locked';
  owner?: AgentRole;
  message?: string;
}
```

#### 5. Violation Tracker

```typescript
// src/agents/ownership/violations.ts

export interface ViolationTracker {
  record(violation: Omit<Violation, 'id'>): void;
  getViolations(filter?: ViolationFilter): Violation[];
  resolve(violationId: string): void;
  clear(): void;
}

interface ViolationFilter {
  agent?: AgentRole;
  filepath?: string;
  resolved?: boolean;
}

export function createViolationTracker(
  maxViolations: number = 1000
): ViolationTracker {
  const violations: Violation[] = [];
  
  return {
    record(violation) {
      const id = `violation-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      
      violations.push({
        id,
        ...violation,
        resolved: false
      });
      
      // Trim old violations
      while (violations.length > maxViolations) {
        violations.shift();
      }
    },
    
    getViolations(filter = {}) {
      return violations.filter(v => {
        if (filter.agent && v.agent !== filter.agent) return false;
        if (filter.filepath && v.filepath !== filter.filepath) return false;
        if (filter.resolved !== undefined && v.resolved !== filter.resolved) {
          return false;
        }
        return true;
      });
    },
    
    resolve(violationId) {
      const violation = violations.find(v => v.id === violationId);
      if (violation) {
        violation.resolved = true;
      }
    },
    
    clear() {
      violations.length = 0;
    }
  };
}
```

#### 6. Ownership Transfer

```typescript
// src/agents/ownership/transfer.ts

interface TransferRequest {
  from: AgentRole;
  to: AgentRole;
  filepath: string;
  reason: string;
}

interface TransferResult {
  success: boolean;
  previousOwner: AgentRole | null;
  newOwner: AgentRole;
  reason?: string;
}

export class OwnershipTransfer {
  private registry: OwnershipRegistry;
  private transferLog: TransferRecord[];
  
  constructor(registry: OwnershipRegistry) {
    this.registry = registry;
    this.transferLog = [];
  }
  
  request(request: TransferRequest): TransferResult {
    const currentOwner = this.registry.getOwner(request.filepath);
    
    // Verify current owner matches
    if (currentOwner !== request.from) {
      return {
        success: false,
        previousOwner: currentOwner,
        newOwner: request.to,
        reason: `Current owner is ${currentOwner}, not ${request.from}`
      };
    }
    
    // Create override
    this.registry.createOverride(request.filepath, request.to);
    
    // Log transfer
    this.transferLog.push({
      filepath: request.filepath,
      from: request.from,
      to: request.to,
      reason: request.reason,
      timestamp: new Date()
    });
    
    return {
      success: true,
      previousOwner: currentOwner,
      newOwner: request.to
    };
  }
  
  getTransferHistory(filepath?: string): TransferRecord[] {
    if (filepath) {
      return this.transferLog.filter(t => t.filepath === filepath);
    }
    return [...this.transferLog];
  }
}

interface TransferRecord {
  filepath: string;
  from: AgentRole;
  to: AgentRole;
  reason: string;
  timestamp: Date;
}
```

#### 7. Guard Statistics

```typescript
// src/agents/ownership/guard.ts (continued)

export function getGuardStats(
  interceptor: WriteInterceptor,
  tracker: ViolationTracker
): GuardStats {
  const violations = tracker.getViolations();
  
  return {
    enabled: true,
    total_violations: violations.length,
    unresolved: violations.filter(v => !v.resolved).length,
    by_agent: countByAgent(violations),
    recent: violations.slice(-10)
  };
}

interface GuardStats {
  enabled: boolean;
  total_violations: number;
  unresolved: number;
  by_agent: Record<AgentRole, number>;
  recent: Violation[];
}

function countByAgent(violations: Violation[]): Record<AgentRole, number> {
  return violations.reduce((acc, v) => {
    acc[v.agent] = (acc[v.agent] || 0) + 1;
    return acc;
  }, {} as Record<AgentRole, number>);
}
```

## Ownership Matrix

```
| Agent       | Priority | Owns                          | Can Read |
|-------------|----------|-------------------------------|----------|
| orchestrator| 100      | project.scl, .speclang/**/*   | **/*     |
| spec-writer | 50       | specs/**/*.scl, *.spec.*      | specs/** |
| code-gen    | 40       | src/**, generated/**          | specs/** |
| test-writer | 30       | tests/**                      | src/**   |
| back-sync   | 20       | (none - reads only)           | all      |
```

## Test Cases
1. Get owner for each file pattern
2. Allow write to owned file
3. Block write to non-owned file
4. Orchestrator bypasses all guards
5. Record and retrieve violations
6. Transfer ownership
7. Resolve violations
8. Guard stats accurate
9. Override rules work

## Validation
```bash
bun test tests/agent-ownership.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Test results
3. Ownership rules summary
