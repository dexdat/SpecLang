import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior, ParsedSpecMetadata } from '../types';

export const MVP_LEVEL: LevelDefinition = {
  name: 'MVP',
  order: 1,
  displayName: 'Minimum Viable Product',
  description: 'Core functionality validated - Early adopters can use',
  criteria: {
    documentation: 'usable',
    testing: 'basic',
    deployment: 'internal',
    stability: 'changing'
  } as LevelCriteria,
  agentBehavior: {
    mode: 'assisted_with_review',
    humanOversight: 'major_changes',
    cascadeDepth: 2,
    autoDeploy: false,
    generationEnabled: true,
    reviewRequired: true
  } as AgentBehavior,
  requiredFields: ['id', 'version', 'tags', 'short'],
  recommendedFields: ['layer', 'description', 'target'],
  optionalFields: ['status', 'depends_on', 'next_steps'],
  recommendedTests: ['unit'],
  allowedTargets: ['internal', 'staging'],
  constraints: {
    maxSpecs: 50,
    maxLayers: 4,
    allowGenerated: true,
    allowAutoDeploy: false,
    requireMinimalTests: false
  }
};

export const MVP_CRITERIA = {
  documentation: {
    level: 'usable',
    description: 'Documentation sufficient for understanding and use',
    requirements: [
      'ID, version, tags, short required',
      'Description recommended',
      'Block definitions should be present',
      'Enough detail for early adopters'
    ]
  },
  testing: {
    level: 'basic',
    description: 'Basic test coverage for core functionality',
    requirements: [
      'Unit tests recommended for core functions',
      'No comprehensive coverage required',
      'Manual testing acceptable',
      'Test specs optional but encouraged'
    ]
  },
  deployment: {
    level: 'internal',
    description: 'Internal deployment for team testing',
    requirements: [
      'Internal deployment target allowed',
      'Staging deployment allowed',
      'No production deployment',
      'Basic infrastructure acceptable'
    ]
  },
  stability: {
    level: 'changing',
    description: 'APIs and structure may change',
    requirements: [
      'Breaking changes acceptable',
      'Version handling not required',
      'Minimal backward compatibility',
      'Rapid iteration supported'
    ]
  }
};

export function isMVPLevel(level: string): boolean {
  return level === 'MVP';
}

export function createMVPSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'MVP',
    agent_support: 'agent_assisted',
    layer: 1
  };
}