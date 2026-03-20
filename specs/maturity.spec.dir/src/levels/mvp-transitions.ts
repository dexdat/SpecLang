import { MVP_LEVEL } from './mvp';
import { MaturityLevel, ParsedSpec } from '../types';

interface MVPTransitionChecklist {
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

const MVP_FROM_POC_CHECKLIST: MVPTransitionChecklist = {
  from: 'POC',
  to: 'MVP',
  checks: [
    {
      id: 'core_value_validated',
      description: 'Core value proposition validated',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'basic_requirements_documented',
      description: 'Basic requirements documented',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'core_features_defined',
      description: 'Core features clearly defined',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'target_users_identified',
      description: 'Target users/early adopters identified',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'internal_deployment_ready',
      description: 'Internal deployment capability ready',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'basic_tests_exist',
      description: 'Basic tests exist or planned',
      required: false,
      automated: false,
      category: 'testing'
    },
    {
      id: 'risks_mitigated',
      description: 'Key risks from POC mitigated',
      required: true,
      automated: false,
      category: 'review'
    }
  ]
};

const MVP_TO_ALPHA_CHECKLIST: MVPTransitionChecklist = {
  from: 'MVP',
  to: 'Alpha',
  checks: [
    {
      id: 'core_functionality_working',
      description: 'Core functionality verified working',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'documentation_complete',
      description: 'Documentation complete for early adopters',
      required: true,
      automated: true,
      category: 'documentation'
    },
    {
      id: 'internal_feedback_incorporated',
      description: 'Feedback from internal testing incorporated',
      required: true,
      automated: false,
      category: 'review'
    },
    {
      id: 'staging_deployment_ready',
      description: 'Staging deployment configured',
      required: true,
      automated: true,
      category: 'deployment'
    },
    {
      id: 'test_coverage_adequate',
      description: 'Test coverage adequate for core features',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'alpha_criteria_defined',
      description: 'Alpha release criteria defined',
      required: true,
      automated: true,
      category: 'documentation'
    }
  ]
};

class MVPTransitionHandler {
  getChecklist(from: MaturityLevel, to: MaturityLevel): MVPTransitionChecklist | null {
    if (from === 'POC' && to === 'MVP') return MVP_FROM_POC_CHECKLIST;
    if (from === 'MVP' && to === 'Alpha') return MVP_TO_ALPHA_CHECKLIST;
    return null;
  }
  
  async runAutomatedChecks(spec: ParsedSpec, checklist: MVPTransitionChecklist): Promise<CheckResult[]> {
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
      case 'basic_requirements_documented':
        return {
          checkId: check.id,
          passed: !!(spec.metadata.short || spec.metadata.description),
          automated: true,
          message: spec.metadata.short ? 'Requirements documented' : 'No requirements found'
        };
        
      case 'core_features_defined':
        return {
          checkId: check.id,
          passed: !!(spec.content && spec.content.length > 100),
          automated: true,
          message: spec.content ? 'Features documented' : 'No content found'
        };
        
      case 'internal_deployment_ready':
        const target = spec.metadata.target;
        return {
          checkId: check.id,
          passed: target === 'internal' || target === 'staging',
          automated: true,
          message: target ? `Target: ${target}` : 'No target specified'
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
    const checklist = this.getChecklist('MVP', targetLevel);
    
    if (!checklist) {
      return {
        possible: false,
        reason: `No transition path from MVP to ${targetLevel}`
      };
    }
    
    return {
      possible: true,
      targetLevel,
      checklist: checklist.checks,
      estimatedEffort: this.estimateEffort(checklist)
    };
  }
  
  private estimateEffort(checklist: MVPTransitionChecklist): string {
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

export const mvpTransitionHandler = new MVPTransitionHandler();