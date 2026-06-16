// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/upgrade.spec.md

import type { UpgradeChecklist, UpgradeTarget, TransitionCheck } from './types';

/**
 * Upgrade Checklist Provider
 * 
 * Provides checklists for different upgrade types based on the spec.
 */
export class UpgradeChecklistProvider {
  /**
   * Get checklists for a project level upgrade
   */
  getProjectLevelChecklists(from: string, to: string): UpgradeChecklist[] {
    const key = `${from} → ${to}`;
    const checklist = this.projectLevelChecklists[key];
    if (!checklist) {
      throw new Error(`No checklist defined for project level upgrade: ${key}`);
    }
    return [checklist];
  }
  
  /**
   * Get checklists for an agent support upgrade
   */
  getAgentSupportChecklists(from: string, to: string): UpgradeChecklist[] {
    const key = `${from} → ${to}`;
    const checklist = this.agentSupportChecklists[key];
    if (!checklist) {
      throw new Error(`No checklist defined for agent support upgrade: ${key}`);
    }
    return [checklist];
  }
  
  /**
   * Get combined checklists for both upgrades
   */
  getCombinedChecklists(current: UpgradeTarget, target: UpgradeTarget): UpgradeChecklist[] {
    const checklists: UpgradeChecklist[] = [];
    
    if (current.project_level !== target.project_level) {
      checklists.push(...this.getProjectLevelChecklists(current.project_level!, target.project_level!));
    }
    
    if (current.agent_support !== target.agent_support) {
      checklists.push(...this.getAgentSupportChecklists(current.agent_support!, target.agent_support!));
    }
    
    return checklists;
  }

  // Project level checklists from upgrade.spec.md
  private projectLevelChecklists: Record<string, UpgradeChecklist> = {
    'POC → MVP': {
      from: 'POC',
      to: 'MVP',
      checks: [
        // spec_requirements
        { category: 'spec', description: 'Core architecture defined', required: true, automated: false },
        { category: 'spec', description: 'Key components identified', required: true, automated: false },
        { category: 'spec', description: 'User stories written', required: true, automated: false },
        { category: 'spec', description: 'Non-functional requirements documented', required: true, automated: false },
        // validation_requirements
        { category: 'validation', description: 'Header valid', required: true, automated: true },
        { category: 'validation', description: 'IDs follow conventions', required: true, automated: true },
        { category: 'validation', description: 'No syntax errors', required: true, automated: true },
        // test_requirements
        { category: 'test', description: 'Core functionality manually tested', required: true, automated: false },
        { category: 'test', description: 'Basic automated tests exist for critical paths', required: true, automated: true },
        // documentation_requirements
        { category: 'documentation', description: 'README explains project', required: true, automated: false },
        { category: 'documentation', description: 'Setup instructions', required: true, automated: false },
        { category: 'documentation', description: 'Core API documented', required: true, automated: false },
        // approval_required
        { category: 'approval', description: 'Product owner approval', required: true, automated: false },
        { category: 'approval', description: 'Technical lead approval', required: true, automated: false },
        // automated_checks
        { category: 'automated', description: 'validate_refs.py passes', required: true, automated: true },
        { category: 'automated', description: 'Basic compilation (if applicable)', required: true, automated: true },
      ]
    },
    'MVP → Alpha': {
      from: 'MVP',
      to: 'Alpha',
      checks: [
        // spec_requirements
        { category: 'spec', description: 'All feature specs complete (layer 1)', required: true, automated: false },
        { category: 'spec', description: 'Component specs exist for core features (layer 2)', required: true, automated: false },
        { category: 'spec', description: 'Implementation specs started (layer 3)', required: true, automated: false },
        // validation_requirements
        { category: 'validation', description: 'All references resolve (except forward references in depends_on)', required: true, automated: true },
        { category: 'validation', description: 'Step-by-step descriptions for core operations', required: true, automated: false },
        // test_requirements
        { category: 'test', description: 'Unit tests for core components', required: true, automated: true },
        { category: 'test', description: 'Integration tests for key workflows', required: true, automated: true },
        { category: 'test', description: 'Test coverage > 50%', required: true, automated: true },
        // documentation_requirements
        { category: 'documentation', description: 'API documentation complete', required: true, automated: false },
        { category: 'documentation', description: 'Architecture documentation', required: true, automated: false },
        { category: 'documentation', description: 'Deployment guide for internal environments', required: true, automated: false },
        // approval_required
        { category: 'approval', description: 'Technical lead approval', required: true, automated: false },
        { category: 'approval', description: 'QA lead approval', required: true, automated: false },
        // automated_checks (none specified)
      ]
    },
    'Alpha → Beta': {
      from: 'Alpha',
      to: 'Beta',
      checks: [
        // spec_requirements
        { category: 'spec', description: 'All feature specs complete', required: true, automated: false },
        { category: 'spec', description: 'Implementation specs for all components', required: true, automated: false },
        { category: 'spec', description: 'Code generation specs for core components', required: true, automated: false },
        // validation_requirements
        { category: 'validation', description: 'All references resolve', required: true, automated: true },
        { category: 'validation', description: 'Step-by-step descriptions for all operations', required: true, automated: false },
        { category: 'validation', description: 'No ambiguous language in critical sections', required: true, automated: false },
        // test_requirements
        { category: 'test', description: 'Comprehensive test suite', required: true, automated: true },
        { category: 'test', description: 'End-to-end tests for major flows', required: true, automated: true },
        { category: 'test', description: 'Test coverage > 80%', required: true, automated: true },
        { category: 'test', description: 'Performance tests for critical paths', required: true, automated: true },
        // documentation_requirements
        { category: 'documentation', description: 'User documentation complete', required: true, automated: false },
        { category: 'documentation', description: 'Developer documentation complete', required: true, automated: false },
        { category: 'documentation', description: 'Troubleshooting guide', required: true, automated: false },
        // approval_required
        { category: 'approval', description: 'Product owner approval', required: true, automated: false },
        { category: 'approval', description: 'Security review', required: true, automated: false },
        { category: 'approval', description: 'UX review (if applicable)', required: true, automated: false },
        // automated_checks
        { category: 'automated', description: 'All validation passes (including autonomous validation)', required: true, automated: true },
        { category: 'automated', description: 'All tests pass', required: true, automated: true },
        { category: 'automated', description: 'Performance within acceptable bounds', required: true, automated: true },
        { category: 'automated', description: 'Security scan clean', required: true, automated: true },
      ]
    },
    'Beta → Production': {
      from: 'Beta',
      to: 'Production',
      checks: [
        // spec_requirements
        { category: 'spec', description: 'All specs complete and validated', required: true, automated: false },
        { category: 'spec', description: 'Code generation specs for all components', required: true, automated: false },
        { category: 'spec', description: 'Test specs for all functionality', required: true, automated: false },
        { category: 'spec', description: 'Deployment specs exist', required: true, automated: false },
        // validation_requirements
        { category: 'validation', description: 'Pass autonomous validation for all agent_autonomous specs', required: true, automated: true },
        { category: 'validation', description: 'All references resolve', required: true, automated: true },
        { category: 'validation', description: 'No warnings from validation tools', required: true, automated: true },
        // test_requirements
        { category: 'test', description: 'Full test suite with high coverage (>90%)', required: true, automated: true },
        { category: 'test', description: 'Performance tests', required: true, automated: true },
        { category: 'test', description: 'Security tests', required: true, automated: true },
        { category: 'test', description: 'Load tests', required: true, automated: true },
        { category: 'test', description: 'Disaster recovery tests', required: true, automated: true },
        // documentation_requirements
        { category: 'documentation', description: 'Complete documentation for all audiences', required: true, automated: false },
        { category: 'documentation', description: 'Operational runbooks', required: true, automated: false },
        { category: 'documentation', description: 'Disaster recovery procedures', required: true, automated: false },
        { category: 'documentation', description: 'Monitoring and alerting guide', required: true, automated: false },
        // approval_required
        { category: 'approval', description: 'Production readiness review board', required: true, automated: false },
        { category: 'approval', description: 'Security compliance approval', required: true, automated: false },
        { category: 'approval', description: 'Legal/compliance approval (if applicable)', required: true, automated: false },
        // automated_checks
        { category: 'automated', description: 'All tests pass in production-like environment', required: true, automated: true },
        { category: 'automated', description: 'Deployment pipeline works', required: true, automated: true },
        { category: 'automated', description: 'Rollback procedure tested', required: true, automated: true },
        { category: 'automated', description: 'Monitoring in place', required: true, automated: true },
      ]
    },
  };

  // Agent support checklists from upgrade.spec.md
  private agentSupportChecklists: Record<string, UpgradeChecklist> = {
    'human_only → agent_assisted': {
      from: 'human_only',
      to: 'agent_assisted',
      checks: [
        // spec_requirements
        { category: 'spec', description: 'Clear requirements (less ambiguity)', required: true, automated: false },
        { category: 'spec', description: 'Some step-by-step descriptions', required: true, automated: false },
        { category: 'spec', description: 'Most references resolved', required: true, automated: false },
        // validation_requirements
        { category: 'validation', description: 'Header valid', required: true, automated: true },
        { category: 'validation', description: 'References exist (warnings allowed)', required: true, automated: true },
        { category: 'validation', description: 'No syntax errors', required: true, automated: true },
        // agent_readiness
        { category: 'agent', description: 'Agent can understand spec intent', required: true, automated: false },
        { category: 'agent', description: 'Agent can propose reasonable edits', required: true, automated: false },
        { category: 'agent', description: 'Agent can generate draft code', required: true, automated: false },
        // human_preparation
        { category: 'human', description: 'Human reviewers identified', required: true, automated: false },
        { category: 'human', description: 'Review process defined', required: true, automated: false },
        { category: 'human', description: 'Approval workflow configured', required: true, automated: false },
        // approval_required
        { category: 'approval', description: 'Spec author approval', required: true, automated: false },
        { category: 'approval', description: 'Technical lead approval', required: true, automated: false },
      ]
    },
    'agent_assisted → agent_autonomous': {
      from: 'agent_assisted',
      to: 'agent_autonomous',
      checks: [
        // spec_requirements
        { category: 'spec', description: 'Complete step-by-step descriptions for all operations', required: true, automated: false },
        { category: 'spec', description: 'ALL references resolve to existing blocks', required: true, automated: true },
        { category: 'spec', description: 'No ambiguous natural language in critical sections', required: true, automated: false },
        { category: 'spec', description: 'All required metadata fields present', required: true, automated: true },
        // validation_requirements
        { category: 'validation', description: 'Pass autonomous validation (@ref:speclang/autonomous-validation)', required: true, automated: true },
        { category: 'validation', description: 'No validation warnings', required: true, automated: true },
        // test_requirements
        { category: 'test', description: 'Tests exist for all functionality', required: true, automated: true },
        { category: 'test', description: 'Tests pass consistently', required: true, automated: true },
        { category: 'test', description: 'Edge cases covered', required: true, automated: false },
        // safety_requirements
        { category: 'safety', description: 'Rollback procedure defined', required: true, automated: false },
        { category: 'safety', description: 'Monitoring configured', required: true, automated: true },
        { category: 'safety', description: 'Alerting configured', required: true, automated: true },
        { category: 'safety', description: 'Human override mechanism in place', required: true, automated: false },
        // approval_required
        { category: 'approval', description: 'Autonomous readiness review', required: true, automated: false },
        { category: 'approval', description: 'Safety review', required: true, automated: false },
        { category: 'approval', description: 'Human oversight plan approved', required: true, automated: false },
        // automated_checks
        { category: 'automated', description: 'Autonomous validation passes', required: true, automated: true },
        { category: 'automated', description: 'All tests pass', required: true, automated: true },
        { category: 'automated', description: 'Code generation produces correct output', required: true, automated: true },
        { category: 'automated', description: 'Rollback works', required: true, automated: true },
      ]
    },
  };
}