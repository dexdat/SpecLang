/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/beta.spec.md
 * Generated: 2026-03-20T18:30:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { BETA_LEVEL } from './beta';
import { MaturityLevel, ParsedSpec } from '../types';

interface BetaTransitionChecklist {
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

const BETA_FROM_ALPHA_CHECKLIST: BetaTransitionChecklist = {
  from: 'Alpha',
  to: 'Beta',
  checks: [
    {
      id: 'all_features_implemented',
      description: 'All features implemented',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'documentation_complete',
      description: 'Documentation complete for external testers',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'test_coverage_comprehensive',
      description: 'Comprehensive test coverage',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'beta_deployment_ready',
      description: 'Beta deployment configured',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'beta_testers_identified',
      description: 'Beta testers identified',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'stability_verified',
      description: 'Stability verified through internal testing',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'feedback_mechanism_ready',
      description: 'Feedback mechanism ready for external testers',
      required: true,
      automated: true,
      category: 'documentation'
    }
  ]
};

const BETA_TO_PRODUCTION_CHECKLIST: BetaTransitionChecklist = {
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

class BetaTransitionHandler {
  getChecklist(from: MaturityLevel, to: MaturityLevel): BetaTransitionChecklist | null {
    if (from === 'Alpha' && to === 'Beta') return BETA_FROM_ALPHA_CHECKLIST;
    if (from === 'Beta' && to === 'Production') return BETA_TO_PRODUCTION_CHECKLIST;
    return null;
  }
  
  async runAutomatedChecks(spec: ParsedSpec, checklist: BetaTransitionChecklist): Promise<CheckResult[]> {
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
      case 'all_features_implemented':
        return {
          checkId: check.id,
          passed: !!(spec.content && spec.content.length > 500),
          automated: true,
          message: spec.content ? 'Features documented' : 'No content found'
        };
        
      case 'documentation_complete':
        return {
          checkId: check.id,
          passed: !!(spec.metadata.description && spec.metadata.short),
          automated: true,
          message: spec.metadata.description ? 'Documentation present' : 'No description found'
        };
        
      case 'test_coverage_comprehensive':
        const tags = spec.metadata.tags || [];
        const hasTests = tags.includes('tested') || tags.includes('testing');
        return {
          checkId: check.id,
          passed: hasTests,
          automated: true,
          message: hasTests ? 'Test coverage indicated' : 'No test coverage indicated'
        };
        
      case 'beta_deployment_ready':
        const target = spec.metadata.target;
        return {
          checkId: check.id,
          passed: typeof target === 'string' && (target === 'beta' || target === 'staging' || target === 'production'),
          automated: true,
          message: target ? `Target: ${target}` : 'No target specified'
        };
        
      case 'stability_verified':
        return {
          checkId: check.id,
          passed: spec.metadata.status === 'stable' || spec.metadata.status === 'active',
          automated: true,
          message: spec.metadata.status ? `Status: ${spec.metadata.status}` : 'No status defined'
        };
        
      case 'feedback_mechanism_ready':
        return {
          checkId: check.id,
          passed: !!(spec.content && (spec.content.toLowerCase().includes('feedback') || 
                 spec.content.toLowerCase().includes('contact'))),
          automated: true,
          message: spec.content ? 'Feedback mechanism mentioned' : 'No feedback mechanism'
        };
        
      case 'production_deployment_ready':
        return {
          checkId: check.id,
          passed: spec.metadata.target === 'production',
          automated: true,
          message: spec.metadata.target === 'production' ? 'Production target set' : 'Not production target'
        };
        
      case 'performance_tests_passed':
        const perfTags = spec.metadata.tags || [];
        return {
          checkId: check.id,
          passed: perfTags.includes('performance') || perfTags.includes('tested'),
          automated: true,
          message: perfTags.includes('performance') ? 'Performance tests indicated' : 'No performance tests'
        };
        
      case 'monitoring_alerting_configured':
        return {
          checkId: check.id,
          passed: !!(spec.content && (spec.content.toLowerCase().includes('monitoring') || 
                 spec.content.toLowerCase().includes('alerting'))),
          automated: true,
          message: spec.content ? 'Monitoring mentioned' : 'No monitoring mentioned'
        };
        
      case 'sla_defined':
        return {
          checkId: check.id,
          passed: !!(spec.content && (spec.content.toLowerCase().includes('sla') || 
                 spec.content.toLowerCase().includes('service level'))),
          automated: true,
          message: spec.content ? 'SLA mentioned' : 'No SLA mentioned'
        };
        
      case 'support_processes_defined':
        return {
          checkId: check.id,
          passed: !!(spec.content && (spec.content.toLowerCase().includes('support') || 
                 spec.content.toLowerCase().includes('process'))),
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
    const checklist = this.getChecklist('Beta', targetLevel);
    
    if (!checklist) {
      return {
        possible: false,
        reason: `No transition path from Beta to ${targetLevel}`
      };
    }
    
    return {
      possible: true,
      targetLevel,
      checklist: checklist.checks,
      estimatedEffort: this.estimateEffort(checklist)
    };
  }
  
  private estimateEffort(checklist: BetaTransitionChecklist): string {
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

export const betaTransitionHandler = new BetaTransitionHandler();