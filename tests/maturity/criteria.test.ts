// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.dir/criteria.spec.md

import { describe, it, expect } from 'bun:test';
import { CriteriaChecker } from '../../src/maturity/criteria';
import { ParsedSpec } from '../../src/maturity/types';

describe('Criteria Checker', () => {
  const checker = new CriteriaChecker();
  
  describe('checkLevel', () => {
    it('should pass POC with minimal spec', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0'
        }
      };
      
      const result = checker.checkLevel(spec, 'POC');
      expect(result.meetsCriteria).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
    
    it('should fail Alpha without required fields', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0'
        }
      };
      
      const result = checker.checkLevel(spec, 'Alpha');
      expect(result.meetsCriteria).toBe(false);
      expect(result.missing).toContain('Missing required field: layer');
      expect(result.missing).toContain('Missing required field: tags');
      expect(result.missing).toContain('Missing required field: short');
      expect(result.missing).toContain('Missing required field: status');
    });
    
    it('should pass Alpha with all required fields', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          layer: 5,
          tags: ['test'],
          short: 'Test spec',
          status: 'active'
        }
      };
      
      const result = checker.checkLevel(spec, 'Alpha');
      expect(result.meetsCriteria).toBe(true);
    });
    
    it('should fail Production without agent_support', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          layer: 5,
          tags: ['test'],
          short: 'Test spec',
          status: 'active',
          project_level: 'Production'
        }
      };
      
      const result = checker.checkLevel(spec, 'Production');
      expect(result.meetsCriteria).toBe(false);
      expect(result.missing).toContain('Missing required field: agent_support');
    });
    
    it('should warn about missing recommended tests', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          layer: 5,
          tags: ['test'],
          short: 'Test spec',
          status: 'active',
          project_level: 'Beta'
        },
        testCoverage: {
          unit: true
        }
      };
      
      const result = checker.checkLevel(spec, 'Beta');
      expect(result.warnings).toContain('Missing recommended test: integration');
      expect(result.warnings).toContain('Missing recommended test: e2e');
    });
    
    it('should pass Beta with all tests', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          layer: 5,
          tags: ['test'],
          short: 'Test spec',
          status: 'active',
          project_level: 'Beta'
        },
        testCoverage: {
          unit: true,
          integration: true,
          e2e: true
        }
      };
      
      const result = checker.checkLevel(spec, 'Beta');
      expect(result.meetsCriteria).toBe(true);
    });
    
    it('should require compliance fields for Enterprise', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          layer: 5,
          tags: ['test'],
          short: 'Test spec',
          status: 'active',
          project_level: 'Enterprise',
          agent_support: 'agent_autonomous'
        },
        testCoverage: {
          unit: true,
          integration: true,
          e2e: true,
          security: true,
          compliance: true,
          performance: true,
          chaos: true
        }
      };
      
      const result = checker.checkLevel(spec, 'Enterprise');
      expect(result.missing).toContain('Missing required field: compliance');
      expect(result.missing).toContain('Missing required field: audit');
      expect(result.missing).toContain('Missing required field: governance');
    });
    
    it('should pass Enterprise with all fields', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          layer: 5,
          tags: ['test'],
          short: 'Test spec',
          status: 'active',
          project_level: 'Enterprise',
          agent_support: 'agent_autonomous',
          compliance: 'SOC2',
          audit: 'quarterly',
          governance: 'board'
        },
        testCoverage: {
          unit: true,
          integration: true,
          e2e: true,
          security: true,
          compliance: true,
          performance: true,
          chaos: true
        }
      };
      
      const result = checker.checkLevel(spec, 'Enterprise');
      expect(result.meetsCriteria).toBe(true);
    });
  });
  
  describe('suggestLevel', () => {
    it('should suggest POC for minimal spec', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0'
        }
      };
      
      expect(checker.suggestLevel(spec)).toBe('POC');
    });
    
    it('should suggest Alpha for spec with layer', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          layer: 5,
          tags: ['test'],
          short: 'Test',
          status: 'active'
        }
      };
      
      expect(checker.suggestLevel(spec)).toBe('Alpha');
    });
    
    it('should suggest highest qualified level', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          layer: 5,
          tags: ['test'],
          short: 'Test',
          status: 'active',
          project_level: 'Startup',
          agent_support: 'agent_autonomous'
        },
        testCoverage: {
          unit: true,
          integration: true
        }
      };
      
      expect(checker.suggestLevel(spec)).toBe('Startup');
    });
  });
  
  describe('getQualifiedLevels', () => {
    it('should return multiple qualified levels', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0'
        }
      };
      
      const levels = checker.getQualifiedLevels(spec);
      expect(levels).toContain('POC');
    });
  });
});
