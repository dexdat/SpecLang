// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.dir/levels.spec.md

import { describe, it, expect } from 'vitest';
import {
  MATURITY_LEVELS,
  getLevelDefinition,
  getLevelOrder,
  getAllLevels,
  getLevelByOrder,
  isValidTransition,
  getNextLevel,
  getPreviousLevel
} from '../../src/maturity/levels';

describe('Maturity Levels', () => {
  describe('MATURITY_LEVELS', () => {
    it('should have 9 levels defined', () => {
      expect(MATURITY_LEVELS.length).toBe(9);
    });
    
    it('should have correct order values', () => {
      MATURITY_LEVELS.forEach((level, index) => {
        expect(level.order).toBe(index);
      });
    });
    
    it('should have unique names', () => {
      const names = MATURITY_LEVELS.map(l => l.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });
  });
  
  describe('getLevelDefinition', () => {
    it('should return POC definition', () => {
      const poc = getLevelDefinition('POC');
      expect(poc).toBeDefined();
      expect(poc?.name).toBe('POC');
      expect(poc?.order).toBe(0);
    });
    
    it('should return Production definition', () => {
      const prod = getLevelDefinition('Production');
      expect(prod).toBeDefined();
      expect(prod?.name).toBe('Production');
      expect(prod?.order).toBe(4);
    });
    
    it('should return Enterprise definition', () => {
      const ent = getLevelDefinition('Enterprise');
      expect(ent).toBeDefined();
      expect(ent?.name).toBe('Enterprise');
      expect(ent?.order).toBe(8);
    });
    
    it('should return undefined for invalid level', () => {
      const invalid = getLevelDefinition('INVALID' as any);
      expect(invalid).toBeUndefined();
    });
  });
  
  describe('getLevelOrder', () => {
    it('should return correct order for POC', () => {
      expect(getLevelOrder('POC')).toBe(0);
    });
    
    it('should return correct order for Beta', () => {
      expect(getLevelOrder('Beta')).toBe(3);
    });
    
    it('should return 0 for unknown level', () => {
      expect(getLevelOrder('UNKNOWN' as any)).toBe(0);
    });
  });
  
  describe('getAllLevels', () => {
    it('should return all level names in order', () => {
      const levels = getAllLevels();
      expect(levels).toEqual([
        'POC', 'MVP', 'Alpha', 'Beta', 'Production', 
        'Startup', 'SMB', 'MSB', 'Enterprise'
      ]);
    });
  });
  
  describe('getLevelByOrder', () => {
    it('should return level by order 0', () => {
      const level = getLevelByOrder(0);
      expect(level?.name).toBe('POC');
    });
    
    it('should return level by order 4', () => {
      const level = getLevelByOrder(4);
      expect(level?.name).toBe('Production');
    });
    
    it('should return undefined for invalid order', () => {
      expect(getLevelByOrder(100)).toBeUndefined();
    });
  });
  
  describe('isValidTransition', () => {
    it('should allow POC to MVP', () => {
      expect(isValidTransition('POC', 'MVP')).toBe(true);
    });
    
    it('should allow Alpha to Beta', () => {
      expect(isValidTransition('Alpha', 'Beta')).toBe(true);
    });
    
    it('should allow Beta to Production', () => {
      expect(isValidTransition('Beta', 'Production')).toBe(true);
    });
    
    it('should allow Production to Startup', () => {
      expect(isValidTransition('Production', 'Startup')).toBe(true);
    });
    
    it('should not allow skipping levels', () => {
      expect(isValidTransition('POC', 'Beta')).toBe(false);
      expect(isValidTransition('Alpha', 'Enterprise')).toBe(false);
    });
    
    it('should not allow going backwards', () => {
      expect(isValidTransition('Production', 'Beta')).toBe(false);
    });
    
    it('should not allow same level', () => {
      expect(isValidTransition('POC', 'POC')).toBe(false);
    });
  });
  
  describe('getNextLevel', () => {
    it('should return MVP for POC', () => {
      expect(getNextLevel('POC')).toBe('MVP');
    });
    
    it('should return Alpha for MVP', () => {
      expect(getNextLevel('MVP')).toBe('Alpha');
    });
    
    it('should return null for Enterprise', () => {
      expect(getNextLevel('Enterprise')).toBeNull();
    });
  });
  
  describe('getPreviousLevel', () => {
    it('should return POC for MVP', () => {
      expect(getPreviousLevel('MVP')).toBe('POC');
    });
    
    it('should return null for POC', () => {
      expect(getPreviousLevel('POC')).toBeNull();
    });
  });
  
  describe('Level Criteria', () => {
    it('POC should have minimal requirements', () => {
      const poc = getLevelDefinition('POC');
      expect(poc?.requiredFields).toContain('id');
      expect(poc?.requiredFields).toContain('version');
      expect(poc?.requiredFields.length).toBe(2);
    });
    
    it('Alpha should have medium requirements', () => {
      const alpha = getLevelDefinition('Alpha');
      expect(alpha?.requiredFields).toContain('layer');
      expect(alpha?.requiredFields).toContain('status');
    });
    
    it('Enterprise should have maximum requirements', () => {
      const ent = getLevelDefinition('Enterprise');
      expect(ent?.requiredFields).toContain('governance');
      expect(ent?.requiredFields).toContain('compliance');
      expect(ent?.requiredFields).toContain('audit');
    });
  });
  
  describe('Agent Behavior', () => {
    it('POC should require human confirmation', () => {
      const poc = getLevelDefinition('POC');
      expect(poc?.agentBehavior.mode).toBe('confirm_each_step');
      expect(poc?.agentBehavior.humanOversight).toBe('always');
      expect(poc?.agentBehavior.autoDeploy).toBe(false);
    });
    
    it('Production should allow full autonomy', () => {
      const prod = getLevelDefinition('Production');
      expect(prod?.agentBehavior.mode).toBe('fully_autonomous');
      expect(prod?.agentBehavior.autoDeploy).toBe(true);
    });
  });
});
