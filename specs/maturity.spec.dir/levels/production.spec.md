# speclang-header lines:11
id: "@speclang/maturity/levels/production"
version: 0.1.0
layer: 3
tags: [maturity, levels, production]
parent: "@ref:specs/project-maturity-levels/levels"
project_level: Alpha
agent_support: agent_autonomous
short: Production level definition, validation, transitions, and agent behavior
---
# Production Level Implementation

Implementation of Production maturity level for production-ready, supported systems.

## Files

### @block::production-level-definition @kind:code @target:src/maturity/levels/production.ts
```typescript
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior } from '../types';

export const PRODUCTION_LEVEL: LevelDefinition = {
  name: 'Production',
  order: 4,
  displayName: 'Production',
  description: 'Production-ready, supported',
  criteria: {
    documentation: 'complete',
    testing: 'full',
    deployment: 'production',
    stability: 'hardened'
  } as LevelCriteria,
  agentBehavior: {
    mode: 'fully_autonomous',
    humanOversight: 'emergencies',
    cascadeDepth: 10,
    autoDeploy: true,
    generationEnabled: true,
    reviewRequired: false
  } as AgentBehavior,
  requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'agent_support'],
  recommendedFields: ['description', 'target', 'depends_on'],
  optionalFields: ['next_steps', 'compliance', 'audit', 'governance'],
  recommendedTests: ['unit', 'integration', 'e2e', 'performance'],
  allowedTargets: ['production'],
  constraints: {
    maxSpecs: 1000,
    maxLayers: 10,
    allowGenerated: true,
    allowAutoDeploy: true,
    requireMinimalTests: true
  }
};

export const PRODUCTION_CRITERIA = {
  documentation: {
    level: 'complete',
    description: 'Documentation complete for production use',
    requirements: [
      'ID, version, layer, tags, short required',
      'Status field required (active, deprecated, etc.)',
      'Description required',
      'Block definitions must be present',
      'Architecture overview required',
      'API documentation required',
      'User documentation required',
      'Operational runbooks available'
    ]
  },
  testing: {
    level: 'full',
    description: 'Full test coverage for all features',
    requirements: [
      'Unit tests for all functions',
      'Integration tests for all component interactions',
      'End-to-end tests for all critical flows',
      'Test coverage > 90%',
      'Performance tests for all critical paths',
      'Security tests for all entry points',
      'Load tests for scalability validation'
    ]
  },
  deployment: {
    level: 'production',
    description: 'Production deployment ready',
    requirements: [
      'Production deployment target configured',
      'Infrastructure fully automated',
      'Deployment pipeline mature',
      'Rollback capability verified',
      'Monitoring and alerting in place',
      'Disaster recovery procedures tested',
      'SLA defined and monitored'
    ]
  },
  stability: {
    level: 'hardened',
    description: 'APIs and structure hardened for production',
    requirements: [
      'Breaking changes prohibited without major version',
      'Version handling required',
      'Backward compatibility guaranteed',
      'Change documentation required',
      'Deprecation notices provided with migration paths',
      'Performance expectations documented and monitored',
      'Security patches process defined'
    ]
  }
};

export function isProductionLevel(level: string): boolean {
  return level === 'Production';
}

export function createProductionSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'Production',
    agent_support: 'agent_autonomous',
    status: 'active',
    layer: 4
  };
}
```

### @block::production-validator @kind:code @target:src/maturity/levels/production-validator.ts
```typescript
import { PRODUCTION_LEVEL, PRODUCTION_CRITERIA } from './production';

interface ProductionValidationResult {
  isValid: boolean;
  meetsProductionCriteria: boolean;
  issues: ProductionValidationIssue[];
  warnings: string[];
  suggestions: string[];
}

interface ProductionValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

class ProductionValidator {
  validate(spec: ParsedSpec): ProductionValidationResult {
    const issues: ProductionValidationIssue[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check required fields (most strict)
    for (const field of PRODUCTION_LEVEL.requiredFields) {
      if (!spec.metadata[field]) {
        issues.push({
          type: 'error',
          field,
          message: `Production requires field: ${field}`
        });
      }
    }
    
    // Check layer is appropriate (0-10 for Production)
    const layer = spec.metadata.layer;
    if (layer !== undefined && layer > 10) {
      issues.push({
        type: 'error',
        field: 'layer',
        message: `Production should have layer 0-10, got ${layer}`
      });
    }
    
    // Check deployment target - Production only allows production
    const target = spec.metadata.target;
    if (target && target !== 'production') {
      issues.push({
        type: 'error',
        field: 'target',
        message: 'Production level only supports production deployment'
      });
    }
    
    // Check documentation completeness
    if (!spec.metadata.description && spec.content && spec.content.length < 1000) {
      warnings.push('Production benefits from detailed description (1000+ chars)');
    }
    
    // Production should have architecture documentation
    if (spec.content && !spec.content.toLowerCase().includes('architecture') && 
        !spec.content.toLowerCase().includes('overview')) {
      issues.push({
        type: 'error',
        field: 'content',
        message: 'Production requires architecture overview'
      });
    }
    
    // Check for test coverage - Production expects full coverage
    const tags = spec.metadata.tags || [];
    if (!tags.includes('tested') && !tags.includes('testing')) {
      warnings.push('Production expects full test coverage');
    }
    
    // Check depends_on for dependencies
    if (!spec.metadata.depends_on && spec.content?.includes('@ref:')) {
      warnings.push('References found but no depends_on declared');
    }
    
    // Status field required for Production
    if (!spec.metadata.status) {
      issues.push({
        type: 'error',
        field: 'status',
        message: 'Production requires status field (e.g., active, deprecated)'
      });
    }
    
    // Description field required for Production
    if (!spec.metadata.description) {
      issues.push({
        type: 'error',
        field: 'description',
        message: 'Production requires description field'
      });
    }
    
    // Agent support field required for Production
    if (!spec.metadata.agent_support) {
      issues.push({
        type: 'error',
        field: 'agent_support',
        message: 'Production requires agent_support field'
      });
    }
    
    // Suggestions for improvement
    if (!spec.metadata.layer) {
      suggestions.push('Add layer to clarify spec abstraction level');
    }
    
    if (!spec.metadata.target && spec.metadata.layer && spec.metadata.layer >= 4) {
      suggestions.push('Code-level specs should specify target');
    }
    
    // Check for integration test recommendations
    if (spec.metadata.layer && spec.metadata.layer >= 3) {
      suggestions.push('Consider adding integration tests for this layer');
    }
    
    // Check for performance test recommendations for layer >= 5
    if (spec.metadata.layer && spec.metadata.layer >= 5) {
      suggestions.push('Consider adding performance tests for this layer');
    }
    
    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      meetsProductionCriteria: issues.length === 0,
      issues,
      warnings,
      suggestions
    };
  }
  
  canPromoteFromProduction(spec: ParsedSpec): PromoteResult {
    const blockers: string[] = [];
    
    // Required fields must exist
    if (!spec.metadata.id || !spec.metadata.version) {
      blockers.push('Missing required fields');
    }
    if (!spec.metadata.tags || spec.metadata.tags.length === 0) {
      blockers.push('Missing tags');
    }
    if (!spec.metadata.short) {
      blockers.push('Missing short description');
    }
    if (!spec.metadata.status) {
      blockers.push('Missing status field');
    }
    if (spec.metadata.layer === undefined) {
      blockers.push('Layer not defined');
    }
    if (!spec.metadata.description) {
      blockers.push('Missing description field');
    }
    if (!spec.metadata.agent_support) {
      blockers.push('Missing agent_support field');
    }
    
    // Should have comprehensive documentation
    const hasComprehensiveDoc = spec.content && spec.content.length > 1000;
    if (!hasComprehensiveDoc) {
      blockers.push('Documentation not comprehensive enough for Production');
    }
    
    // Should have test coverage indicators
    const tags = spec.metadata.tags || [];
    const hasTests = tags.includes('tested') || tags.includes('testing');
    if (!hasTests) {
      blockers.push('Test coverage expected for Production');
    }
    
    // Should have architecture overview
    const hasArchitecture = spec.content && (spec.content.toLowerCase().includes('architecture') || 
                            spec.content.toLowerCase().includes('overview'));
    if (!hasArchitecture) {
      blockers.push('Architecture overview required for Production');
    }
    
    return {
      canPromote: blockers.length === 0,
      blockers,
      readinessScore: this.calculateReadiness(spec)
    };
  }
  
  canDemoteToBeta(spec: ParsedSpec): boolean {
    // Production can always go back to Beta
    return true;
  }
  
  private calculateReadiness(spec: ParsedSpec): number {
    let score = 0;
    
    // Required fields (50 points)
    if (spec.metadata.id) score += 8;
    if (spec.metadata.version) score += 8;
    if (spec.metadata.tags?.length) score += 8;
    if (spec.metadata.short) score += 8;
    if (spec.metadata.status) score += 8;
    if (spec.metadata.layer !== undefined) score += 10;
    
    // Recommended fields (25 points)
    if (spec.metadata.description) score += 8;
    if (spec.metadata.target) score += 8;
    if (spec.metadata.depends_on?.length) score += 9;
    
    // Content quality (25 points)
    if (spec.content && spec.content.length > 0) score += 8;
    if (spec.content && spec.content.length > 1000) score += 8;
    if (spec.content && spec.content.length > 2000) score += 9;
    
    return Math.min(score, 100);
  }
}

interface PromoteResult {
  canPromote: boolean;
  blockers: string[];
  readinessScore: number;
}

export const productionValidator = new ProductionValidator();
```

### @block::production-transitions @kind:code @target:src/maturity/levels/production-transitions.ts
```typescript
import { PRODUCTION_LEVEL } from './production';

interface ProductionTransitionChecklist {
  from: MaturityLevel;
  to: MaturityLevel;
  checks: TransitionCheck[];
}

interface TransitionCheck {
  id: string;
  description: string;
  required: boolean;
  automated: boolean;
  category: 'documentation' | 'testing' | 'review' | 'deployment';
}

const PRODUCTION_FROM_BETA_CHECKLIST: ProductionTransitionChecklist = {
  from: 'Beta',
  to: 'Production',
  checks: [
    {
      id: 'production_deployment_ready',
      description: 'Production deployment configured and tested',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'security_audit_complete',
      description: 'Security audit completed',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'performance_tests_passed',
      description: 'Performance tests meet requirements',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'monitoring_alerting_configured',
      description: 'Monitoring and alerting configured',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'disaster_recovery_tested',
      description: 'Disaster recovery procedures tested',
      required: true,
      automated: false,
      category: 'deployment'
    },
    {
      id: 'sla_defined',
      description: 'Service Level Agreements defined',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'support_processes_defined',
      description: 'Support processes defined',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'compliance_verified',
      description: 'Compliance requirements verified',
      required: true,
      automated: false,
      category: 'review'
    }
  ]
};

class ProductionTransitionHandler {
  getChecklist(from: MaturityLevel, to: MaturityLevel): ProductionTransitionChecklist | null {
    if (from === 'Beta' && to === 'Production') return PRODUCTION_FROM_BETA_CHECKLIST;
    return null;
  }
  
  async runAutomatedChecks(spec: ParsedSpec, checklist: ProductionTransitionChecklist): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    
    for (const check of checklist.checks) {
      if (!check.automated) {
        results.push({
          checkId: check.id,
          passed: false,
          automated: false,
          message: 'Manual review required'
        });
        continue;
      }
      
      const result = await this.runCheck(spec, check);
      results.push(result);
    }
    
    return results;
  }
  
  private async runCheck(spec: ParsedSpec, check: TransitionCheck): Promise<CheckResult> {
    switch (check.id) {
      case 'production_deployment_ready':
        return {
          checkId: check.id,
          passed: spec.metadata.target === 'production',
          automated: true,
          message: spec.metadata.target === 'production' ? 'Production target set' : 'Not production target'
        };
        
      case 'performance_tests_passed':
        const tags = spec.metadata.tags || [];
        return {
          checkId: check.id,
          passed: tags.includes('performance') || tags.includes('tested'),
          automated: true,
          message: tags.includes('performance') ? 'Performance tests indicated' : 'No performance tests'
        };
        
      case 'monitoring_alerting_configured':
        return {
          checkId: check.id,
          passed: spec.content && (spec.content.toLowerCase().includes('monitoring') || 
                 spec.content.toLowerCase().includes('alerting')),
          automated: true,
          message: spec.content ? 'Monitoring mentioned' : 'No monitoring mentioned'
        };
        
      case 'sla_defined':
        return {
          checkId: check.id,
          passed: spec.content && (spec.content.toLowerCase().includes('sla') || 
                 spec.content.toLowerCase().includes('service level')),
          automated: true,
          message: spec.content ? 'SLA mentioned' : 'No SLA mentioned'
        };
        
      case 'support_processes_defined':
        return {
          checkId: check.id,
          passed: spec.content && (spec.content.toLowerCase().includes('support') || 
                 spec.content.toLowerCase().includes('process')),
          automated: true,
          message: spec.content ? 'Support processes mentioned' : 'No support processes'
        };
        
      default:
        return {
          checkId: check.id,
          passed: false,
          automated: false,
          message: 'Manual check required'
        };
    }
  }
  
  prepareTransition(spec: ParsedSpec, targetLevel: MaturityLevel): TransitionPreparation {
    const checklist = this.getChecklist('Production', targetLevel);
    
    if (!checklist) {
      return {
        possible: false,
        reason: `No transition path from Production to ${targetLevel}`
      };
    }
    
    return {
      possible: true,
      targetLevel,
      checklist: checklist.checks,
      estimatedEffort: this.estimateEffort(checklist)
    };
  }
  
  private estimateEffort(checklist: ProductionTransitionChecklist): string {
    const requiredCount = checklist.checks.filter(c => c.required).length;
    const automatedCount = checklist.checks.filter(c => c.automated).length;
    
    const manualCount = requiredCount - automatedCount;
    
    if (manualCount <= 1) return 'Low';
    if (manualCount <= 3) return 'Medium';
    return 'High';
  }
}

interface CheckResult {
  checkId: string;
  passed: boolean;
  automated: boolean;
  message: string;
}

interface TransitionPreparation {
  possible: boolean;
  reason?: string;
  targetLevel?: MaturityLevel;
  checklist?: TransitionCheck[];
  estimatedEffort?: string;
}

export const productionTransitionHandler = new ProductionTransitionHandler();
```

### @block::production-behavior @kind:code @target:src/maturity/levels/production-behavior.ts
```typescript
import { PRODUCTION_LEVEL } from './production';

export const PRODUCTION_AGENT_BEHAVIOR = {
  mode: 'fully_autonomous',
  description: 'Agent fully autonomous, human oversight only for emergencies',
  
  specWriting: {
    canCreate: true,
    requiresApproval: false,
    approvalType: 'emergencies',
    maxAutonomy: true
  },
  
  codeGeneration: {
    enabled: true,
    requiresReview: false,
    allowedTargets: ['production'],
    reason: 'Production can generate code for all features'
  },
  
  testGeneration: {
    enabled: true,
    requiresReview: false,
    minimumCoverage: 0.9,
    reason: 'Test coverage expected to be full'
  },
  
  deployment: {
    allowed: true,
    targets: ['production'],
    autoDeploy: true,
    requiresApproval: false,
    reason: 'Production deployment automated'
  },
  
  cascade: {
    maxDepth: 10,
    description: 'Ten levels - full dependency tree expansion',
    allowCrossSpecRefs: true,
    requireExplicitDeps: true
  },
  
  validation: {
    strictness: 'strictest',
    allowIncomplete: false,
    warnOnMissing: ['layer', 'status', 'description', 'agent_support'],
    errorOnMissing: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'agent_support']
  },
  
  suggestions: [
    'Focus on stability, security, and performance',
    'Ensure full test coverage',
    'Maintain comprehensive documentation',
    'Monitor production metrics',
    'Establish incident response procedures',
    'Regular security audits',
    'Performance optimization'
  ]
};

class ProductionAgentBehaviorResolver {
  resolve(): AgentBehaviorConfig {
    return {
      mode: PRODUCTION_AGENT_BEHAVIOR.mode,
      specWriting: PRODUCTION_AGENT_BEHAVIOR.specWriting,
      codeGeneration: PRODUCTION_AGENT_BEHAVIOR.codeGeneration,
      testGeneration: PRODUCTION_AGENT_BEHAVIOR.testGeneration,
      deployment: PRODUCTION_AGENT_BEHAVIOR.deployment,
      cascade: PRODUCTION_AGENT_BEHAVIOR.cascade,
      validation: PRODUCTION_AGENT_BEHAVIOR.validation
    };
  }
  
  shouldAllowAction(action: AgentAction): boolean {
    switch (action.type) {
      case 'create_spec':
        return true;
      case 'edit_spec':
        return true;
      case 'generate_code':
        return true;
      case 'generate_tests':
        return true;
      case 'deploy':
        return action.target === 'production';
      case 'cascade':
        return action.depth !== undefined && action.depth <= 10;
      default:
        return false;
    }
  }
  
  requiresApproval(action: AgentAction): boolean {
    switch (action.type) {
      case 'generate_code':
        return false;
      case 'generate_tests':
        return false;
      case 'deploy':
        return false;
      default:
        return false;
    }
  }
  
  getSuggestions(context: AgentContext): string[] {
    return PRODUCTION_AGENT_BEHAVIOR.suggestions;
  }
}

interface AgentBehaviorConfig {
  mode: string;
  specWriting: typeof PRODUCTION_AGENT_BEHAVIOR.specWriting;
  codeGeneration: typeof PRODUCTION_AGENT_BEHAVIOR.codeGeneration;
  testGeneration: typeof PRODUCTION_AGENT_BEHAVIOR.testGeneration;
  deployment: typeof PRODUCTION_AGENT_BEHAVIOR.deployment;
  cascade: typeof PRODUCTION_AGENT_BEHAVIOR.cascade;
  validation: typeof PRODUCTION_AGENT_BEHAVIOR.validation;
}

interface AgentAction {
  type: string;
  approval?: 'minor' | 'major';
  target?: string;
  depth?: number;
}

interface AgentContext {
  spec?: ParsedSpec;
}

export const productionBehaviorResolver = new ProductionAgentBehaviorResolver();
```

## References

- @ref:specs/project-maturity-levels/levels - Level definitions
- @ref:specs/maturity/levels/beta - Beta level (previous level)
- @ref:specs/maturity/levels/startup - Startup level (next level)