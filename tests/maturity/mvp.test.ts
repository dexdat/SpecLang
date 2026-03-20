import { describe, it, expect } from 'vitest';
import { MVP_LEVEL, MVP_CRITERIA, isMVPLevel, createMVPSpecDefaults } from '../../src/maturity/levels/mvp';

describe('MVP Level', () => {
  it('should have correct properties', () => {
    expect(MVP_LEVEL.name).toBe('MVP');
    expect(MVP_LEVEL.order).toBe(1);
    expect(MVP_LEVEL.description).toBe('Core functionality validated - Early adopters can use');
    expect(MVP_LEVEL.criteria.documentation).toBe('usable');
    expect(MVP_LEVEL.criteria.testing).toBe('basic');
    expect(MVP_LEVEL.criteria.deployment).toBe('internal');
    expect(MVP_LEVEL.criteria.stability).toBe('changing');
    expect(MVP_LEVEL.requiredFields).toEqual(['id', 'version', 'tags', 'short']);
    expect(MVP_LEVEL.recommendedTests).toEqual(['unit']);
  });

  it('should have MVP criteria', () => {
    expect(MVP_CRITERIA.documentation.level).toBe('usable');
    expect(MVP_CRITERIA.testing.level).toBe('basic');
    expect(MVP_CRITERIA.deployment.level).toBe('internal');
    expect(MVP_CRITERIA.stability.level).toBe('changing');
  });

  it('should identify MVP level', () => {
    expect(isMVPLevel('MVP')).toBe(true);
    expect(isMVPLevel('POC')).toBe(false);
    expect(isMVPLevel('Alpha')).toBe(false);
  });

  it('should create spec defaults', () => {
    const defaults = createMVPSpecDefaults();
    expect(defaults.project_level).toBe('MVP');
    expect(defaults.agent_support).toBe('agent_assisted');
    expect(defaults.layer).toBe(1);
  });
});