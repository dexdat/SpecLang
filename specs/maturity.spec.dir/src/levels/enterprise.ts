/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/maturity.spec.dir/levels/enterprise.spec.md
 * Generated: 2026-03-21T00:00:00.000Z
 * 
 * Edit the spec, not this file.
 */
import { MaturityLevel, LevelDefinition, LevelCriteria, AgentBehavior, ParsedSpecMetadata } from '../types';

export const ENTERPRISE_LEVEL: LevelDefinition = {
  name: 'Enterprise',
  order: 9,
  displayName: 'Enterprise',
  description: 'Maximum scale, strict governance, high availability',
  criteria: {
    documentation: 'complete',
    testing: 'comprehensive',
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
  requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'agent_support', 'compliance', 'audit', 'governance'],
  recommendedFields: ['description', 'target', 'depends_on', 'sla', 'monitoring'],
  optionalFields: ['next_steps', 'security', 'disaster_recovery'],
  recommendedTests: ['unit', 'integration', 'e2e', 'performance', 'security', 'load'],
  allowedTargets: ['production'],
  constraints: {
    maxSpecs: 10000,
    maxLayers: 10,
    allowGenerated: true,
    allowAutoDeploy: true,
    requireMinimalTests: true,
    requireCompliance: true,
    requireAudit: true
  }
};

export const ENTERPRISE_CRITERIA = {
  documentation: {
    level: 'complete',
    description: 'Full enterprise documentation suite',
    requirements: [
      'ID, version, layer, tags, short required',
      'Status field required',
      'Comprehensive description',
      'Complete block definitions',
      'Full architecture documentation',
      'Complete API documentation',
      'User documentation',
      'Developer documentation',
      'Operational runbooks',
      'Disaster recovery procedures',
      'Compliance documentation',
      'Security documentation',
      'Governance guidelines'
    ]
  },
  testing: {
    level: 'comprehensive',
    description: 'Full test suite with enterprise requirements',
    requirements: [
      'Unit tests for all functions',
      'Integration tests for all interactions',
      'End-to-end tests for all flows',
      'Test coverage > 95%',
      'Performance tests for all critical paths',
      'Security tests for all entry points',
      'Load tests for scalability',
      'Penetration testing',
      'Compliance testing',
      'Disaster recovery testing'
    ]
  },
  deployment: {
    level: 'production',
    description: 'Production deployment with enterprise features',
    requirements: [
      'Production deployment target configured',
      'Multi-region deployment',
      'Infrastructure fully automated',
      'Deployment pipeline with approvals',
      'Rollback capability verified',
      'Monitoring and alerting in place',
      'Disaster recovery procedures tested',
      'SLA defined and monitored',
      '99.99%+ availability target',
      'Global CDN configuration'
    ]
  },
  stability: {
    level: 'hardened',
    description: 'Maximum stability for enterprise workloads',
    requirements: [
      'Breaking changes prohibited without major version',
      'Strict version handling',
      'Backward compatibility guaranteed',
      'Comprehensive change documentation',
      'Deprecation notices with migration paths',
      'Performance expectations documented and monitored',
      'Security patches process defined',
      'Zero-downtime deployment',
      'Circuit breakers',
      'Rate limiting'
    ]
  },
  teamCharacteristics: {
    teamSize: '1000+ people',
    decisionCycles: 'Formal processes',
    documentation: 'Comprehensive',
    autonomy: 'Governed autonomy',
    focus: 'Reliability, compliance, scale'
  },
  compliance: {
    frameworks: ['SOC2', 'GDPR', 'HIPAA', 'ISO27001', 'PCI-DSS'],
    requirements: [
      'Security compliance verified',
      'Data privacy compliance',
      'Audit logging enabled',
      'Access controls enforced',
      'Encryption at rest',
      'Encryption in transit',
      'Compliance reporting',
      'Regular security audits'
    ]
  },
  monitoring: {
    observability: [
      'Full logging',
      'Metrics collection',
      'Distributed tracing',
      'Alerting on anomalies',
      'SLA monitoring',
      'Performance monitoring',
      'Security monitoring'
    ],
    incidentResponse: [
      'On-call rotation',
      'Incident response plan',
      'Escalation procedures',
      'Post-mortem process',
      'Continuous improvement'
    ]
  }
};

export function isEnterpriseLevel(level: string): boolean {
  return level === 'Enterprise';
}

export function createEnterpriseSpecDefaults(): Partial<ParsedSpecMetadata> {
  return {
    project_level: 'Enterprise',
    agent_support: 'agent_autonomous',
    status: 'active',
    layer: 8,
    compliance: 'SOC2',
    audit: 'enabled',
    governance: 'strict'
  };
}
