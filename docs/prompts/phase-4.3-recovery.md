# Bootstrap Phase 4.3: Recovery System

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.3 of the bootstrap process.

**Prerequisites**: 
- Phase 0-4.2 complete
- Pipeline executor working
- Error handling needed

## Your Task
Implement the recovery system that handles failures gracefully. When the pipeline fails or an agent errors, the system should rollback spec changes, notify the user, and attempt self-healing.

## Read These Specs First
1. `specs/recovery.spec.md` - Recovery specification
2. `specs/pipeline.spec.md` - Pipeline integration
3. `specs/cascade-protocol.spec.md` - Cascade error handling

## What to Build

### Files to Create
```
src/recovery/
├── index.ts              # Main exports
├── manager.ts            # RecoveryManager class
├── strategies.ts         # Self-healing strategies
├── rollback.ts           # Rollback mechanisms
├── notification.ts       # User notification
├── escalation.ts         # Escalation handling
├── logging.ts            # Error logging
└── types.ts              # TypeScript types

.speclang/
├── errors/               # Error logs directory
└── notifications/        # Notifications directory

scripts/
└── recover.sh            # Recovery CLI script
```

### Requirements

#### 1. Failure Types

```typescript
// src/recovery/types.ts

type FailureType = 
  | 'build_fail'
  | 'test_fail'
  | 'agent_timeout'
  | 'lock_conflict'
  | 'spec_invalid'
  | 'ref_broken'
  | 'cascade_depth_exceeded';

interface Failure {
  type: FailureType;
  cause: string;
  stage: string;
  timestamp: string;
  file?: string;
  line?: number;
  message: string;
  stackTrace?: string;
}

interface RecoveryStrategy {
  type: 'retry' | 'rollback' | 'skip' | 'abort' | 'self_heal';
  maxAttempts?: number;
  backoff?: 'linear' | 'exponential';
  specPath?: string;
  healingAction?: HealingAction;
}

type HealingAction = 
  | 'regenerate'
  | 're_expand'
  | 'fix_imports'
  | 'fix_refs';

const FAILURE_RECOVERY_MAP: Record<FailureType, RecoveryStrategy> = {
  build_fail: { type: 'rollback', specPath: 'auto' },
  test_fail: { type: 'rollback', specPath: 'auto' },
  agent_timeout: { type: 'retry', maxAttempts: 3, backoff: 'exponential' },
  lock_conflict: { type: 'retry', maxAttempts: 3, backoff: 'linear' },
  spec_invalid: { type: 'abort' },
  ref_broken: { type: 'self_heal', healingAction: 'fix_refs' },
  cascade_depth_exceeded: { type: 'abort' }
};
```

#### 2. Recovery Manager

```typescript
// src/recovery/manager.ts

export class RecoveryManager {
  private config: RecoveryConfig;
  private errorLog: ErrorLogger;
  private notifier: Notifier;
  
  constructor(config?: Partial<RecoveryConfig>) {
    this.config = {
      maxAttempts: 3,
      backoff: 'exponential',
      notifyOnFail: true,
      autoRollback: true,
      logRetention: '30d',
      ...config
    };
    this.errorLog = new ErrorLogger();
    this.notifier = new Notifier();
  }
  
  async handle(failure: Failure): Promise<RecoveryResult> {
    console.log(`[recovery] Handling failure: ${failure.type}`);
    
    // 1. Log the failure
    await this.errorLog.log(failure);
    
    // 2. Determine recovery strategy
    const strategy = this.determineStrategy(failure);
    
    // 3. Execute recovery
    const result = await this.executeStrategy(strategy, failure);
    
    // 4. Notify if configured
    if (result.status !== 'recovered' && this.config.notifyOnFail) {
      await this.notifier.notify(failure, result);
    }
    
    return result;
  }
  
  private determineStrategy(failure: Failure): RecoveryStrategy {
    // Check for custom strategy per agent
    if (failure.agent && this.config.perAgent?.[failure.agent]) {
      return this.config.perAgent[failure.agent];
    }
    
    // Default mapping
    return FAILURE_RECOVERY_MAP[failure.type];
  }
  
  private async executeStrategy(
    strategy: RecoveryStrategy, 
    failure: Failure
  ): Promise<RecoveryResult> {
    switch (strategy.type) {
      case 'retry':
        return this.retryWithBackoff(failure, strategy);
      case 'rollback':
        return this.rollback(failure, strategy);
      case 'self_heal':
        return this.selfHeal(failure, strategy);
      case 'skip':
        return this.markAsKnown(failure);
      case 'abort':
        return this.abort(failure);
    }
  }
  
  private async retryWithBackoff(
    failure: Failure,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const maxAttempts = strategy.maxAttempts || 3;
    let delay = 1000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[recovery] Retry attempt ${attempt}/${maxAttempts}`);
      await this.sleep(delay);
      
      try {
        await this.retryOperation(failure);
        return { status: 'recovered', action: 'retry', attempts: attempt };
      } catch (error) {
        delay = strategy.backoff === 'exponential' ? delay * 2 : delay;
        await this.errorLog.logRetry(failure, attempt, error);
      }
    }
    
    // Retries exhausted, escalate to rollback
    return this.rollback(failure, { type: 'rollback', specPath: 'auto' });
  }
}
```

#### 3. Rollback Mechanism

```typescript
// src/recovery/rollback.ts

export class RollbackManager {
  
  async rollbackSpec(specPath: string): Promise<RollbackResult> {
    console.log(`[rollback] Rolling back: ${specPath}`);
    
    // 1. Find last good commit for this spec
    const lastGood = await this.findLastGoodCommit(specPath);
    if (!lastGood) {
      return { success: false, error: 'No good commit found' };
    }
    
    // 2. Create backup of current state
    const backupPath = await this.createBackup(specPath);
    
    // 3. Revert spec file
    await exec(`git checkout ${lastGood} -- ${specPath}`);
    
    // 4. Revert generated code
    const generatedPath = this.getGeneratedPath(specPath);
    if (await exists(generatedPath)) {
      await exec(`git checkout ${lastGood} -- ${generatedPath}`);
    }
    
    // 5. Revert tests if they were generated
    const testPath = this.getTestPath(specPath);
    if (await exists(testPath)) {
      await exec(`git checkout ${lastGood} -- ${testPath}`);
    }
    
    // 6. Log rollback
    await this.logRollback(specPath, lastGood, backupPath);
    
    return {
      success: true,
      revertedTo: lastGood,
      filesReverted: [specPath, generatedPath, testPath].filter(Boolean),
      backupPath
    };
  }
  
  private async findLastGoodCommit(specPath: string): Promise<string | null> {
    // Get commits for this file
    const log = await exec(`git log --oneline -20 -- ${specPath}`);
    const commits = log.split('\n').filter(Boolean);
    
    for (const commit of commits) {
      const [hash, ...messageParts] = commit.split(' ');
      const message = messageParts.join(' ');
      
      // Skip commits that are clearly failed
      if (message.includes('FAILED') || message.includes('WIP')) {
        continue;
      }
      
      // Check if tests passed at this commit
      const testResult = await this.checkTestsAtCommit(hash, specPath);
      if (testResult.passed) {
        return hash;
      }
    }
    
    // Default to HEAD~1 if no good commit found
    return await exec('git rev-parse HEAD~1');
  }
  
  private async createBackup(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = '.speclang/backups';
    const backupPath = `${backupDir}/${path.basename(filePath)}.${timestamp}`;
    
    await fs.mkdir(backupDir, { recursive: true });
    await fs.copyFile(filePath, backupPath);
    
    return backupPath;
  }
  
  async rollbackCascade(cascadeId: string): Promise<void> {
    // Find all files modified in this cascade
    const state = await this.loadCascadeState(cascadeId);
    
    for (const invocation of state.agents_invoked) {
      for (const file of invocation.files_modified) {
        await this.rollbackSpec(file);
      }
    }
    
    // Mark cascade as rolled back
    state.status = 'rolled_back';
    await this.saveCascadeState(state);
  }
}
```

#### 4. Self-Healing Strategies

```typescript
// src/recovery/strategies.ts

export class SelfHealingStrategies {
  
  async heal(failure: Failure, action: HealingAction): Promise<HealingResult> {
    console.log(`[healing] Attempting: ${action}`);
    
    switch (action) {
      case 'regenerate':
        return this.regenerateCode(failure);
      case 're_expand':
        return this.reExpandSpec(failure);
      case 'fix_imports':
        return this.fixImports(failure);
      case 'fix_refs':
        return this.fixReferences(failure);
    }
  }
  
  private async regenerateCode(failure: Failure): Promise<HealingResult> {
    // Delete corrupted generated file
    if (failure.file) {
      await fs.unlink(failure.file);
    }
    
    // Find source spec
    const specPath = await this.findSourceSpec(failure.file!);
    if (!specPath) {
      return { success: false, error: 'Source spec not found' };
    }
    
    // Regenerate from spec
    await exec(`speclang generate --spec ${specPath}`);
    
    return { success: true, action: 'regenerated' };
  }
  
  private async reExpandSpec(failure: Failure): Promise<HealingResult> {
    // Find parent spec
    const parentPath = await this.findParentSpec(failure.file!);
    if (!parentPath) {
      return { success: false, error: 'Parent spec not found' };
    }
    
    // Delete corrupted expanded spec
    await fs.unlink(failure.file!);
    
    // Re-expand from parent
    await exec(`speclang expand --spec ${parentPath}`);
    
    return { success: true, action: 're_expanded' };
  }
  
  private async fixImports(failure: Failure): Promise<HealingResult> {
    if (!failure.file) {
      return { success: false, error: 'No file specified' };
    }
    
    const content = await fs.readFile(failure.file, 'utf-8');
    const missing = await this.detectMissingImports(content);
    
    for (const imp of missing) {
      const resolved = await this.resolveImport(imp);
      if (resolved) {
        await this.addImport(failure.file, imp, resolved);
      }
    }
    
    return { success: true, action: 'fixed_imports', importsFixed: missing.length };
  }
  
  private async fixReferences(failure: Failure): Promise<HealingResult> {
    const index = await loadIndex();
    const brokenRefs: string[] = [];
    
    // Find broken references in spec
    const specPath = failure.file!;
    const content = await fs.readFile(specPath, 'utf-8');
    const refs = this.extractReferences(content);
    
    for (const ref of refs) {
      if (!this.refExists(ref, index)) {
        brokenRefs.push(ref);
        
        // Try to find correct reference
        const corrected = await this.findCorrectReference(ref, index);
        if (corrected) {
          await this.updateReference(specPath, ref, corrected);
        }
      }
    }
    
    return { 
      success: brokenRefs.length === 0, 
      action: 'fixed_refs',
      refsFixed: brokenRefs.length 
    };
  }
}
```

#### 5. Notification System

```typescript
// src/recovery/notification.ts

export class Notifier {
  private notificationDir = '.speclang/notifications';
  
  async notify(failure: Failure, result: RecoveryResult): Promise<void> {
    const notification: Notification = {
      id: `notify-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: this.getSeverity(failure),
      failure: {
        type: failure.type,
        stage: failure.stage,
        message: failure.message
      },
      recovery: {
        action: result.action,
        status: result.status
      },
      suggestion: this.getSuggestion(failure)
    };
    
    // Save notification
    await this.saveNotification(notification);
    
    // Write to north star if critical
    if (notification.severity === 'critical') {
      await this.appendToNorthStar(notification);
    }
    
    // Log to console
    console.error(`[notification] ${notification.severity}: ${failure.message}`);
  }
  
  private getSeverity(failure: Failure): 'warning' | 'error' | 'critical' {
    if (failure.type === 'spec_invalid') return 'critical';
    if (failure.type === 'cascade_depth_exceeded') return 'critical';
    if (failure.type === 'build_fail' || failure.type === 'test_fail') return 'error';
    return 'warning';
  }
  
  private getSuggestion(failure: Failure): string[] {
    const suggestions: Record<FailureType, string[]> = {
      build_fail: [
        'Check compilation errors',
        'Verify dependencies are installed',
        'Review generated code for issues'
      ],
      test_fail: [
        'Review test output for failures',
        'Check if spec requirements are met',
        'Verify test setup is correct'
      ],
      agent_timeout: [
        'Check agent is responding',
        'Verify network connectivity',
        'Consider increasing timeout'
      ],
      lock_conflict: [
        'Wait for other agents to finish',
        'Release locks manually if stuck'
      ],
      spec_invalid: [
        'Fix syntax errors in spec',
        'Run validation: speclang validate'
      ],
      ref_broken: [
        'Check if referenced spec exists',
        'Update reference to correct ID',
        'Run: python3 scripts/validate_refs.py'
      ],
      cascade_depth_exceeded: [
        'Review cascade for loops',
        'Manually fix root cause',
        'Increase max_depth if needed'
      ]
    };
    
    return suggestions[failure.type] || ['Review the error and fix manually'];
  }
  
  private async saveNotification(notification: Notification): Promise<void> {
    await fs.mkdir(this.notificationDir, { recursive: true });
    const filename = `${notification.id}.json`;
    await fs.writeFile(
      path.join(this.notificationDir, filename),
      JSON.stringify(notification, null, 2)
    );
  }
}
```

#### 6. Error Logging

```typescript
// src/recovery/logging.ts

export class ErrorLogger {
  private errorDir = '.speclang/errors';
  private retentionDays = 30;
  
  async log(failure: Failure): Promise<string> {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      session: process.env.SPECLANG_SESSION || 'unknown',
      agent: failure.agent,
      error: {
        type: failure.type,
        message: failure.message,
        file: failure.file,
        line: failure.line
      },
      stackTrace: failure.stackTrace,
      recovery: null
    };
    
    const filename = `${logEntry.timestamp.replace(/[:.]/g, '-')}.json`;
    await fs.mkdir(this.errorDir, { recursive: true });
    await fs.writeFile(
      path.join(this.errorDir, filename),
      JSON.stringify(logEntry, null, 2)
    );
    
    // Clean old logs
    await this.cleanOldLogs();
    
    return filename;
  }
  
  async logRecovery(logId: string, result: RecoveryResult): Promise<void> {
    const logPath = path.join(this.errorDir, logId);
    const log = JSON.parse(await fs.readFile(logPath, 'utf-8'));
    log.recovery = {
      action: result.action,
      status: result.status,
      timestamp: new Date().toISOString()
    };
    await fs.writeFile(logPath, JSON.stringify(log, null, 2));
  }
  
  private async cleanOldLogs(): Promise<void> {
    const files = await fs.readdir(this.errorDir);
    const cutoff = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const stat = await fs.stat(path.join(this.errorDir, file));
      if (stat.mtimeMs < cutoff) {
        await fs.unlink(path.join(this.errorDir, file));
      }
    }
  }
}
```

#### 7. Escalation Handling

```typescript
// src/recovery/escalation.ts

export class EscalationManager {
  
  async checkEscalation(failures: Failure[]): Promise<EscalationLevel> {
    // Count recent failures
    const recentFailures = this.filterRecentFailures(failures, 3600000); // 1 hour
    
    // Check for escalation triggers
    if (recentFailures.length >= 3) {
      return this.escalate('level_3', recentFailures);
    }
    
    if (this.hasRepeatedError(recentFailures)) {
      return this.escalate('level_2', recentFailures);
    }
    
    if (recentFailures.length >= 1) {
      return this.escalate('level_1', recentFailures);
    }
    
    return 'none';
  }
  
  private async escalate(level: EscalationLevel, failures: Failure[]): Promise<EscalationLevel> {
    console.log(`[escalation] Escalating to ${level}`);
    
    switch (level) {
      case 'level_1':
        // Auto retry
        break;
      case 'level_2':
        // Auto rollback + notify
        await this.notifyAndRollback(failures);
        break;
      case 'level_3':
        // Pause cascade + notify
        await this.pauseCascadeAndNotify(failures);
        break;
      case 'level_4':
        // Require human approval
        await this.requireHumanApproval(failures);
        break;
    }
    
    return level;
  }
  
  private async requireHumanApproval(failures: Failure[]): Promise<void> {
    // Create escalation file
    const escalation = {
      timestamp: new Date().toISOString(),
      level: 'level_4',
      failures: failures.map(f => ({
        type: f.type,
        message: f.message,
        file: f.file
      })),
      actions: ['resume', 'abort', 'retry']
    };
    
    await fs.writeFile(
      '.speclang/ESCALATION',
      JSON.stringify(escalation, null, 2)
    );
    
    // Stop all agent activity
    await exec('speclang stop --all');
  }
}
```

### Configuration

```yaml
# build.yaml
recovery:
  max_attempts: 3
  backoff: exponential
  auto_rollback: true
  
  on_fail:
    - log: .speclang/errors/
    - rollback: last_spec_change
    - notify: northstar
    
  strategies:
    build_fail: rollback
    test_fail: rollback_and_notify
    agent_timeout: retry_with_backoff
    spec_invalid: notify_only
    
  per_agent:
    spec-writer:
      on_error: notify_only
    code-gen:
      on_error: rollback_and_retry
```

## Test Cases
1. Build failure triggers rollback
2. Test failure triggers rollback and notification
3. Agent timeout triggers retry with backoff
4. Lock conflict is resolved by serialization
5. Spec invalid triggers abort
6. Broken refs trigger self-healing
7. Notifications are created and saved
8. Error logs are written correctly
9. Escalation levels work correctly
10. Rollback restores good state

## Validation
```bash
# Test recovery
bun test tests/recovery.test.ts

# Test rollback
speclang rollback --last

# Check error logs
ls .speclang/errors/

# Check notifications
ls .speclang/notifications/

# Test escalation
speclang recover --escalate
```

## Output Format
After completing, output:
1. Recovery manager files created
2. Self-healing strategies implemented
3. Rollback mechanisms working
4. Notification system active
5. Test results
