# Bootstrap Phase 5.8: Safety Detection Mechanisms

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 5.8 of the bootstrap process.

**Prerequisites**: Phase 5.4 (Safety Nets), Phase 5.6 (Confidence Scoring), Phase 5.7 (Fallback Protocols) complete.

## Your Task
Implement detection mechanisms that identify mislabeled specs, detect anomalies, and prevent cascade failures through real-time monitoring.

## Read These Specs First
1. `specs/safety-nets.spec.md` - Safety nets overview
2. `specs/safety-nets.spec.dir/analysis.spec.md` - Automated analysis
3. `specs/autonomous-validation.spec.md` - Validation requirements

## What to Build

### Files to Create
```
src/safety/
├── index.ts                      # Exports (update)
├── detection.ts                  # Mislabeling detector
├── anomaly.ts                    # Anomaly detection
├── monitor.ts                    # Real-time monitoring
└── alerts.ts                     # Alert system
```

### Mislabeling Detector

```typescript
// src/safety/detection.ts

export interface MislabelingResult {
  detected: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  issues: MislabelingIssue[];
  suggestions: string[];
  suggestedSupport: AgentSupportLevel;
  confidence: number; // How confident we are in the detection
}

export interface MislabelingIssue {
  type: string;
  description: string;
  location?: string;
  evidence: string;
}

export class MislabelingDetector {
  private completenessAnalyzer: CompletenessAnalyzer;
  private validationRules: ValidationRule[];
  
  constructor() {
    this.completenessAnalyzer = new CompletenessAnalyzer();
    this.validationRules = this.loadValidationRules();
  }

  async detect(spec: Spec): Promise<MislabelingResult> {
    const issues: MislabelingIssue[] = [];
    const suggestions: string[] = [];
    
    // Get completeness score
    const completeness = await this.completenessAnalyzer.analyze(spec);
    
    // Check each validation rule
    for (const rule of this.validationRules) {
      const result = await rule.check(spec, completeness);
      if (result.violated) {
        issues.push({
          type: rule.name,
          description: rule.description,
          location: result.location,
          evidence: result.evidence,
        });
        suggestions.push(...result.suggestions);
      }
    }
    
    // Check maturity/autonomy consistency
    const consistencyIssue = this.checkMaturityAutonomyConsistency(spec);
    if (consistencyIssue) {
      issues.push(consistencyIssue);
      suggestions.push('Adjust project_level or agent_support to be consistent');
    }
    
    // Determine severity and suggested support
    const { severity, suggestedSupport, confidence } = this.calculateResults(
      issues,
      completeness
    );
    
    return {
      detected: issues.length > 0,
      severity,
      issues,
      suggestions: [...new Set(suggestions)], // Dedupe
      suggestedSupport,
      confidence,
    };
  }

  private checkMaturityAutonomyConsistency(spec: Spec): MislabelingIssue | null {
    const maturity = spec.metadata.project_level;
    const support = spec.metadata.agent_support;
    
    // Define allowed combinations
    const allowedCombinations: Record<string, string[]> = {
      'POC': ['human_only'],
      'MVP': ['human_only', 'agent_assisted'],
      'Alpha': ['human_only', 'agent_assisted'],
      'Beta': ['human_only', 'agent_assisted', 'agent_autonomous'],
      'Production': ['agent_assisted', 'agent_autonomous'],
      'Startup': ['human_only', 'agent_assisted', 'agent_autonomous'],
      'SMB': ['agent_assisted', 'agent_autonomous'],
      'MSB': ['agent_autonomous'],
      'Enterprise': ['agent_autonomous'],
    };
    
    const allowed = allowedCombinations[maturity] || [];
    
    if (!allowed.includes(support)) {
      return {
        type: 'inconsistent_metadata',
        description: `project_level "${maturity}" with agent_support "${support}" is inconsistent`,
        evidence: `Allowed combinations for ${maturity}: ${allowed.join(', ')}`,
      };
    }
    
    return null;
  }

  private calculateResults(
    issues: MislabelingIssue[],
    completeness: CompletenessScore
  ): {
    severity: MislabelingResult['severity'];
    suggestedSupport: AgentSupportLevel;
    confidence: number;
  } {
    if (issues.length === 0) {
      return {
        severity: 'info',
        suggestedSupport: 'agent_autonomous',
        confidence: 1.0,
      };
    }
    
    // Count issue types
    const criticalCount = issues.filter(i => 
      ['no_step_by_step', 'unresolved_references', 'inconsistent_metadata'].includes(i.type)
    ).length;
    
    const errorCount = issues.filter(i =>
      ['high_ambiguity', 'missing_metadata', 'low_test_coverage'].includes(i.type)
    ).length;
    
    // Determine severity
    let severity: MislabelingResult['severity'] = 'info';
    if (criticalCount > 0) severity = 'critical';
    else if (errorCount > 0) severity = 'error';
    else if (issues.length >= 3) severity = 'warning';
    
    // Determine suggested support level
    let suggestedSupport: AgentSupportLevel = 'agent_autonomous';
    if (completeness.overall < 0.5 || criticalCount > 0) {
      suggestedSupport = 'human_only';
    } else if (completeness.overall < 0.75 || errorCount > 0) {
      suggestedSupport = 'agent_assisted';
    }
    
    // Confidence in detection
    const confidence = Math.max(0.5, 1 - (issues.length * 0.1));
    
    return { severity, suggestedSupport, confidence };
  }

  private loadValidationRules(): ValidationRule[] {
    return [
      {
        name: 'no_step_by_step',
        description: 'agent_autonomous spec lacks step-by-step descriptions',
        check: async (spec, completeness) => {
          if (spec.metadata.agent_support !== 'agent_autonomous') {
            return { violated: false };
          }
          
          const violated = completeness.stepByStepCoverage < 0.8;
          
          return {
            violated,
            location: 'operations',
            evidence: `Step-by-step coverage: ${(completeness.stepByStepCoverage * 100).toFixed(0)}%`,
            suggestions: violated ? [
              'Add step-by-step descriptions to all operations',
              'Include pseudocode for complex operations',
              'Provide reference implementations',
            ] : [],
          };
        },
      },
      {
        name: 'unresolved_references',
        description: 'Spec has unresolved @ref: references',
        check: async (spec, completeness) => {
          const violated = completeness.referenceResolution < 0.9;
          
          return {
            violated,
            location: 'references',
            evidence: `Reference resolution: ${(completeness.referenceResolution * 100).toFixed(0)}%`,
            suggestions: violated ? [
              'Verify all @ref: links point to existing specs or blocks',
              'Check for typos in reference IDs',
            ] : [],
          };
        },
      },
      {
        name: 'high_ambiguity',
        description: 'Spec contains ambiguous language',
        check: async (spec, completeness) => {
          const violated = completeness.ambiguityScore > 0.3;
          
          return {
            violated,
            location: 'content',
            evidence: `Ambiguity score: ${(completeness.ambiguityScore * 100).toFixed(0)}%`,
            suggestions: violated ? [
              'Replace vague words like "maybe", "possibly", "some" with specific terms',
              'Remove "etc." and "and so on"',
              'Replace "should" and "could" with "must" or "will"',
            ] : [],
          };
        },
      },
      {
        name: 'missing_metadata',
        description: 'Required metadata fields are missing',
        check: async (spec, completeness) => {
          const violated = completeness.metadataCompleteness < 1.0;
          
          return {
            violated,
            location: 'header',
            evidence: `Metadata completeness: ${(completeness.metadataCompleteness * 100).toFixed(0)}%`,
            suggestions: violated ? [
              'Add all required header fields: id, version, layer, project_level, agent_support, short',
            ] : [],
          };
        },
      },
      {
        name: 'low_test_coverage',
        description: 'Spec has low or no test coverage',
        check: async (spec, completeness) => {
          const violated = completeness.dependencyCompleteness < 0.5;
          
          return {
            violated,
            location: 'dependencies',
            evidence: `Dependency completeness: ${(completeness.dependencyCompleteness * 100).toFixed(0)}%`,
            suggestions: violated ? [
              'Add tests for all entities and operations',
              'Include edge cases in test coverage',
            ] : [],
          };
        },
      },
      {
        name: 'poc_with_autonomous',
        description: 'POC project should not use agent_autonomous',
        check: async (spec) => {
          const violated = 
            spec.metadata.project_level === 'POC' && 
            spec.metadata.agent_support === 'agent_autonomous';
          
          return {
            violated,
            location: 'header',
            evidence: `project_level: ${spec.metadata.project_level}, agent_support: ${spec.metadata.agent_support}`,
            suggestions: violated ? [
              'Use agent_support: human_only for POC projects',
              'Upgrade to MVP or higher before using agent_autonomous',
            ] : [],
          };
        },
      },
    ];
  }
}

interface ValidationRule {
  name: string;
  description: string;
  check: (spec: Spec, completeness: CompletenessScore) => Promise<{
    violated: boolean;
    location?: string;
    evidence: string;
    suggestions: string[];
  }>;
}
```

### Anomaly Detection

```typescript
// src/safety/anomaly.ts

export interface Anomaly {
  id: string;
  type: 'cascade_loop' | 'resource_spike' | 'error_rate' | 'performance_degradation' | 'ownership_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  specId?: string;
  details: Record<string, unknown>;
  metrics: {
    current: number;
    threshold: number;
    deviation: number;
  };
}

export interface AnomalyConfig {
  cascade: {
    maxDepth: number;
    maxDuration: number; // seconds
    maxFilesChanged: number;
  };
  resources: {
    cpuThreshold: number;      // percentage
    memoryThreshold: number;    // percentage
    diskThreshold: number;      // percentage
  };
  errors: {
    errorRateThreshold: number; // per minute
    consecutiveFailures: number;
  };
  performance: {
    responseTimeThreshold: number; // ms
    throughputThreshold: number;  // per second
  };
}

export class AnomalyDetector {
  private config: AnomalyConfig;
  private baseline: Map<string, number[]> = new Map();
  private windowSize = 60; // Keep last 60 data points
  
  constructor(config: Partial<AnomalyConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async detectCascadeAnomaly(state: CascadeState): Promise<Anomaly | null> {
    // Check depth
    if (state.depth > this.config.cascade.maxDepth) {
      return {
        id: this.generateId(),
        type: 'cascade_loop',
        severity: 'critical',
        detectedAt: new Date().toISOString(),
        specId: state.triggeredBy,
        details: { depth: state.depth, duration: state.duration },
        metrics: {
          current: state.depth,
          threshold: this.config.cascade.maxDepth,
          deviation: state.depth / this.config.cascade.maxDepth,
        },
      };
    }
    
    // Check duration
    if (state.duration > this.config.cascade.maxDuration) {
      return {
        id: this.generateId(),
        type: 'cascade_loop',
        severity: 'high',
        detectedAt: new Date().toISOString(),
        specId: state.triggeredBy,
        details: { depth: state.depth, duration: state.duration },
        metrics: {
          current: state.duration,
          threshold: this.config.cascade.maxDuration,
          deviation: state.duration / this.config.cascade.maxDuration,
        },
      };
    }
    
    // Check files changed
    if (state.filesChanged.length > this.config.cascade.maxFilesChanged) {
      return {
        id: this.generateId(),
        type: 'cascade_loop',
        severity: 'medium',
        detectedAt: new Date().toISOString(),
        specId: state.triggeredBy,
        details: { filesChanged: state.filesChanged.length },
        metrics: {
          current: state.filesChanged.length,
          threshold: this.config.cascade.maxFilesChanged,
          deviation: state.filesChanged.length / this.config.cascade.maxFilesChanged,
        },
      };
    }
    
    return null;
  }

  async detectResourceAnomaly(metrics: SystemMetrics): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    if (metrics.cpu > this.config.resources.cpuThreshold) {
      anomalies.push({
        id: this.generateId(),
        type: 'resource_spike',
        severity: this.getSeverity(metrics.cpu, this.config.resources.cpuThreshold),
        detectedAt: new Date().toISOString(),
        details: { metric: 'cpu', value: metrics.cpu },
        metrics: {
          current: metrics.cpu,
          threshold: this.config.resources.cpuThreshold,
          deviation: metrics.cpu / this.config.resources.cpuThreshold,
        },
      });
    }
    
    if (metrics.memory > this.config.resources.memoryThreshold) {
      anomalies.push({
        id: this.generateId(),
        type: 'resource_spike',
        severity: this.getSeverity(metrics.memory, this.config.resources.memoryThreshold),
        detectedAt: new Date().toISOString(),
        details: { metric: 'memory', value: metrics.memory },
        metrics: {
          current: metrics.memory,
          threshold: this.config.resources.memoryThreshold,
          deviation: metrics.memory / this.config.resources.memoryThreshold,
        },
      });
    }
    
    return anomalies;
  }

  async detectErrorAnomaly(errors: ErrorLog[]): Promise<Anomaly | null> {
    // Count errors in last minute
    const recentErrors = errors.filter(e => 
      Date.now() - new Date(e.timestamp).getTime() < 60000
    );
    
    const errorRate = recentErrors.length;
    
    if (errorRate > this.config.errors.errorRateThreshold) {
      return {
        id: this.generateId(),
        type: 'error_rate',
        severity: this.getSeverity(errorRate, this.config.errors.errorRateThreshold),
        detectedAt: new Date().toISOString(),
        details: { recentErrors: recentErrors.length, sample: recentErrors.slice(0, 3) },
        metrics: {
          current: errorRate,
          threshold: this.config.errors.errorRateThreshold,
          deviation: errorRate / this.config.errors.errorRateThreshold,
        },
      };
    }
    
    // Check consecutive failures
    const consecutiveFailures = this.countConsecutiveFailures(errors);
    if (consecutiveFailures >= this.config.errors.consecutiveFailures) {
      return {
        id: this.generateId(),
        type: 'error_rate',
        severity: 'high',
        detectedAt: new Date().toISOString(),
        details: { consecutiveFailures },
        metrics: {
          current: consecutiveFailures,
          threshold: this.config.errors.consecutiveFailures,
          deviation: consecutiveFailures / this.config.errors.consecutiveFailures,
        },
      };
    }
    
    return null;
  }

  async detectPerformanceAnomaly(
    specId: string,
    responseTime: number
  ): Promise<Anomaly | null> {
    // Get baseline for this spec
    const baseline = this.baseline.get(specId) || [];
    
    // Add to baseline
    baseline.push(responseTime);
    if (baseline.length > this.windowSize) baseline.shift();
    this.baseline.set(specId, baseline);
    
    // Need minimum data points
    if (baseline.length < 10) return null;
    
    // Calculate baseline stats
    const avg = baseline.reduce((a, b) => a + b, 0) / baseline.length;
    const stdDev = Math.sqrt(
      baseline.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / baseline.length
    );
    
    // Check if current is anomalous (beyond 2 std devs)
    if (responseTime > avg + 2 * stdDev && responseTime > this.config.performance.responseTimeThreshold) {
      return {
        id: this.generateId(),
        type: 'performance_degradation',
        severity: 'medium',
        detectedAt: new Date().toISOString(),
        specId,
        details: { responseTime, baselineAvg: avg, baselineStdDev: stdDev },
        metrics: {
          current: responseTime,
          threshold: this.config.performance.responseTimeThreshold,
          deviation: responseTime / this.config.performance.responseTimeThreshold,
        },
      };
    }
    
    return null;
  }

  detectOwnershipViolation(
    file: string,
    owner: string,
    modifier: string
  ): Anomaly | null {
    if (owner !== modifier && modifier !== 'speclang') {
      return {
        id: this.generateId(),
        type: 'ownership_violation',
        severity: 'high',
        detectedAt: new Date().toISOString(),
        details: { file, owner, modifier },
        metrics: {
          current: 1,
          threshold: 0,
          deviation: 1,
        },
      };
    }
    
    return null;
  }

  private getSeverity(current: number, threshold: number): Anomaly['severity'] {
    const ratio = current / threshold;
    if (ratio > 1.5) return 'critical';
    if (ratio > 1.2) return 'high';
    if (ratio > 1.0) return 'medium';
    return 'low';
  }

  private countConsecutiveFailures(errors: ErrorLog[]): number {
    let count = 0;
    for (let i = errors.length - 1; i >= 0; i--) {
      if (errors[i].type === 'failure') {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  private generateId(): string {
    return `ANM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

const defaultConfig: AnomalyConfig = {
  cascade: {
    maxDepth: 100,
    maxDuration: 300, // 5 minutes
    maxFilesChanged: 50,
  },
  resources: {
    cpuThreshold: 80,
    memoryThreshold: 85,
    diskThreshold: 90,
  },
  errors: {
    errorRateThreshold: 10, // 10 errors per minute
    consecutiveFailures: 5,
  },
  performance: {
    responseTimeThreshold: 1000,
    throughputThreshold: 10,
  },
};
```

### Real-Time Monitor

```typescript
// src/safety/monitor.ts

export interface SafetyMonitor {
  start(): void;
  stop(): void;
  recordSpecAnalyzed(specId: string, score: CompletenessScore): void;
  recordConfidenceScore(specId: string, score: ConfidenceScore): void;
  recordAnomaly(anomaly: Anomaly): void;
  recordFallback(action: FallbackAction): void;
  getMetrics(): SafetyMetrics;
  checkAlerts(): Alert[];
}

export interface SafetyMetrics {
  totalSpecsAnalyzed: number;
  specsByConfidence: {
    veryHigh: number;
    high: number;
    medium: number;
    low: number;
  };
  anomaliesByType: Record<string, number>;
  fallbackActions: {
    quarantine: number;
    review: number;
    downgrade: number;
    warn: number;
  };
  avgAnalysisTime: number;
}

export interface Alert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  source: string;
}

export class RealTimeMonitor implements SafetyMonitor {
  private metrics: SafetyMetrics;
  private anomalies: Anomaly[] = [];
  private fallbacks: FallbackAction[] = [];
  private analysisTimes: number[] = [];
  private running = false;
  private intervalId?: NodeJS.Timeout;
  
  constructor() {
    this.metrics = this.initMetrics();
  }

  start(): void {
    this.running = true;
    this.intervalId = setInterval(() => this.tick(), 60000); // Every minute
  }

  stop(): void {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  recordSpecAnalyzed(specId: string, score: CompletenessScore): void {
    this.metrics.totalSpecsAnalyzed++;
    
    if (score.overall >= 0.95) this.metrics.specsByConfidence.veryHigh++;
    else if (score.overall >= 0.8) this.metrics.specsByConfidence.high++;
    else if (score.overall >= 0.6) this.metrics.specsByConfidence.medium++;
    else this.metrics.specsByConfidence.low++;
  }

  recordConfidenceScore(specId: string, score: ConfidenceScore): void {
    // Record confidence score for this spec
  }

  recordAnomaly(anomaly: Anomaly): void {
    this.anomalies.push(anomaly);
    
    const type = anomaly.type;
    this.metrics.anomaliesByType[type] = (this.metrics.anomaliesByType[type] || 0) + 1;
  }

  recordFallback(action: FallbackAction): void {
    this.fallbacks.push(action);
    
    switch (action.type) {
      case 'quarantine':
        this.metrics.fallbackActions.quarantine++;
        break;
      case 'review':
        this.metrics.fallbackActions.review++;
        break;
      case 'downgrade':
        this.metrics.fallbackActions.downgrade++;
        break;
      case 'warn':
        this.metrics.fallbackActions.warn++;
        break;
    }
  }

  getMetrics(): SafetyMetrics {
    return { ...this.metrics };
  }

  checkAlerts(): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date().toISOString();
    
    // High quarantine rate
    const totalFallbacks = Object.values(this.metrics.fallbackActions).reduce((a, b) => a + b, 0);
    if (totalFallbacks > 0) {
      const quarantineRate = this.metrics.fallbackActions.quarantine / totalFallbacks;
      if (quarantineRate > 0.2) {
        alerts.push({
          level: 'critical',
          message: `High quarantine rate: ${(quarantineRate * 100).toFixed(1)}%`,
          timestamp: now,
          source: 'safety-monitor',
        });
      }
    }
    
    // High anomaly rate
    const totalAnomalies = Object.values(this.metrics.anomaliesByType).reduce((a, b) => a + b, 0);
    if (totalAnomalies > 10) {
      alerts.push({
        level: 'warning',
        message: `High anomaly count: ${totalAnomalies} in recent period`,
        timestamp: now,
        source: 'safety-monitor',
      });
    }
    
    // Low confidence specs
    if (this.metrics.specsByConfidence.low > this.metrics.totalSpecsAnalyzed * 0.3) {
      alerts.push({
        level: 'warning',
        message: `High percentage of low-confidence specs`,
        timestamp: now,
        source: 'safety-monitor',
      });
    }
    
    return alerts;
  }

  private tick(): void {
    // Periodic cleanup and checks
    const alerts = this.checkAlerts();
    if (alerts.length > 0) {
      console.log('[SAFETY ALERTS]', alerts);
    }
  }

  private initMetrics(): SafetyMetrics {
    return {
      totalSpecsAnalyzed: 0,
      specsByConfidence: {
        veryHigh: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      anomaliesByType: {},
      fallbackActions: {
        quarantine: 0,
        review: 0,
        downgrade: 0,
        warn: 0,
      },
      avgAnalysisTime: 0,
    };
  }
}
```

### CLI Interface

```bash
# Detect mislabeling
speclang safety detect specs/auth.spec.scl

# Detect mislabeling with verbose output
speclang safety detect specs/auth.spec.scl --verbose

# Run anomaly detection
speclang safety anomaly check --type cascade
speclang safety anomaly check --type resources
speclang safety anomaly check --type errors
speclang safety anomaly check --type performance

# View anomaly history
speclang safety anomaly history --limit 20
speclang safety anomaly history --type cascade_loop

# View safety metrics
speclang safety metrics

# View alerts
speclang safety alerts

# Monitor in real-time
speclang safety monitor start
speclang safety monitor stop
speclang safety monitor status
```

## Test Cases
1. Mislabeling detection identifies inconsistencies
2. Validation rules work correctly
3. Anomaly detection finds cascade loops
4. Resource spike detection works
5. Error rate detection triggers
6. Performance anomaly detection works
7. Ownership violation detection functions
8. Real-time monitoring tracks metrics
9. Alerts generated for anomalies
10. CLI commands work

## Validation
```bash
bun test tests/safety/detection.test.ts
```

## Output Format
After completing, output:
1. MislabelingDetector implementation
2. AnomalyDetector implementation
3. RealTimeMonitor implementation
4. CLI commands
5. Test results
