# Bootstrap Phase 0.39: Production Maturity Level

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.39 of the bootstrap process.

**Prerequisites**: 
- Phase 0.25 (Project Maturity Levels) complete
- Phase 0.38 (Beta Level) complete or in progress

## Your Task
Implement the Production maturity level - the highest stability tier for supported, production-ready specs with full autonomous agent capability.

## Read These Specs First
1. `specs/project-maturity-levels.spec.md` - Maturity overview
2. `specs/production-level.spec.md` - Production-specific criteria
3. `specs/validation-rules.spec.md` - Validation requirements

## What to Build

### Files to Create
```
src/maturity/production/
├── index.ts              # Production level exports
├── criteria.ts           # Production-specific criteria
├── requirements.ts       # Production requirements checker
├── slas.ts               # SLA definitions and tracking
├── support.ts            # Support tier configuration
├── degradation.ts        # Graceful degradation policies
└── behaviors.ts          # Production agent behaviors
```

### Requirements

#### 1. Production Criteria (criteria.ts)
```typescript
interface ProductionCriteria {
  featureFrozen: boolean;
  documentationComplete: boolean;
  testCoverage: number;        // Minimum 85%
  fullTestSuite: boolean;
  productionDeployment: boolean;
  stabilityScore: number;      // Minimum 0.95
  backwardCompatibility: boolean;
  securityAudited: boolean;
  supportTiers: SupportTier[];
}

interface SupportTier {
  name: string;
  responseTime: number;        // minutes
  escalationPath: string[];
  availability: number;        // percentage
}

const PRODUCTION_CRITERIA: ProductionCriteria = {
  featureFrozen: true,
  documentationComplete: true,
  testCoverage: 85,
  fullTestSuite: true,
  productionDeployment: true,
  stabilityScore: 0.95,
  backwardCompatibility: true,
  securityAudited: true,
  supportTiers: [
    { name: 'Critical', responseTime: 15, escalationPath: ['on-call', 'lead', 'architect'], availability: 99.99 },
    { name: 'High', responseTime: 60, escalationPath: ['support', 'lead'], availability: 99.9 },
    { name: 'Medium', responseTime: 240, escalationPath: ['support'], availability: 99.5 },
    { name: 'Low', responseTime: 1440, escalationPath: ['support'], availability: 99.0 }
  ]
};
```

#### 2. Production Requirements (requirements.ts)
```typescript
class ProductionRequirementsChecker {
  private thresholds = {
    minTestCoverage: 85,
    minStabilityScore: 0.95,
    maxCriticalBugs: 0,
    maxHighBugs: 0,
    maxMediumBugs: 5,
    maxBreakingChanges: 0,
    minUptime: 99.9
  };

  checkRequirements(spec: ParsedSpec): ProductionValidationResult {
    const result: ProductionValidationResult = {
      meetsRequirements: true,
      coverage: this.calculateCoverage(spec),
      stability: this.calculateStability(spec),
      compatibility: this.checkCompatibility(spec),
      security: this.checkSecurity(spec),
      blockers: [],
      warnings: []
    };

    // Critical checks - blockers
    if (result.coverage < this.thresholds.minTestCoverage) {
      result.blockers.push(`Test coverage ${result.coverage}% below minimum ${this.thresholds.minTestCoverage}%`);
      result.meetsRequirements = false;
    }

    if (result.stability < this.thresholds.minStabilityScore) {
      result.blockers.push(`Stability score ${result.stability} below minimum ${this.thresholds.minStabilityScore}`);
      result.meetsRequirements = false;
    }

    if (!result.compatibility.backwardCompatible) {
      result.blockers.push('Breaking changes detected - production requires backward compatibility');
      result.meetsRequirements = false;
    }

    if (!result.security.audited) {
      result.blockers.push('Security audit required before production promotion');
      result.meetsRequirements = false;
    }

    // Warnings
    if (result.stability < 0.98) {
      result.warnings.push('Stability below 0.98 - consider additional hardening');
    }

    return result;
  }

  calculateCoverage(spec: ParsedSpec): number {
    const allTests = spec.blocks.reduce((acc, b) => acc + (b.tests?.length || 0), 0);
    const criticalPaths = spec.blocks.filter(b => b.critical).length;
    const testedCritical = spec.blocks.filter(b => b.critical && (b.tests?.length || 0) > 0).length;
    const baseCoverage = spec.blocks.length > 0 ? (allTests / spec.blocks.length) * 100 : 0;
    const criticalCoverage = criticalPaths > 0 ? (testedCritical / criticalPaths) * 100 : 0;
    return (baseCoverage * 0.4) + (criticalCoverage * 0.6);
  }

  checkCompatibility(spec: ParsedSpec): CompatibilityResult {
    const breaking = spec.history?.filter(h => h.breaking) || [];
    const deprecations = spec.deprecations || [];
    
    return {
      backwardCompatible: breaking.length === 0,
      breakingCount: breaking.length,
      deprecationCount: deprecations.length,
      version: spec.metadata.version
    };
  }

  checkSecurity(spec: ParsedSpec): SecurityResult {
    return {
      audited: spec.metadata.securityAudited === true,
      vulnerabilities: spec.metadata.cves || [],
      lastAudit: spec.metadata.lastSecurityAudit
    };
  }
}
```

#### 3. SLA Definitions (slas.ts)
```typescript
interface SLA {
  metric: string;
  target: number;
  measurement: 'avg' | 'p95' | 'p99' | 'min' | 'max';
  window: '1m' | '5m' | '1h' | '24h';
  alertThreshold: number;
}

const PRODUCTION_SLAS: SLA[] = [
  { metric: 'availability', target: 99.9, measurement: 'min', window: '5m', alertThreshold: 99.5 },
  { metric: 'latency_p95', target: 200, measurement: 'p95', window: '5m', alertThreshold: 500 },
  { metric: 'latency_p99', target: 500, measurement: 'p99', window: '5m', alertThreshold: 1000 },
  { metric: 'error_rate', target: 0.1, measurement: 'avg', window: '5m', alertThreshold: 1.0 },
  { metric: 'throughput', target: 1000, measurement: 'avg', window: '5m', alertThreshold: 100 }
];

class SLATracker {
  private measurements: Map<string, number[]> = new Map();

  record(metric: string, value: number): void {
    const existing = this.measurements.get(metric) || [];
    existing.push(value);
    if (existing.length > 1000) existing.shift();
    this.measurements.set(metric, existing);
  }

  checkSLA(sla: SLA): SLAStatus {
    const values = this.measurements.get(sla.metric) || [];
    if (values.length === 0) return { met: false, reason: 'No data' };

    const measurement = this.calculateMeasurement(values, sla.measurement);
    const met = measurement <= sla.target;

    return {
      met,
      actual: measurement,
      target: sla.target,
      deviation: ((measurement - sla.target) / sla.target) * 100
    };
  }

  private calculateMeasurement(values: number[], method: string): number {
    const sorted = [...values].sort((a, b) => a - b);
    switch (method) {
      case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'p95': return sorted[Math.floor(sorted.length * 0.95)];
      case 'p99': return sorted[Math.floor(sorted.length * 0.99)];
      case 'min': return sorted[0];
      case 'max': return sorted[sorted.length - 1];
      default: return 0;
    }
  }
}
```

#### 4. Support Configuration (support.ts)
```typescript
interface SupportConfig {
  tiers: SupportTier[];
  escalationPolicies: Map<string, EscalationPolicy>;
  onCallRotation: OnCallRotation;
  incidentResponse: IncidentResponseConfig;
}

interface EscalationPolicy {
  levels: EscalationLevel[];
  timeout: number;  // minutes between levels
}

interface EscalationLevel {
  role: string;
  notify: string[];  # channels
  required: boolean;
}

const DEFAULT_ESCALATION: EscalationPolicy = {
  levels: [
    { role: 'Support', notify: ['slack:support'], required: true },
    { role: 'Lead', notify: ['slack:lead', 'pagerduty'], required: true },
    { role: 'Architect', notify: ['slack:architect', 'phone'], required: true },
    { role: 'CTO', notify: ['phone'], required: false }
  ],
  timeout: 15
};

class SupportManager {
  async createIncident(spec: ParsedSpec, severity: string): Promise<Incident> {
    const tier = PRODUCTION_CRITERIA.supportTiers.find(t => t.name === severity);
    if (!tier) throw new Error(`Unknown severity: ${severity}`);

    return {
      id: generateId(),
      spec: spec.metadata.id,
      severity,
      responseTime: tier.responseTime,
      status: 'open',
      createdAt: new Date(),
      assignedTo: null,
      escalationPath: tier.escalationPath
    };
  }

  async escalate(incident: Incident): Promise<void> {
    const currentIndex = incident.escalationPath.indexOf(incident.assignedTo || '');
    if (currentIndex < incident.escalationPath.length - 1) {
      incident.assignedTo = incident.escalationPath[currentIndex + 1];
      incident.escalatedAt = new Date();
    }
  }
}
```

#### 5. Production Agent Behaviors (behaviors.ts)
```typescript
const PRODUCTION_AGENT_BEHAVIOR: AgentBehaviorConfig = {
  mode: 'fully_autonomous',
  humanOversight: 'emergencies',
  cascadeDepth: 10,
  autoDeploy: true,
  
  // Production-specific - very restrictive
  allowFeatureBranches: false,
  allowRefactoring: false,
  allowBugFixes: true,
  requireFeatureApproval: true,  # Always required - cannot add features to production
  requireBreakingApproval: true,
  requireSecurityApproval: true,
  notifyOnDeploy: true,
  slackNotifications: true,
  pagerDutyAlerts: true,
  
  // Testing - extra strict
  autoRunTests: true,
  autoRunE2E: true,
  autoRunPerformance: true,
  blockOnTestFailure: true,
  blockOnE2EFailure: true,
  blockOnPerformanceRegression: true,
  canaryDeployment: true,
  
  // Safety
  blueGreenDeploy: true,
  rollbackOnError: true,
  featureFlags: true,
  circuitBreaker: true
};

class ProductionAgentBehaviorResolver {
  resolveForBlock(block: Block, action: AgentAction): BehaviorDecision {
    const decision: BehaviorDecision = {
      allowed: false,
      requiresApproval: true,
      approvalType: 'production_change',
      notifications: ['lead', 'architect', 'security']
    };

    // Only bug fixes and security patches allowed
    if (action.type === 'bugfix' && !action.breaking) {
      decision.allowed = true;
      decision.requiresApproval = true;
      decision.approvalType = 'bugfix';
      decision.notifications = ['lead'];
    }

    if (action.type === 'security') {
      decision.allowed = true;
      decision.requiresApproval = true;
      decision.approvalType = 'security';
      decision.notifications = ['lead', 'security'];
    }

    // Features require frozen spec exception process
    if (action.type === 'feature') {
      decision.allowed = false;
      decision.reason = 'Features require version bump to Beta first';
    }

    return decision;
  }
}
```

## Test Cases
1. Spec with 85%+ coverage passes Production requirements
2. Breaking changes blocked in Production
3. Security audit required before promotion
4. All SLA metrics tracked
5. Support tiers configured correctly
6. Escalation policies work
7. Bug fixes allowed with approval
8. Features blocked in Production
9. Canary deployments work
10. Rollback triggers on error

## CLI Commands
```bash
# Check Production readiness
speclang production --check specs/auth.spec.md

# Validate SLA status
speclang production --sla specs/auth.spec.md

# Create incident
speclang production --incident critical specs/auth.spec.md
```

## Validation
```bash
bun test tests/maturity/production/
```

## Output Format
After completing, output:
1. Production criteria defined
2. SLA definitions
3. Support configuration
4. Agent behaviors for Production
5. Test results
