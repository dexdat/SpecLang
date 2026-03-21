/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/startup.spec.md
 * Generated: 2026-03-21T00:00:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior, ParsedSpecMetadata } from '../types';

export const STARTUP_LEVEL: LevelDefinition = {
  name: 'Startup',
  order: 5,
  displayName: 'Startup',
  description: 'Small team, rapid iteration focus',
  criteria: {
    documentation: 'usable',
    testing: 'growing',
    deployment: 'beta',
    stability: 'changing'
  } as LevelCriteria,
  agentBehavior: {
    mode: 'fully_autonomous',
    humanOversight: 'major_changes',
    cascadeDepth: 8,
    autoDeploy: true,
    generationEnabled: true,
    reviewRequired: false
  } as AgentBehavior,
  requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level'],
  recommendedFields: ['description', 'target', 'depends_on', 'agent_support'],
  optionalFields: ['next_steps', 'compliance'],
  recommendedTests: ['unit', 'integration'],
  allowedTargets: ['development', 'staging', 'production'],
  constraints: {
    maxSpecs: 500,
    maxLayers: 8,
    allowGenerated: true,
    allowAutoDeploy: true,
    requireMinimalTests: false
  }
};

export const STARTUP_CRITERIA = {
  documentation: {
    level: 'usable',
    description: 'Lean documentation for rapid iteration',
    requirements: [
      'ID, version, layer, tags, short required',
      'Status field required',
      'Short description required',
      'Core feature documentation',
      'Basic API docs',
      'README with quick start'
    ]
  },
  testing: {
    level: 'growing',
    description: 'Focus on testing critical paths',
    requirements: [
      'Unit tests for critical functions',
      'Integration tests for key workflows',
      'Test coverage > 60%',
      'Test specs for core features',
      'Manual testing for edge cases'
    ]
  },
  deployment: {
    level: 'beta',
    description: 'Flexible deployment for rapid iteration',
    requirements: [
      'Deployment targets available',
      'Infrastructure can be automated',
      'Deployment pipeline exists',
      'Rollback capability exists',
      'Flexible scaling'
    ]
  },
  stability: {
    level: 'changing',
    description: 'Rapid iteration with changing APIs',
    requirements: [
      'Breaking changes allowed with notice',
      'Version handling exists',
      'Change tracking in place',
      'Quick iteration cycles',
      'Feedback loops active'
    ]
  },
  teamCharacteristics: {
    teamSize: '< 10 people',
    decisionCycles: 'Fast (daily or faster)',
    documentation: 'Lean but functional',
    autonomy: 'High developer autonomy',
    focus: 'Growth metrics and speed'
  }
};

export function isStartupLevel(level: string): boolean {
  return level === 'Startup';
}

export function createStartupSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'Startup',
    agent_support: 'agent_autonomous',
    status: 'active',
    layer: 4
  };
}
