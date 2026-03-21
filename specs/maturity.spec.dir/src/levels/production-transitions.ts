/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/production.spec.md
 * Generated: 2026-03-20T19:00:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { PRODUCTION_LEVEL } from './production';
import { MaturityLevel, ParsedSpec } from '../types';

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