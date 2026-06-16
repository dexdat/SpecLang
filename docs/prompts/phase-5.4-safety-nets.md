# Bootstrap Phase 5.4: Safety Nets

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 5.4 of the bootstrap process.

**Prerequisites**: Phase 5.1 (Self-Specifying), Phase 5.2 (Autonomous Test), Phase 5.3 (Transition Workflows) complete.

## Your Task
Implement safety nets that detect mislabeled specs and prevent cascade failures.

## Read These Specs First
1. `specs/safety-nets.spec.md` - Safety nets overview
2. `specs/safety-nets.spec.dir/analysis.spec.md` - Automated analysis
3. `specs/safety-nets.spec.dir/fallback.spec.md` - Fallback protocols

## Safety Net Components

1. **Automated Analysis** - Completeness scoring and mislabeling detection
2. **Confidence Scoring** - Track spec reliability
3. **Peer Review Hooks** - Human review for critical changes
4. **Fallback Protocols** - Automatic downgrade when confidence is low

## Implementation

### 1. Completeness Analyzer (`safety/completeness.ts`)

```typescript
export interface CompletenessScore {
  overall: number;
  stepByStepCoverage: number;
  referenceResolution: number;
  ambiguityScore: number;
  metadataCompleteness: number;
  dependencyCompleteness: number;
}

export class CompletenessAnalyzer {
  async analyze(spec: Spec): Promise<CompletenessScore> {
    const stepByStep = this.analyzeStepByStep(spec);
    const references = this.analyzeReferences(spec);
    const ambiguity = this.analyzeAmbiguity(spec);
    const metadata = this.analyzeMetadata(spec);
    const dependencies = this.analyzeDependencies(spec);
    
    const overall = this.calculateWeightedAverage([
      { score: stepByStep, weight: 0.3 },
      { score: references, weight: 0.25 },
      { score: 1 - ambiguity, weight: 0.2 },  // Lower ambiguity = better
      { score: metadata, weight: 0.15 },
      { score: dependencies, weight: 0.1 },
    ]);
    
    return {
      overall,
      stepByStepCoverage: stepByStep,
      referenceResolution: references,
      ambiguityScore: ambiguity,
      metadataCompleteness: metadata,
      dependencyCompleteness: dependencies,
    };
  }
  
  private analyzeStepByStep(spec: Spec): number {
    // Check for step-by-step descriptions in operations
    const operations = spec.getOperations();
    if (operations.length === 0) return 1.0;
    
    let covered = 0;
    for (const op of operations) {
      if (op.hasStepByStep() || op.hasPseudocode() || op.hasCode()) {
        covered++;
      }
    }
    
    return covered / operations.length;
  }
  
  private analyzeReferences(spec: Spec): number {
    const refs = spec.getReferences();
    if (refs.length === 0) return 1.0;
    
    let resolved = 0;
    for (const ref of refs) {
      if (this.resolveReference(ref)) {
        resolved++;
      }
    }
    
    return resolved / refs.length;
  }
  
  private analyzeAmbiguity(spec: Spec): number {
    const ambiguousPatterns = [
      /\bmaybe\b/gi,
      /\bpossibly\b/gi,
      /\bsome\b/gi,
      /\bappropriate\b/gi,
      /\betc\./gi,
      /\b(and so on|so on)\b/gi,
      /\bshould\b/gi,
      /\bcould\b/gi,
    ];
    
    const content = spec.getContent();
    let ambiguityCount = 0;
    
    for (const pattern of ambiguousPatterns) {
      const matches = content.match(pattern);
      if (matches) ambiguityCount += matches.length;
    }
    
    // Normalize to 0-1 range
    const words = content.split(/\s+/).length;
    return Math.min(1, ambiguityCount / (words / 100));
  }
  
  private analyzeMetadata(spec: Spec): number {
    const required = ['id', 'version', 'layer', 'project_level', 'agent_support', 'short'];
    let present = 0;
    
    for (const field of required) {
      if (spec.metadata[field]) present++;
    }
    
    return present / required.length;
  }
  
  private analyzeDependencies(spec: Spec): number {
    const deps = spec.getDependencies();
    if (deps.length === 0) return 1.0;
    
    let complete = 0;
    for (const dep of deps) {
      if (this.validateDependency(dep)) {
        complete++;
      }
    }
    
    return complete / deps.length;
  }
  
  private calculateWeightedAverage(items: { score: number; weight: number }[]): number {
    const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
    const weightedSum = items.reduce((sum, i) => sum + i.score * i.weight, 0);
    return weightedSum / totalWeight;
  }
}
```

### 2. Confidence Scoring (`safety/confidence.ts`)

```typescript
export interface ConfidenceScore {
  score: number;
  factors: {
    historicalReliability: number;
    authorReputation: number;
    similarityToGood: number;
    testCoverage: number;
    reviewStatus: number;
  };
}

export class ConfidenceScorer {
  private history: Map<string, SpecHistory>;
  private goodSpecs: SpecVector[];  // Vector embeddings of known good specs
  
  async score(spec: Spec): Promise<ConfidenceScore> {
    const historical = await this.getHistoricalReliability(spec);
    const author = await this.getAuthorReputation(spec);
    const similarity = await this.getSimilarityToGood(spec);
    const coverage = await this.getTestCoverage(spec);
    const review = this.getReviewStatus(spec);
    
    const factors = {
      historicalReliability: historical,
      authorReputation: author,
      similarityToGood: similarity,
      testCoverage: coverage,
      reviewStatus: review,
    };
    
    const score = this.calculateWeightedAverage([
      { score: historical, weight: 0.25 },
      { score: author, weight: 0.15 },
      { score: similarity, weight: 0.2 },
      { score: coverage, weight: 0.25 },
      { score: review, weight: 0.15 },
    ]);
    
    return { score, factors };
  }
  
  private async getHistoricalReliability(spec: Spec): Promise<number> {
    const history = this.history.get(spec.id);
    if (!history) return 0.5;  // Unknown = neutral
    
    const successRate = history.successCount / (history.successCount + history.failureCount);
    return successRate;
  }
  
  private async getSimilarityToGood(spec: Spec): Promise<number> {
    const embedding = await this.getEmbedding(spec);
    
    let maxSimilarity = 0;
    for (const good of this.goodSpecs) {
      const sim = this.cosineSimilarity(embedding, good.vector);
      maxSimilarity = Math.max(maxSimilarity, sim);
    }
    
    return maxSimilarity;
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  recordSuccess(specId: string): void {
    const history = this.history.get(specId) || { successCount: 0, failureCount: 0 };
    history.successCount++;
    this.history.set(specId, history);
  }
  
  recordFailure(specId: string): void {
    const history = this.history.get(specId) || { successCount: 0, failureCount: 0 };
    history.failureCount++;
    this.history.set(specId, history);
  }
}
```

### 3. Mislabeling Detector (`safety/mislabeling.ts`)

```typescript
export interface MislabelingResult {
  detected: boolean;
  reasons: string[];
  suggestedSupport: 'human_only' | 'agent_assisted' | 'agent_autonomous';
}

export class MislabelingDetector {
  async detect(spec: Spec, completeness: CompletenessScore): Promise<MislabelingResult> {
    const reasons: string[] = [];
    
    // Check 1: agent_autonomous without step-by-step
    if (spec.metadata.agent_support === 'agent_autonomous') {
      if (completeness.stepByStepCoverage < 0.8) {
        reasons.push('agent_autonomous spec lacks step-by-step coverage');
      }
      
      if (completeness.referenceResolution < 0.9) {
        reasons.push('agent_autonomous spec has unresolved references');
      }
      
      if (completeness.ambiguityScore > 0.3) {
        reasons.push('agent_autonomous spec contains ambiguous language');
      }
      
      if (spec.metadata.project_level === 'POC') {
        reasons.push('POC project should not use agent_autonomous');
      }
    }
    
    // Check 2: Mismatched maturity and autonomy
    const maturityLevel = this.getMaturityLevel(spec.metadata.project_level);
    const autonomyLevel = this.getAutonomyLevel(spec.metadata.agent_support);
    
    if (autonomyLevel > maturityLevel + 1) {
      reasons.push(`${spec.metadata.project_level} project with ${spec.metadata.agent_support} is inconsistent`);
    }
    
    return {
      detected: reasons.length > 0,
      reasons,
      suggestedSupport: this.suggestSupport(spec, completeness),
    };
  }
  
  private suggestSupport(spec: Spec, completeness: CompletenessScore): 'human_only' | 'agent_assisted' | 'agent_autonomous' {
    if (completeness.overall < 0.6) return 'human_only';
    if (completeness.overall < 0.8) return 'agent_assisted';
    return 'agent_autonomous';
  }
  
  private getMaturityLevel(level: string): number {
    const levels = { POC: 0, MVP: 1, Alpha: 2, Beta: 3, Production: 4 };
    return levels[level] || 0;
  }
  
  private getAutonomyLevel(support: string): number {
    const levels = { human_only: 0, agent_assisted: 1, agent_autonomous: 2 };
    return levels[support] || 0;
  }
}
```

### 4. Fallback Protocol (`safety/fallback.ts`)

```typescript
export class FallbackProtocol {
  private thresholds = {
    quarantine: 0.6,
    review: 0.7,
    warning: 0.8,
  };
  
  async evaluate(spec: Spec, score: ConfidenceScore): Promise<FallbackAction> {
    if (score.score < this.thresholds.quarantine) {
      return this.quarantine(spec, score);
    }
    
    if (score.score < this.thresholds.review) {
      return this.requestReview(spec, score);
    }
    
    if (score.score < this.thresholds.warning) {
      return this.warn(spec, score);
    }
    
    return { action: 'proceed', spec };
  }
  
  private async quarantine(spec: Spec, score: ConfidenceScore): Promise<FallbackAction> {
    // Downgrade agent support
    spec.metadata.agent_support = 'human_only';
    spec.metadata.tags = [...(spec.metadata.tags || []), 'quarantined'];
    
    // Create review ticket
    const ticket = await this.createReviewTicket(spec, score);
    
    // Notify stakeholders
    await this.notify({
      type: 'quarantine',
      spec: spec.id,
      score: score.score,
      ticket: ticket.id,
    });
    
    return {
      action: 'quarantine',
      spec,
      ticket,
      reason: `Confidence score ${score.score.toFixed(2)} below threshold ${this.thresholds.quarantine}`,
    };
  }
  
  private async requestReview(spec: Spec, score: ConfidenceScore): Promise<FallbackAction> {
    spec.metadata.tags = [...(spec.metadata.tags || []), 'needs_review'];
    
    const reviewers = await this.assignReviewers(spec);
    
    return {
      action: 'review',
      spec,
      reviewers,
      reason: `Confidence score ${score.score.toFixed(2)} requires human review`,
    };
  }
  
  private async warn(spec: Spec, score: ConfidenceScore): Promise<FallbackAction> {
    return {
      action: 'warn',
      spec,
      warning: `Spec ${spec.id} has low confidence (${score.score.toFixed(2)}). Monitor closely.`,
    };
  }
  
  private async assignReviewers(spec: Spec): Promise<string[]> {
    // Find reviewers based on tags and expertise
    const experts = await this.findExperts(spec.metadata.tags);
    return experts.slice(0, 2);  // Two reviewers
  }
}

type FallbackAction = {
  action: 'proceed' | 'warn' | 'review' | 'quarantine';
  spec: Spec;
  reason?: string;
  warning?: string;
  reviewers?: string[];
  ticket?: ReviewTicket;
};
```

### 5. Cascade Prevention (`safety/cascade-prevention.ts`)

```typescript
export class CascadePrevention {
  private cascadeBudget: Map<string, number> = new Map();
  private maxBudget = 10;
  
  canTriggerCascade(spec: Spec, score: ConfidenceScore): boolean {
    // Quarantined specs cannot trigger
    if (spec.metadata.tags?.includes('quarantined')) {
      return false;
    }
    
    // Check cascade budget
    const budget = this.cascadeBudget.get(spec.id) || this.maxBudget;
    if (budget <= 0) {
      return false;
    }
    
    // Low confidence reduces budget
    const effectiveBudget = Math.floor(budget * score.score);
    return effectiveBudget > 0;
  }
  
  consumeBudget(specId: string): void {
    const current = this.cascadeBudget.get(specId) || this.maxBudget;
    this.cascadeBudget.set(specId, current - 1);
  }
  
  restoreBudget(specId: string, amount?: number): void {
    const current = this.cascadeBudget.get(specId) || this.maxBudget;
    this.cascadeBudget.set(specId, Math.min(this.maxBudget, current + (amount || 1)));
  }
  
  recordSuccess(specId: string): void {
    // Success restores some budget
    this.restoreBudget(specId, 2);
  }
  
  recordFailure(specId: string): void {
    // Failure consumes extra budget
    const current = this.cascadeBudget.get(specId) || this.maxBudget;
    this.cascadeBudget.set(specId, current - 2);
  }
}
```

### 6. Monitoring Dashboard (`safety/monitoring.ts`)

```typescript
export class SafetyMonitor {
  private metrics: SafetyMetrics;
  
  record(spec: Spec, completeness: CompletenessScore, confidence: ConfidenceScore): void {
    this.metrics.totalAnalyzed++;
    
    if (completeness.overall < 0.6) {
      this.metrics.lowCompleteness++;
    }
    
    if (confidence.score < 0.7) {
      this.metrics.lowConfidence++;
    }
    
    if (spec.metadata.tags?.includes('quarantined')) {
      this.metrics.quarantined++;
    }
  }
  
  getMetrics(): SafetyMetrics {
    return this.metrics;
  }
  
  checkAlerts(): Alert[] {
    const alerts: Alert[] = [];
    
    // Alert on high quarantine rate
    const quarantineRate = this.metrics.quarantined / this.metrics.totalAnalyzed;
    if (quarantineRate > 0.1) {
      alerts.push({
        level: 'warning',
        message: `High quarantine rate: ${(quarantineRate * 100).toFixed(1)}%`,
      });
    }
    
    return alerts;
  }
}
```

## Configuration

```yaml
safety_nets:
  analysis:
    run_on: [pre_commit, pre_cascade, scheduled]
    
  scoring:
    weights:
      step_by_step: 0.3
      references: 0.25
      ambiguity: 0.2
      metadata: 0.15
      dependencies: 0.1
      
  thresholds:
    quarantine: 0.6
    review: 0.7
    warning: 0.8
    
  cascade_prevention:
    max_budget: 10
    restore_on_success: 2
    consume_on_failure: 2
    
  monitoring:
    alert_on_quarantine_rate: 0.1
    dashboard: true
```

## CLI Interface

```bash
# Analyze a spec
speclang safety analyze specs/auth.spec.scl

# Check confidence score
speclang safety confidence specs/auth.spec.scl

# Detect mislabeling
speclang safety detect-mislabeling specs/auth.spec.scl

# View quarantine list
speclang safety quarantine list

# Restore spec from quarantine
speclang safety quarantine restore specs/auth.spec.scl --approve

# View safety metrics
speclang safety metrics
```

## Test Cases
1. Completeness analysis returns correct scores
2. Confidence scoring uses historical data
3. Mislabeling detection identifies problems
4. Fallback quarantine works correctly
5. Fallback requests review when appropriate
6. Cascade prevention blocks low-confidence specs
7. Budget consumed and restored correctly
8. Monitoring tracks metrics
9. Alerts generated for anomalies
10. CLI commands work correctly

## Output
1. CompletenessAnalyzer implementation
2. ConfidenceScorer with history tracking
3. MislabelingDetector
4. FallbackProtocol with quarantine
5. CascadePrevention with budgets
6. SafetyMonitor for metrics
7. CLI commands for safety operations
