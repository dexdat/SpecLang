// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.dir/criteria.spec.md

import { describe, it, expect } from 'bun:test';
import { TransitionManager } from '../../src/maturity/transitions';
import { ParsedSpec } from '../../src/maturity/types';

describe('Transition Manager', () => {
  const manager = new TransitionManager();
  
  describe('canTransition', () => {
    it('should return checklist for valid transition', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          project_level: 'POC'
        }
      };
      
      const checklist = manager.getChecklist('POC', 'MVP');
      expect(checklist).toBeDefined();
      expect(checklist?.from).toBe('POC');
      expect(checklist?.to).toBe('MVP');
    });
    
    it('should block skipping levels', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          project_level: 'POC'
        }
      };
      
      const result = manager.canTransition(spec, 'Beta');
      expect(result.canTransition).toBe(false);
      expect(result.reason).toContain('Invalid transition');
    });
    
    it('should block backwards transition', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          project_level: 'Beta'
        }
      };
      
      const result = manager.canTransition(spec, 'Alpha');
      expect(result.canTransition).toBe(false);
    });
    
    it('should require checklist checks', () => {
      const spec: ParsedSpec = {
        metadata: {
          id: '@specs/test',
          version: '1.0.0',
          project_level: 'Alpha',
          short: 'Test spec'
        }
      };
      
      const result = manager.canTransition(spec, 'Beta');
      // Should have checks that need to pass
      expect(result.results).toBeDefined();
    });
  });
  
  describe('getChecklist', () => {
    it('should return checklist for valid transition', () => {
      const checklist = manager.getChecklist('Alpha', 'Beta');
      expect(checklist).toBeDefined();
      expect(checklist?.from).toBe('Alpha');
      expect(checklist?.to).toBe('Beta');
    });
    
    it('should return null for invalid transition', () => {
      const checklist = manager.getChecklist('POC', 'Beta');
      expect(checklist).toBeNull();
    });
  });
  
  describe('getAvailableTransitions', () => {
    it('should return available transitions from POC', () => {
      const transitions = manager.getAvailableTransitions('POC');
      expect(transitions).toContain('MVP');
    });
    
    it('should return available transitions from Alpha', () => {
      const transitions = manager.getAvailableTransitions('Alpha');
      expect(transitions).toContain('Beta');
    });
    
    it('should return empty for Enterprise', () => {
      const transitions = manager.getAvailableTransitions('Enterprise');
      expect(transitions).toHaveLength(0);
    });
  });
  
  describe('getTransitionPath', () => {
    it('should return path from POC to MVP', () => {
      const path = manager.getTransitionPath('POC', 'MVP');
      expect(path).toEqual(['POC', 'MVP']);
    });
    
    it('should return path from POC to Beta', () => {
      const path = manager.getTransitionPath('POC', 'Beta');
      expect(path).toContain('POC');
      expect(path).toContain('MVP');
      expect(path).toContain('Alpha');
      expect(path).toContain('Beta');
    });
  });
  
  describe('Transition checklists', () => {
    it('should have Alpha to Beta checklist', () => {
      const checklist = manager.getChecklist('Alpha', 'Beta');
      expect(checklist?.checks.length).toBeGreaterThan(0);
      
      // Should have documentation, testing, review, and deployment checks
      const categories = checklist?.checks.map(c => c.category) || [];
      expect(categories).toContain('documentation');
      expect(categories).toContain('testing');
      expect(categories).toContain('review');
      expect(categories).toContain('deployment');
    });
    
    it('should have Beta to Production checklist', () => {
      const checklist = manager.getChecklist('Beta', 'Production');
      expect(checklist?.checks.length).toBeGreaterThan(0);
      
      // Should have security review requirement
      const securityCheck = checklist?.checks.find(
        c => c.description.toLowerCase().includes('security')
      );
      expect(securityCheck).toBeDefined();
    });
  });
});
