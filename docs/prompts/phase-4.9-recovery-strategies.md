# Bootstrap Phase 4.9: Recovery Strategies

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.9 of the bootstrap process.

**Prerequisites**: 
- Phase 4.3 (Recovery System) complete
- Phase 4.7 (Recovery Actions) complete

## Your Task
Implement recovery strategies - the intelligent decision-making layer that determines how to recover from failures based on context, history, and configuration.

## Read These Specs First
1. `specs/recovery.spec.md` - Recovery specification
2. `docs/prompts/phase-4.3-recovery.md` - Recovery system
3. `docs/prompts/phase-4.7-recovery-actions.md` - Recovery actions

## What to Build

### Files to Create
```
src/recovery/
├── strategies/
│   ├── index.ts          # Strategy exports
│   ├── context.ts        # Context gathering
│   ├── decision.ts       # Decision engine
│   ├── scoring.ts        # Strategy scoring
│   └── adaptive.ts       # Adaptive strategies
├── intelligence/
│   ├── history.ts        # Failure history
│   ├── patterns.ts       # Pattern recognition
│   └── prediction.ts     # Failure prediction
└── config/
    └── strategy.yaml     # Strategy configuration
```

### Requirements

#### 1. Strategy Context (context.ts)
```typescript
interface RecoveryContext {
  // What failed
  failure: {
    type: FailureType;
    message: string;
    stackTrace?: string;
    file?: string;
    line?: number;
    timestamp: Date;
  };
  
  // Where it failed
  environment: {
    cascade: string;
    stage: string;
    agent?: string;
    session: string;
  };
  
  // Historical context
  history: {
    recentFailures: Failure[];
    totalAttempts: number;
    lastSuccess?: Date;
    cascadeDepth: number;
  };
  
  // Current state
  state: {
    specsModified: string[];
    codeGenerated: string[];
    testsRun: boolean;
    buildAttempts: number;
  };
  
  // Configuration
  config: {
    maxRetries: number;
    autoRollback: boolean;
    aggressiveRecovery: boolean;
    projectLevel: ProjectLevel;
  };
}

async function gatherContext(failure: Failure): Promise<RecoveryContext> {
  const historyFailureHistory(f = await loadailure.type);
  const state = await loadCurrentState();
  const config = await loadConfig();
  
  return {
    failure,
    environment: {
      cascade: getCurrentCascade(),
      stage: getCurrentStage(),
      agent: failure.agent,
      session: getSessionId()
    },
    history: {
      recentFailures: history,
      totalAttempts: getAttemptCount(),
      lastSuccess: await getLastSuccessTime(),
      cascadeDepth: getCascadeDepth()
    },
    state,
    config
  };
}
```

#### 2. Decision Engine (decision.ts)
```typescript
type RecoveryStrategy = 
  | 'retry_immediate'
  | 'retry_with_backoff'
  | 'retry_with_jitter'
  | 'rollback_full'
  | 'rollback_incremental'
  | 'self_heal_regenerate'
  | 'self_heal_fix_refs'
  | 'self_heal_fix_imports'
  | 'skip_and_continue'
  | 'abort_and_notify'
  | 'escalate_to_human';

interface Decision {
  strategy: RecoveryStrategy;
  confidence: number;      // 0-1
  estimatedCost: number;  // ms
  risk: 'low' | 'medium' | 'high';
  reasoning: string[];
  actions: RecoveryAction[];
}

class DecisionEngine {
  private strategies: Map<FailureType, RecoveryStrategy[]>;
  
  decide(context: RecoveryContext): Decision {
    // Get candidate strategies for this failure type
    const candidates = this.getCandidates(context);
    
    // Score each strategy
    const scored = candidates.map(s => ({
      strategy: s,
      score: this.scoreStrategy(s, context)
    }));
    
    // Select best strategy
    scored.sort((a, b) => b.score.total - a.score.total);
    const best = scored[0];
    
    return this.buildDecision(best, context);
  }
  
  private getCandidates(context: RecoveryContext): RecoveryStrategy[] {
    const base = this.strategies.get(context.failure.type) || [];
    
    // Filter by configuration
    let candidates = base;
    
    if (!context.config.autoRollback) {
      candidates = candidates.filter(s => !s.startsWith('rollback'));
    }
    
    if (context.config.aggressiveRecovery) {
      // Add more aggressive options
      candidates = [...candidates, 'self_heal_regenerate', 'self_heal_fix_refs'];
    }
    
    // Check attempt count
    if (context.history.totalAttempts >= context.config.maxRetries) {
      candidates = candidates.filter(s => !s.startsWith('retry'));
    }
    
    return candidates;
  }
  
  private scoreStrategy(
    strategy: RecoveryStrategy, 
    context: RecoveryContext
  ): { total: number; factors: ScoreFactor[] } {
    const factors: ScoreFactor[] = [];
    
    // Historical success rate for this strategy + failure type
    const successRate = await this.getHistoricalSuccess(strategy, context.failure.type);
    factors.push({
      name: 'historical_success',
      weight: 0.4,
      value: successRate
    });
    
    // Time since last failure of this type
    const timeSince = this.getTimeSinceLastFailure(context.failure.type);
    const timeFactor = Math.min(timeSince / 3600000, 1); // Normalize to 1 hour
    factors.push({
      name: 'time_decay',
      weight: 0.2,
      value: timeFactor
    });
    
    // Risk assessment
    const riskScore = this.assessRisk(strategy, context);
    factors.push({
      name: 'risk',
      weight: 0.3,
      value: 1 - riskScore // Lower risk = higher score
    });
    
    // Cost (prefer faster recovery)
    const cost = this.estimateCost(strategy);
    const costScore = Math.max(0, 1 - cost / 60000); // Normalize to 1 minute
    factors.push({
      name: 'cost',
      weight: 0.1,
      value: costScore
    });
    
    const total = factors.reduce((sum, f) => sum + f.weight * f.value, 0);
    return { total, factors };
  }
  
  private buildDecision(
    scored: { strategy: RecoveryStrategy; score: ScoreFactor[] },
    context: RecoveryContext
  ): Decision {
    return {
      strategy: scored.strategy,
      confidence: scored.score.total,
      estimatedCost: this.estimateCost(scored.strategy),
      risk: this.determineRiskLevel(scored.strategy, context),
      reasoning: this.explainDecision(scored.strategy, context),
      actions: this.getActions(scored.strategy)
    };
  }
}
```

#### 3. Strategy Scoring (scoring.ts)
```typescript
interface ScoreFactor {
  name: string;
  weight: number;
  value: number;
}

interface StrategyMetrics {
  strategy: RecoveryStrategy;
  failureType: FailureType;
  attempts: number;
  successes: number;
  avgDuration: number;
  lastUsed: Date;
}

class StrategyScorer {
  private metrics: Map<string, StrategyMetrics[]> = new Map();
  
  async recordAttempt(
    strategy: RecoveryStrategy,
    failureType: FailureType,
    success: boolean,
    duration: number
  ): Promise<void> {
    const key = `${strategy}:${failureType}`;
    const metrics = this.metrics.get(key) || [];
    
    const existing = metrics[metrics.length - 1];
    if (existing) {
      existing.attempts++;
      if (success) existing.successes++;
      existing.avgDuration = (existing.avgDuration + duration) / 2;
      existing.lastUsed = new Date();
    } else {
      metrics.push({
        strategy,
        failureType,
        attempts: 1,
        successes: success ? 1 : 0,
        avgDuration: duration,
        lastUsed: new Date()
      });
    }
    
    this.metrics.set(key, metrics);
    await this.persistMetrics();
  }
  
  async getSuccessRate(
    strategy: RecoveryStrategy,
    failureType: FailureType
  ): Promise<number> {
    const key = `${strategy}:${failureType}`;
    const metrics = this.metrics.get(key);
    
    if (!metrics || metrics.length === 0) {
      return 0.5; // Default neutral rate
    }
    
    const recent = metrics.slice(-10); // Last 10 attempts
    const total = recent.reduce((sum, m) => sum + m.attempts, 0);
    const successes = recent.reduce((sum, m) => sum + m.successes, 0);
    
    return total > 0 ? successes / total : 0.5;
  }
  
  getRecommendedStrategy(
    failureType: FailureType,
    available: RecoveryStrategy[]
  ): RecoveryStrategy {
    const rates = available.map(s => ({
      strategy: s,
      rate: this.getSuccessRateSync(s, failureType)
    }));
    
    rates.sort((a, b) => b.rate - a.rate);
    return rates[0].strategy;
  }
  
  private getSuccessRateSync(
    strategy: RecoveryStrategy,
    failureType: FailureType
  ): number {
    const key = `${strategy}:${failureType}`;
    const metrics = this.metrics.get(key);
    
    if (!metrics || metrics.length === 0) return 0.5;
    
    const recent = metrics.slice(-10);
    const total = recent.reduce((sum, m) => sum + m.attempts, 0);
    const successes = recent.reduce((sum, m) => sum + m.successes, 0);
    
    return total > 0 ? successes / total : 0.5;
  }
}
```

#### 4. Adaptive Strategies (adaptive.ts)
```typescript
class AdaptiveRecovery {
  private learning: StrategyLearning;
  private thresholds: RecoveryThresholds;
  
  async adapt(
    context: RecoveryContext,
    previousStrategy: RecoveryStrategy,
    success: boolean
  ): Promise<void> {
    // Update learning model
    await this.learning.record(previousStrategy, context.failure.type, success);
    
    // Adjust thresholds if needed
    if (!success) {
      await this.adjustThresholds(context);
    }
  }
  
  private async adjustThresholds(context: RecoveryContext): Promise<void> {
    const recentFailures = context.history.recentFailures;
    const failureRate = recentFailures.length / 60; // Last minute
    
    if (failureRate > 0.5) {
      // High failure rate - be more conservative
      this.thresholds.retryLimit = Math.max(1, this.thresholds.retryLimit - 1);
      this.thresholds.rollbackThreshold = Math.max(1, this.thresholds.rollbackThreshold - 1);
      console.log('[adaptive] Adjusted: More conservative recovery');
    } else if (failureRate < 0.1) {
      // Low failure rate - can be more aggressive
      this.thresholds.retryLimit = Math.min(5, this.thresholds.retryLimit + 1);
      this.thresholds.rollbackThreshold = Math.min(3, this.thresholds.rollbackThreshold + 1);
      console.log('[adaptive] Adjusted: More aggressive recovery');
    }
  }
  
  // Machine learning-inspired approach
  async predictBestStrategy(
    failure: Failure,
    context: RecoveryContext
  ): Promise<RecoveryStrategy> {
    // Features for prediction
    const features = {
      failureType: failure.type,
      cascadeDepth: context.history.cascadeDepth,
      attemptCount: context.history.totalAttempts,
      timeSinceLastFailure: this.getTimeSince(failure),
      projectLevel: context.config.projectLevel,
      specsModified: context.state.specsModified.length,
      testsRun: context.state.testsRun
    };
    
    // Simple rule-based prediction (could be replaced with ML)
    if (features.attemptCount >= 3) {
      return 'rollback_full';
    }
    
    if (features.cascadeDepth > 5) {
      return 'abort_and_notify';
    }
    
    if (failure.type === 'agent_timeout') {
      return 'retry_with_backoff';
    }
    
    if (failure.type === 'ref_broken') {
      return 'self_heal_fix_refs';
    }
    
    if (failure.type === 'build_fail') {
      return 'rollback_full';
    }
    
    return 'retry_immediate';
  }
}
```

#### 5. Pattern Recognition (patterns.ts)
```typescript
interface FailurePattern {
  signature: string;
  frequency: number;
  typicalStrategy: RecoveryStrategy;
  successRate: number;
  firstSeen: Date;
  lastSeen: Date;
}

class PatternRecognizer {
  private patterns: Map<string, FailurePattern> = new Map();
  
  async recognize(failure: Failure): Promise<FailurePattern | null> {
    const signature = this.generateSignature(failure);
    
    // Exact match
    if (this.patterns.has(signature)) {
      const pattern = this.patterns.get(signature)!;
      pattern.lastSeen = new Date();
      pattern.frequency++;
      return pattern;
    }
    
    // Fuzzy match
    const similar = this.findSimilar(signature);
    if (similar) {
      return similar;
    }
    
    return null;
  }
  
  private generateSignature(failure: Failure): string {
    // Create a signature based on failure characteristics
    const parts = [
      failure.type,
      failure.stage,
      failure.message.split(' ').slice(0, 3).join(' '), // First 3 words
      failure.file ? path.basename(failure.file) : 'none'
    ];
    
    return parts.join('|');
  }
  
  private findSimilar(signature: string): FailurePattern | null {
    // Simple similarity: check if pattern matches except for specific values
    const baseType = signature.split('|')[0];
    
    for (const [sig, pattern] of this.patterns) {
      if (sig.startsWith(baseType) && pattern.frequency >= 3) {
        return pattern;
      }
    }
    
    return null;
  }
  
  async learn(
    failure: Failure,
    strategy: RecoveryStrategy,
    success: boolean
  ): Promise<void> {
    const signature = this.generateSignature(failure);
    
    if (this.patterns.has(signature)) {
      const pattern = this.patterns.get(signature)!;
      pattern.frequency++;
      
      if (success && pattern.typicalStrategy !== strategy) {
        // Update to more successful strategy
        pattern.typicalStrategy = strategy;
        pattern.successRate = (pattern.successRate + 1) / pattern.frequency;
      }
    } else {
      this.patterns.set(signature, {
        signature,
        frequency: 1,
        typicalStrategy: strategy,
        successRate: success ? 1 : 0,
        firstSeen: new Date(),
        lastSeen: new Date()
      });
    }
  }
}
```

#### 6. Configuration (strategy.yaml)
```yaml
# Recovery Strategy Configuration

# Global thresholds
thresholds:
  retry_limit: 3
  rollback_threshold: 2
  escalation_threshold: 5
  cascade_depth_limit: 10

# Strategy selection by failure type
strategies:
  build_fail:
    - rollback_full
    - abort_and_notify
    fallback: rollback_full
    
  test_fail:
    - rollback_full
    - self_heal_regenerate
    fallback: rollback_full
    
  agent_timeout:
    - retry_with_backoff
    - retry_with_jitter
    fallback: retry_with_backoff
    
  lock_conflict:
    - retry_with_jitter
    - skip_and_continue
    fallback: retry_with_jitter
    
  spec_invalid:
    - abort_and_notify
    fallback: abort_and_notify
    
  ref_broken:
    - self_heal_fix_refs
    - rollback_full
    fallback: self_heal_fix_refs
    
  cascade_depth_exceeded:
    - abort_and_notify
    fallback: abort_and_notify

# Adaptive learning
adaptive:
  enabled: true
  min_samples: 5
  decay_factor: 0.9
  exploration_rate: 0.1

# Risk settings
risk:
  allow_self_heal: true
  allow_aggressive: false
  max_rollback_depth: 3
  require_human_after_failures: 5
```

### Strategy Decision Flow
```
Failure Occurs
      │
      ▼
Gather Context
      │
      ▼
Recognize Patterns?
      │     │
     Yes    No
      │     │
      ▼     ▼
Use Known    Check History
Strategy        │
      │         ▼
      │    Predict Best
      │         │
      ▼         ▼
Score Strategies
      │
      ▼
Select Best
      │
      ▼
Apply Strategy
      │
      ▼
Record Outcome
      │
      ▼
Adapt Thresholds
```

### Test Cases
1. Context gathering works correctly
2. Decision engine selects appropriate strategy
3. Strategy scoring weights work correctly
4. Pattern recognition identifies recurring failures
5. Adaptive strategies adjust thresholds
6. Historical success rates are tracked
7. Fallback strategies work when primary fails
8. Risk assessment prevents dangerous recovery
9. Confidence scores are calculated correctly
10. Strategy learning improves over time

## Validation
```bash
# Test decision engine
bun test tests/recovery/decision.test.ts

# Test adaptive strategies
bun test tests/recovery/adaptive.test.ts

# Run integration test
speclang recover --strategy=auto
```

## Output Format
After completing, output:
1. Decision engine implemented
2. Strategy scoring working
3. Pattern recognition active
4. Adaptive learning verified
5. Test results
