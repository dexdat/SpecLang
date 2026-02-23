# Bootstrap Phase 4.7: Recovery Actions

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.7 of the bootstrap process.

**Prerequisite**: Phase 4.3 (Recovery) should be complete.

## Your Task
Implement recovery actions including retry strategies and rollback procedures for when operations fail.

## Read These Specs First
1. `specs/recovery.spec.dir/retry.spec.md` - Retry strategies
2. `specs/recovery.spec.dir/rollback.spec.md` - Rollback procedures

## What to Build

### Files to Create
```
src/recovery/
├── actions/
│   ├── index.ts        # Action exports
│   ├── retry.ts        # Retry strategies
│   ├── rollback.ts     # Rollback procedures
│   └── escalation.ts   # Escalation handling
├── strategies.ts       # Recovery strategies
└── state.ts            # Recovery state management

tests/
└── recovery/actions.test.ts
```

### Requirements

#### 1. Retry Strategies
```typescript
interface RetryStrategy {
  types: {
    immediate: 'retry right away';
    backoff: 'wait with exponential delay';
    scheduled: 'retry at specific time';
  };
  limits: {
    max_attempts: 3;
    backoff_base: '1s';
    backoff_max: '30s';
  };
}

// Retry with exponential backoff
async function retry<T>(
  operation: () => Promise<T>,
  strategy: RetryStrategy
): Promise<T>;

// Retry flow:
// 1st attempt: immediate
// 2nd attempt: wait 1s
// 3rd attempt: wait 2s
// 4th attempt: wait 4s (if under max)
// after max: give up, rollback
```

#### 2. Rollback Procedures
```typescript
interface Rollback {
  description: 'Revert to last known good state';
  
  what_gets_rolled_back: [
    'spec file changes',
    'generated code changes',
    'git commits (if made)',
  ];
  
  what_stays: [
    'north star file (user intent)',
    'logs and error reports',
  ];
  
  trigger: [
    'test failure',
    'build failure',
    'explicit user command',
  ];
}

async function rollback(options: RollbackOptions): Promise<RollbackResult>;
```

#### 3. Rollback Flow
```
Failure Detected
       │
       ▼
  Can Rollback?
    │     │
   Yes    No
    │     │
    ▼     ▼
Find      Notify User
Last         │
Good         ▼
Spec    Wait for Manual Fix
    │
    ▼
Revert Spec Files
    │
    ▼
Regenerate Code
    │
    ▼
Notify North Star
```

#### 4. Escalation Handling
```typescript
interface Escalation {
  when: [
    'max retries exceeded',
    'rollback failed',
    'critical error',
  ];
  
  actions: [
    'notify orchestrator',
    'create error report',
    'pause affected cascade',
    'request human intervention',
  ];
}

async function escalate(
  error: Error, 
  context: ErrorContext
): Promise<void>;
```

#### 5. Recovery State
```typescript
interface RecoveryState {
  operation_id: string;
  status: 'running' | 'retrying' | 'rolling_back' | 'escalated' | 'resolved';
  attempts: number;
  last_error?: Error;
  checkpoint?: Checkpoint;
}

// Save checkpoint before risky operations
function saveCheckpoint(operation: Operation): Checkpoint;

// Restore from checkpoint
function restoreCheckpoint(checkpoint: Checkpoint): Promise<void>;
```

### Recovery Actions Matrix
| Error Type | Retry | Rollback | Escalate |
|------------|-------|----------|----------|
| Transient  | Yes   | No       | After 3x |
| Validation | No    | Yes      | No       |
| Build      | No    | Yes      | No       |
| Test       | No    | Yes      | No       |
| Critical   | No    | Yes      | Yes      |
| Unknown    | No    | Yes      | Yes      |

## Test Cases
1. Immediate retry works
2. Exponential backoff calculates correctly
3. Max attempts respected
4. Rollback reverts spec files
5. Rollback regenerates code
6. Escalation triggers on max retries
7. Checkpoint save/restore works

## Validation
```bash
bun test tests/recovery/actions.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Retry strategy tests
3. Rollback procedure tests
4. Escalation flow verification
