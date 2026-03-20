/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/alpha.spec.md
 * Generated: 2026-03-20T18:07:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior, ParsedSpecMetadata } from '../types';

export const ALPHA_LEVEL: LevelDefinition = {
  name: 'Alpha',
  order: 2,
  displayName: 'Alpha',
  description: 'Internal Testing - Incomplete features, internal use',
  criteria: {
    documentation: 'improving',
    testing: 'growing',
    deployment: 'internal',
    stability: 'changing'
  } as LevelCriteria,
  agentBehavior: {
    mode: 'assisted_with_review',
    humanOversight: 'major_changes',
    cascadeDepth: 3,
    autoDeploy: false,
    generationEnabled: true,
    reviewRequired: true
  } as AgentBehavior,
  requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status'],
  recommendedFields: ['description', 'target', 'depends_on'],
  optionalFields: ['project_level', 'agent_support', 'next_steps'],
  recommendedTests: ['unit', 'integration'],
  allowedTargets: ['internal', 'staging'],
  constraints: {
    maxSpecs: 100,
    maxLayers: 5,
    allowGenerated: true,
    allowAutoDeploy: false,
    requireMinimalTests: true
  }
};

export const ALPHA_CRITERIA = {
  documentation: {
    level: 'improving',
    description: 'Documentation being improved for internal use',
    requirements: [
      'ID, version, layer, tags, short required',
      'Status field required (active, deprecated, etc.)',
      'Description recommended',
      'Block definitions should be present',
      'Architecture overview recommended',
      'API documentation encouraged'
    ]
  },
  testing: {
    level: 'growing',
    description: 'Test coverage growing for core features',
    requirements: [
      'Unit tests for core functions',
      'Integration tests recommended',
      'Test coverage increasing',
      'Test specs encouraged',
      'Manual testing still acceptable for edge cases'
    ]
  },
  deployment: {
    level: 'internal',
    description: 'Internal deployment for team testing',
    requirements: [
      'Internal deployment target allowed',
      'Staging deployment allowed',
      'No production deployment',
      'Basic infrastructure in place',
      'Deployment automation starting'
    ]
  },
  stability: {
    level: 'evolving',
    description: 'APIs and structure evolving with feedback',
    requirements: [
      'Breaking changes less common',
      'Version handling recommended',
      'Some backward compatibility preferred',
      'Change documentation encouraged',
      'Rapid iteration continuing'
    ]
  }
};

export function isAlphaLevel(level: string): boolean {
  return level === 'Alpha';
}

export function createAlphaSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'Alpha',
    agent_support: 'agent_assisted',
    status: 'active',
    layer: 2
  };
}
