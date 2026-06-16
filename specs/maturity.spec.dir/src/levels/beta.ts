/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/beta.spec.md
 * Generated: 2026-03-20T18:30:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior, ParsedSpecMetadata } from '../types';

export const BETA_LEVEL: LevelDefinition = {
  name: 'Beta',
  order: 3,
  displayName: 'Beta',
  description: 'External Testing - Feature complete, stability focus',
  criteria: {
    documentation: 'complete',
    testing: 'comprehensive',
    deployment: 'beta',
    stability: 'stable'
  } as LevelCriteria,
  agentBehavior: {
    mode: 'autonomous_non_critical',
    humanOversight: 'critical_only',
    cascadeDepth: 5,
    autoDeploy: false,
    generationEnabled: true,
    reviewRequired: false
  } as AgentBehavior,
  requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level'],
  recommendedFields: ['description', 'target', 'depends_on'],
  optionalFields: ['project_level', 'agent_support', 'next_steps'],
  recommendedTests: ['unit', 'integration', 'e2e'],
  allowedTargets: ['beta', 'staging', 'production'],
  constraints: {
    maxSpecs: 200,
    maxLayers: 6,
    allowGenerated: true,
    allowAutoDeploy: false,
    requireMinimalTests: true
  }
};

export const BETA_CRITERIA = {
  documentation: {
    level: 'complete',
    description: 'Documentation complete for external testers',
    requirements: [
      'ID, version, layer, tags, short required',
      'Status field required (active, deprecated, etc.)',
      'Description required',
      'Block definitions must be present',
      'Architecture overview required',
      'API documentation required',
      'User documentation available'
    ]
  },
  testing: {
    level: 'comprehensive',
    description: 'Comprehensive test coverage for all features',
    requirements: [
      'Unit tests for all functions',
      'Integration tests for component interactions',
      'End-to-end tests for critical flows',
      'Test coverage > 80%',
      'Test specs for all major features',
      'Performance tests for critical paths'
    ]
  },
  deployment: {
    level: 'beta',
    description: 'Beta deployment for external testing',
    requirements: [
      'Beta deployment target configured',
      'Staging deployment available',
      'Production deployment possible but not required',
      'Infrastructure automated',
      'Deployment pipeline mature',
      'Rollback capability verified'
    ]
  },
  stability: {
    level: 'stable',
    description: 'APIs and structure stable for external testing',
    requirements: [
      'Breaking changes rare and documented',
      'Version handling required',
      'Backward compatibility expected',
      'Change documentation required',
      'Deprecation notices provided',
      'Performance expectations defined'
    ]
  }
};

export function isBetaLevel(level: string): boolean {
  return level === 'Beta';
}

export function createBetaSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'Beta',
    agent_support: 'agent_autonomous',
    status: 'active',
    layer: 3
  };
}