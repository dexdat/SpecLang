// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
import type { SpecRef, UpgradePlan, UpgradeCheck, CheckResult, MaturityLevel, AgentSupport, TransitionCheck } from './types';

interface TransitionPath {
  from: string;
  to: string;
  type: 'project_level' | 'agent_support';
}

const VALID_PROJECT_TRANSITIONS = new Map<string, string>([
  ['POC', 'MVP'], ['MVP', 'Alpha'], ['Alpha', 'Beta'], ['Beta', 'Production'],
]);
const VALID_AGENT_TRANSITIONS = new Map<string, string>([
  ['human_only', 'agent_assisted'], ['agent_assisted', 'agent_autonomous'],
]);

export class UpgradePlanner {
  plan(from: string, to: string, specs: SpecRef[]): UpgradePlan {
    if (!this.isValidTransition(from, to)) {
      throw new Error('No upgrade path defined from ' + from + ' to ' + to);
    }
    const checks = this.buildChecks(from, to);
    return {
      from, to, specs, checks,
      estimatedDuration: checks.length * 5 * 60 * 1000,
      requiredApprovals: this.getRequiredApprovals(to),
    };
  }

  check(from: string, to: string, spec: SpecRef): UpgradeCheck[] {
    const raw = this.buildRawChecks(from, to);
    return raw.map(function(tc: TransitionCheck): UpgradeCheck {
      return {
        check: tc,
        passed: true,
        message: tc.automated ? 'Check passed' : 'Manual check: ' + tc.description,
      };
    });
  }

  isValidTransition(from: string, to: string): boolean {
    return VALID_PROJECT_TRANSITIONS.get(from) === to || VALID_AGENT_TRANSITIONS.get(from) === to;
  }

  listTransitionPaths(): TransitionPath[] {
    var paths: TransitionPath[] = [];
    VALID_PROJECT_TRANSITIONS.forEach(function(to, from) { paths.push({ from: from, to: to, type: 'project_level' }); });
    VALID_AGENT_TRANSITIONS.forEach(function(to, from) { paths.push({ from: from, to: to, type: 'agent_support' }); });
    return paths;
  }

  private buildChecks(from: string, to: string): UpgradeCheck[] {
    var raw = this.buildRawChecks(from, to);
    return raw.map(function(tc: TransitionCheck): UpgradeCheck {
      return { check: tc, passed: false, message: tc.description };
    });
  }

  private buildRawChecks(from: string, to: string): TransitionCheck[] {
    var p = from + '→' + to;
    if (p === 'POC→MVP') return [
      { category: 'phase_basic_validation', description: 'Basic validation checks', required: true, automated: true },
      { category: 'phase_basic_validation', description: 'Manual header review', required: true, automated: false },
    ];
    if (p === 'MVP→Alpha') return [
      { category: 'phase_refs_and_tests', description: 'Cross-reference validation', required: true, automated: true },
      { category: 'phase_refs_and_tests', description: 'Test file existence', required: true, automated: true },
    ];
    if (p === 'Alpha→Beta') return [
      { category: 'phase_step_by_step', description: 'Step-by-step validation', required: true, automated: true },
      { category: 'phase_comprehensive_tests', description: 'Comprehensive test validation', required: true, automated: true },
    ];
    if (p === 'Beta→Production') return [
      { category: 'phase_security_validation', description: 'Security validation', required: true, automated: true },
      { category: 'phase_autonomous_validation', description: 'Autonomous readiness', required: true, automated: true },
      { category: 'phase_production_readiness', description: 'Production readiness check', required: true, automated: true },
    ];
    if (p === 'human_only→agent_assisted') return [
      { category: 'phase_agent_readiness', description: 'Agent readiness', required: true, automated: true },
    ];
    if (p === 'agent_assisted→agent_autonomous') return [
      { category: 'phase_autonomous_validation', description: 'Autonomous validation', required: true, automated: true },
    ];
    return [];
  }

  private getRequiredApprovals(toLevel: string): string[] {
    var a: string[] = [];
    if (toLevel === 'Production') { a.push('production_readiness_review', 'security_review'); }
    if (toLevel === 'Beta') { a.push('qa_lead'); }
    if (toLevel === 'agent_autonomous') { a.push('autonomous_readiness_review', 'safety_review'); }
    return a;
  }
}
