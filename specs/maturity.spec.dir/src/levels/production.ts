/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/production.spec.md
 * Generated: 2026-03-20T19:00:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior, ParsedSpecMetadata } from '../types';

export const PRODUCTION_LEVEL: LevelDefinition = {
  name: 'Production',
  order: 4,
  displayName: 'Production',
  description: 'Production-ready, supported',
  criteria: {
    documentation: 'complete',
    testing: 'full',
    deployment: 'production',
    stability: 'hardened'
  } as LevelCriteria,
  agentBehavior: {
    mode: 'fully_autonomous',
    humanOversight: 'emergencies',
    cascadeDepth: 10,
    autoDeploy: true,
    generationEnabled: true,
    reviewRequired: false
  } as AgentBehavior,
  requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'agent_support'],
  recommendedFields: ['description', 'target', 'depends_on'],
  optionalFields: ['next_steps', 'compliance', 'audit', 'governance'],
  recommendedTests: ['unit', 'integration', 'e2e', 'performance'],
  allowedTargets: ['production'],
  constraints: {
    maxSpecs: 1000,
    maxLayers: 10,
    allowGenerated: true,
    allowAutoDeploy: true,
    requireMinimalTests: true
  }
};

export const PRODUCTION_CRITERIA = {
  documentation: {
    level: 'complete',
    description: 'Documentation complete for production use',
    requirements: [
      'ID, version, layer, tags, short required',
      'Status field required (active, deprecated, etc.)',
      'Description required',
      'Block definitions must be present',
      'Architecture overview required',
      'API documentation required',
      'User documentation required',
      'Operational runbooks available'
    ]
  },
  testing: {
    level: 'full',
    description: 'Full test coverage for all features',
    requirements: [
      'Unit tests for all functions',
      'Integration tests for all component interactions',
      'End-to-end tests for all critical flows',
      'Test coverage > 90%',
      'Performance tests for all critical paths',
      'Security tests for all entry points',
      'Load tests for scalability validation'
    ]
  },
  deployment: {
    level: 'production',
    description: 'Production deployment ready',
    requirements: [
      'Production deployment target configured',
      'Infrastructure fully automated',
      'Deployment pipeline mature',
      'Rollback capability verified',
      'Monitoring and alerting in place',
      'Disaster recovery procedures tested',
      'SLA defined and monitored'
    ]
  },
  stability: {
    level: 'hardened',
    description: 'APIs and structure hardened for production',
    requirements: [
      'Breaking changes prohibited without major version',
      'Version handling required',
      'Backward compatibility guaranteed',
      'Change documentation required',
      'Deprecation notices provided with migration paths',
      'Performance expectations documented and monitored',
      'Security patches process defined'
    ]
  }
};

export function isProductionLevel(level: string): boolean {
  return level === 'Production';
}

export function createProductionSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'Production',
    agent_support: 'agent_autonomous',
    status: 'active',
    layer: 4
  };
}