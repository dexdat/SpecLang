# Bootstrap Phase 4.2: Guard System

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.2 of the bootstrap process.

**Prerequisites**: 
- Phase 0-3 complete
- Phase 4.1 (Pipeline) complete

## Your Task
Implement the file ownership guard that enforces which agent can write to which file. This prevents agents from stepping on each other's work.

## Read These Specs First
1. `specs/agent-protocol.spec.md` - Agent protocol
2. `specs/agent-protocol.spec.dir/ownership.spec.md` - Ownership rules
3. `specs/git-history.spec.md` - Per-file commits

## What to Build

### Files to Create
```
src/guard/
├── index.ts            # Main exports
├── registry.ts         # Ownership registry
├── interceptor.ts      # Write interceptor
├── rules.ts            # Rule definitions
├── violations.ts       # Violation tracking
└── types.ts            # TypeScript types

tests/
└── guard.test.ts
```

### Requirements

#### 1. Ownership Rules

```typescript
// src/guard/rules.ts

interface OwnershipRule {
  agent: AgentRole;
  patterns: string[];   // Glob patterns
  priority: number;     // Higher wins on conflict
  description: string;
}

export const DEFAULT_RULES: OwnershipRule[] = [
  {
    agent: 'north-star',
    patterns: ['specs/project.scl', 'docs/NORTH_STAR.md'],
    priority: 100,
    description: 'North star owns project definition'
  },
  {
    agent: 'spec-writer',
    patterns: [
      'specs/**/*.spec.md',
      'specs/**/*.spec.yaml',
      'specs/**/*.scl'
    ],
    priority: 50,
    description: 'Spec writer owns all spec files'
  },
  {
    agent: 'code-gen',
    patterns: [
      'src/**/*.ts',
      'src/**/*.js',
      'src/**/*.go',
      'src/**/*.py',
      'src/**/*.rs'
    ],
    priority: 40,
    description: 'Code gen owns generated source code'
  },
  {
    agent: 'test-writer',
    patterns: [
      'tests/**/*.test.ts',
      'tests/**/*.test.js',
      'tests/**/*.spec.ts'
    ],
    priority: 30,
    description: 'Test writer owns test files'
  },
  {
    agent: 'daemon',
    patterns: [
      '.speclang/**/*',
      '_index.json'
    ],
    priority: 20,
    description: 'Daemon owns runtime state'
  }
];

// Orchestrator can write anywhere
export const ORCHESTRATOR_RULE: OwnershipRule = {
  agent: 'orchestrator',
  patterns: ['**/*'],
  priority: 1000,
  description: 'Orchestrator has full access'
};
```

#### 2. Ownership Registry

```typescript
// src/guard/registry.ts

export class OwnershipRegistry {
  private rules: OwnershipRule[] = [];
  private customRules: Map<string, OwnershipRule[]> = new Map();
  
  constructor() {
    this.rules = [...DEFAULT_RULES, ORCHESTRATOR_RULE];
  }
  
  // Get owner of a file
  getOwner(filepath: string): AgentRole | null {
    const matchingRules = this.rules
      .filter(rule => this.matchesPattern(filepath, rule.patterns))
      .sort((a, b) => b.priority - a.priority);
    
    return matchingRules[0]?.agent || null;
  }
  
  // Check if agent can write to file
  canWrite(agentId: string, filepath: string): boolean {
    const agent = this.getAgentRole(agentId);
    const owner = this.getOwner(filepath);
    
    // Orchestrator can write anything
    if (agent === 'orchestrator') return true;
    
    // Must be the owner
    return agent === owner;
  }
  
  // Register custom rule
  registerRule(rule: OwnershipRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }
  
  // Get all files owned by agent
  getOwnedFiles(role: AgentRole): string[] {
    const rule = this.rules.find(r => r.agent === role);
    if (!rule) return [];
    
    return this.globSync(rule.patterns);
  }
  
  // Transfer ownership (for handoffs)
  transferOwnership(
    filepath: string, 
    fromAgent: AgentRole, 
    toAgent: AgentRole
  ): void {
    // Log transfer
    this.logTransfer(filepath, fromAgent, toAgent);
    
    // Add temporary override
    this.customRules.set(filepath, [{
      agent: toAgent,
      patterns: [filepath],
      priority: 200,
      description: `Transferred from ${fromAgent}`
    }]);
  }
}
```

#### 3. Write Interceptor

```typescript
// src/guard/interceptor.ts

export class WriteInterceptor {
  private registry: OwnershipRegistry;
  private violations: ViolationLog;
  
  // Intercept file write
  async interceptWrite(
    agentId: string,
    filepath: string,
    content: string
  ): Promise<WriteResult> {
    // Check ownership
    if (!this.registry.canWrite(agentId, filepath)) {
      const owner = this.registry.getOwner(filepath);
      
      // Log violation
      await this.violations.log({
        agent: agentId,
        filepath,
        attempted: 'write',
        owner,
        timestamp: new Date()
      });
      
      return {
        allowed: false,
        reason: `Agent ${agentId} cannot write ${filepath}. Owner: ${owner}`
      };
    }
    
    // Allow write
    return { allowed: true };
  }
  
  // Intercept file delete
  async interceptDelete(
    agentId: string,
    filepath: string
  ): Promise<WriteResult> {
    if (!this.registry.canWrite(agentId, filepath)) {
      const owner = this.registry.getOwner(filepath);
      
      await this.violations.log({
        agent: agentId,
        filepath,
        attempted: 'delete',
        owner,
        timestamp: new Date()
      });
      
      return {
        allowed: false,
        reason: `Agent ${agentId} cannot delete ${filepath}. Owner: ${owner}`
      };
    }
    
    return { allowed: true };
  }
  
  // Intercept git commit
  async interceptCommit(
    agentId: string,
    files: string[]
  ): Promise<CommitResult> {
    const violations: string[] = [];
    
    for (const file of files) {
      if (!this.registry.canWrite(agentId, file)) {
        violations.push(file);
      }
    }
    
    if (violations.length > 0) {
      return {
        allowed: false,
        reason: `Agent ${agentId} cannot commit these files: ${violations.join(', ')}`
      };
    }
    
    return { allowed: true };
  }
}
```

#### 4. Violation Tracking

```typescript
// src/guard/violations.ts

interface Violation {
  id: string;
  agent: string;
  filepath: string;
  attempted: 'read' | 'write' | 'delete' | 'commit';
  owner: string;
  timestamp: Date;
  resolved: boolean;
}

export class ViolationLog {
  private db: Database;
  
  async log(violation: Omit<Violation, 'id' | 'resolved'>): Promise<string> {
    const id = generateId();
    
    await this.db.run(`
      INSERT INTO guard_violations (id, agent, filepath, attempted, owner, timestamp, resolved)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [id, violation.agent, violation.filepath, violation.attempted, 
        violation.owner, violation.timestamp]);
    
    // Notify orchestrator
    await this.notifyOrchestrator(violation);
    
    return id;
  }
  
  async getRecent(limit: number = 10): Promise<Violation[]> {
    return this.db.query<Violation>(`
      SELECT * FROM guard_violations
      ORDER BY timestamp DESC
      LIMIT ?
    `, [limit]);
  }
  
  async getUnresolved(): Promise<Violation[]> {
    return this.db.query<Violation>(`
      SELECT * FROM guard_violations
      WHERE resolved = 0
      ORDER BY timestamp DESC
    `);
  }
  
  async resolve(violationId: string): Promise<void> {
    await this.db.run(`
      UPDATE guard_violations
      SET resolved = 1
      WHERE id = ?
    `, [violationId]);
  }
}
```

#### 5. Guard CLI

```bash
# Check who owns a file
speclang guard owner src/auth/index.ts
# > code-gen

# Check if agent can write
speclang guard check --agent spec-writer --file specs/auth.spec.md
# > ALLOWED: spec-writer owns specs/**/*.spec.md

# List all files owned by agent
speclang guard list --agent code-gen
# > src/db/index.ts
# > src/parser/header.ts
# > ...

# View recent violations
speclang guard violations
# > 3 violations in last 24 hours

# Transfer ownership
speclang guard transfer --from spec-writer --to code-gen --file specs/auth.ts.spec
# > Ownership transferred
```

## Test Cases
1. Correct owner detected for each file type
2. Write blocked for non-owner
3. Write allowed for owner
4. Orchestrator can write anything
5. Violations logged correctly
6. Transfer ownership works
7. Custom rules override defaults
8. Priority ordering works

## Validation
```bash
bun test tests/guard.test.ts
speclang guard check --agent test-writer --file src/auth.ts
# Should be BLOCKED
speclang guard check --agent code-gen --file src/auth.ts
# Should be ALLOWED
```

## Output Format
After completing, output:
1. Default ownership rules
2. Violation tracking implementation
3. Test results
