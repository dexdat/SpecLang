import { describe, it, expect } from 'vitest';
import {
  DeploymentMode,
  MODE_SELECTION,
  MODE_RECOMMENDATION,
  FEATURE_COMPARISON,
  PERFORMANCE_METRICS,
} from '../src/deployment/modes.js';
import { DeploymentModeSwitcher } from '../src/deployment/switcher.js';
import { LightModeService } from '../src/deployment/light.js';
import { EnterpriseModeService } from '../src/deployment/enterprise.js';

describe('Deployment Modes', () => {
  describe('Mode Definitions', () => {
    it('should have valid deployment modes', () => {
      // DeploymentMode is a type, not a value
      expect(typeof DeploymentMode).toBe('object');
    });
    
    it('should have mode selection criteria', () => {
      expect(MODE_SELECTION.command).toBeDefined();
      expect(MODE_SELECTION.light).toBeDefined();
      expect(MODE_SELECTION.enterprise).toBeDefined();
    });
    
    it('should have mode recommendations', () => {
      expect(MODE_RECOMMENDATION.light).toBeDefined();
      expect(MODE_RECOMMENDATION.enterprise).toBeDefined();
    });
    
    it('should have feature comparison', () => {
      expect(FEATURE_COMPARISON.light).toBeDefined();
      expect(FEATURE_COMPARISON.enterprise).toBeDefined();
    });
    
    it('should have performance metrics', () => {
      expect(PERFORMANCE_METRICS.light).toBeDefined();
      expect(PERFORMANCE_METRICS.enterprise).toBeDefined();
    });
  });
  
  describe('Mode Switcher', () => {
    it('should create switcher instance', async () => {
      const switcher = new DeploymentModeSwitcher();
      expect(switcher).toBeInstanceOf(DeploymentModeSwitcher);
      const currentMode = switcher.getCurrentMode();
      expect(currentMode).toBe('light'); // default
    });
    
    it('should switch to enterprise mode', async () => {
      const switcher = new DeploymentModeSwitcher();
      const result = await switcher.switchMode('enterprise');
      expect(result.success).toBe(true);
      expect(switcher.getCurrentMode()).toBe('enterprise');
    });
    
    it('should validate mode', async () => {
      const switcher = new DeploymentModeSwitcher();
      const valid = await switcher.validateMode('light');
      expect(valid).toBe(true);
    });
  });
  
  describe('Light Mode Service', () => {
    it('should create light mode service', () => {
      const service = new LightModeService();
      expect(service).toBeInstanceOf(LightModeService);
    });
    
    it('should get light mode definition', () => {
      const service = new LightModeService();
      const mode = service.getMode();
      expect(mode).toBeDefined();
    });
    
    it('should get performance metrics', () => {
      const service = new LightModeService();
      const perf = service.getPerformance();
      expect(perf).toBeDefined();
    });
  });
  
  describe('Enterprise Mode Service', () => {
    it('should create enterprise mode service', () => {
      const service = new EnterpriseModeService();
      expect(service).toBeInstanceOf(EnterpriseModeService);
    });
    
    it('should get enterprise mode definition', () => {
      const service = new EnterpriseModeService();
      const mode = service.getMode();
      expect(mode).toBeDefined();
    });
    
    it('should get performance metrics', () => {
      const service = new EnterpriseModeService();
      const perf = service.getPerformance();
      expect(perf).toBeDefined();
    });
  });
});