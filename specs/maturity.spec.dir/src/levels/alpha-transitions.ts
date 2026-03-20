/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/alpha.spec.md
 * Generated: 2026-03-20T18:07:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { ALPHA_LEVEL } from './alpha';
import { MaturityLevel, ParsedSpec } from '../types';

interface AlphaTransitionChecklist {
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

const ALPHA_FROM_MVP_CHECKLIST: AlphaTransitionChecklist = {
  from: 'MVP',
  to: 'Alpha',
  checks: [
    {
      id: 'core_functionality_verified',
      description: 'Core functionality verified working',
      required: true,
      automated: true,
      category: 'testing'
    },
    {
      id: 'documentation_improving',
      description: 'Documentation improved for internal use',
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
      id: 'test_coverage_growing',
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
    },
    {
      id: 'layer_structure_defined',
      description: 'Layer structure defined (0-5)',
      required: true,
      automated: true,
      category: 'documentation'
    }
  ]
};

const ALPHA_TO_BETA_CHECKLIST: AlphaTransitionChecklist = {
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

class AlphaTransitionHandler {
  getChecklist(from: MaturityLevel, to: MaturityLevel): AlphaTransitionChecklist | null {
    if (from === 'MVP' && to === 'Alpha') return ALPHA_FROM_MVP_CHECKLIST;
    if (from === 'Alpha' && to === 'Beta') return ALPHA_TO_BETA_CHECKLIST;
    return null;
  }
  
  async runAutomatedChecks(spec: ParsedSpec, checklist: AlphaTransitionChecklist): Promise<CheckResult[]> {
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
      case 'core_functionality_verified':
        return {
          checkId: check.id,
          passed: !!(spec.content && spec.content.length > 200),
          automated: true,
          message: spec.content ? 'Core functionality documented' : 'No content found'
        };
        
      case 'documentation_improving':
        return {
          checkId: check.id,
          passed: !!(spec.metadata.description || spec.metadata.short),
          automated: true,
          message: spec.metadata.description ? 'Documentation present' : 'No description found'
        };
        
      case 'staging_deployment_ready':
        const target = spec.metadata.target;
        return {
          checkId: check.id,
          passed: !!(target === 'internal' || target === 'staging'),
          automated: true,
          message: target ? `Target: ${target}` : 'No target specified'
        };
        
      case 'test_coverage_growing':
        const tags = spec.metadata.tags || [];
        const hasTests = tags.includes('tested') || tags.includes('testing');
        return {
          checkId: check.id,
          passed: hasTests,
          automated: true,
          message: hasTests ? 'Test coverage indicated' : 'No test coverage indicated'
        };
        
      case 'layer_structure_defined':
        return {
          checkId: check.id,
          passed: !!(spec.metadata.layer !== undefined && spec.metadata.layer <= 5),
          automated: true,
          message: spec.metadata.layer !== undefined ? `Layer: ${spec.metadata.layer}` : 'No layer defined'
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
    const checklist = this.getChecklist('Alpha', targetLevel);
    
    if (!checklist) {
      return {
        possible: false,
        reason: `No transition path from Alpha to ${targetLevel}`
      };
    }
    
    return {
      possible: true,
      targetLevel,
      checklist: checklist.checks,
      estimatedEffort: this.estimateEffort(checklist)
    };
  }
  
  private estimateEffort(checklist: AlphaTransitionChecklist): string {
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

export const alphaTransitionHandler = new AlphaTransitionHandler();
