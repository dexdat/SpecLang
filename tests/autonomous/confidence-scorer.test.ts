/**
 * Test confidence scorer
 */
import { describe, it, expect } from 'vitest';
import { 
  ConfidenceScorer, 
  ConfidenceLevel, 
  PROJECT_LEVEL_THRESHOLDS,
  SIGNAL_SOURCE_WEIGHTS 
} from '../../src/safety-confidence/confidence-scorer.js';

describe('ConfidenceScorer', () => {
  describe('constructor', () => {
    it('should create scorer with correct project level', () => {
      const scorer = new ConfidenceScorer('Alpha');
      expect(scorer.getProjectLevel()).toBe('Alpha');
    });

    it('should default to MVP for unknown project level', () => {
      const scorer = new ConfidenceScorer('Unknown');
      expect(scorer.getProjectLevel()).toBe('Unknown');
    });
  });

  describe('thresholds', () => {
    it('should have correct thresholds for POC', () => {
      const scorer = new ConfidenceScorer('POC');
      const thresholds = scorer.getThresholds();
      expect(thresholds.proceed).toBe(0.9);
      expect(thresholds.fallback).toBe(0.6);
      expect(thresholds.abort).toBe(0.3);
    });

    it('should have correct thresholds for Enterprise', () => {
      const scorer = new ConfidenceScorer('Enterprise');
      const thresholds = scorer.getThresholds();
      expect(thresholds.proceed).toBe(0.7);
      expect(thresholds.fallback).toBe(0.8);
      expect(thresholds.abort).toBe(0.5);
    });

    it('should have correct thresholds for Beta', () => {
      const scorer = new ConfidenceScorer('Beta');
      const thresholds = scorer.getThresholds();
      expect(thresholds.proceed).toBe(0.75);
      expect(thresholds.fallback).toBe(0.75);
      expect(thresholds.abort).toBe(0.45);
    });
  });

  describe('calculateConfidence', () => {
    it('should return HIGH for high confidence signals', () => {
      const scorer = new ConfidenceScorer('Production');
      const signals = [
        { signal_name: 'spec_completeness', value: 1.0, weight: 1.0 },
        { signal_name: 'validation_results', value: 1.0, weight: 1.0 },
        { signal_name: 'code_quality', value: 1.0, weight: 1.0 },
      ];
      
      const result = scorer.calculateConfidence(signals);
      
      expect(result.level).toBe(ConfidenceLevel.HIGH);
      expect(result.score).toBeGreaterThan(0.7);
    });

    it('should return MEDIUM for medium confidence signals', () => {
      const scorer = new ConfidenceScorer('Alpha');
      const signals = [
        { signal_name: 'spec_completeness', value: 0.75, weight: 1.0 },
        { signal_name: 'validation_results', value: 0.7, weight: 1.0 },
      ];
      
      const result = scorer.calculateConfidence(signals);
      
      expect(result.level).toBe(ConfidenceLevel.MEDIUM);
    });

    it('should return LOW for low confidence signals', () => {
      const scorer = new ConfidenceScorer('Enterprise');
      const signals = [
        { signal_name: 'spec_completeness', value: 0.6, weight: 1.0 },
        { signal_name: 'validation_results', value: 0.6, weight: 1.0 },
      ];
      
      const result = scorer.calculateConfidence(signals);
      
      expect(result.level).toBe(ConfidenceLevel.LOW);
    });

    it('should return NONE for no confidence signals', () => {
      const scorer = new ConfidenceScorer('Production');
      const signals = [
        { signal_name: 'spec_completeness', value: 0.2, weight: 1.0 },
        { signal_name: 'validation_results', value: 0.2, weight: 1.0 },
      ];
      
      const result = scorer.calculateConfidence(signals);
      
      expect(result.level).toBe(ConfidenceLevel.NONE);
    });

    it('should handle empty signals array', () => {
      const scorer = new ConfidenceScorer('MVP');
      const result = scorer.calculateConfidence([]);
      
      expect(result.score).toBe(0);
      expect(result.level).toBe(ConfidenceLevel.NONE);
    });
  });

  describe('decideAction', () => {
    it('should return proceed_autonomous for HIGH confidence', () => {
      const scorer = new ConfidenceScorer('POC');
      
      const action = scorer.decideAction(0.95, false);
      expect(action).toBe('proceed_autonomous');
    });

    it('should return proceed_with_approval for MEDIUM confidence with approval', () => {
      const scorer = new ConfidenceScorer('Alpha');
      
      const action = scorer.decideAction(0.75, true, false);
      expect(action).toBe('proceed_with_approval');
    });

    it('should return require_human_review for MEDIUM confidence without approval', () => {
      const scorer = new ConfidenceScorer('Alpha');
      
      const action = scorer.decideAction(0.75, false, false);
      expect(action).toBe('require_human_review');
    });

    it('should return require_human_review for LOW confidence with approval', () => {
      const scorer = new ConfidenceScorer('Production');
      
      const action = scorer.decideAction(0.5, true, false);
      expect(action).toBe('require_human_review');
    });

    it('should return abort for LOW confidence without approval', () => {
      const scorer = new ConfidenceScorer('Production');
      
      const action = scorer.decideAction(0.5, false);
      expect(action).toBe('abort');
    });

    it('should return abort for NONE confidence', () => {
      const scorer = new ConfidenceScorer('Alpha');
      
      const action = scorer.decideAction(0.2, true);
      expect(action).toBe('abort');
    });

    it('should require human review for critical changes at MEDIUM', () => {
      const scorer = new ConfidenceScorer('Alpha');
      
      const action = scorer.decideAction(0.75, true, true);
      expect(action).toBe('require_human_review');
    });
  });

  describe('generateReport', () => {
    it('should generate complete confidence report', () => {
      const scorer = new ConfidenceScorer('Alpha');
      const signals = [
        { signal_name: 'spec_completeness', value: 1.0, weight: 1.0 },
        { signal_name: 'validation_results', value: 0.9, weight: 1.0 },
      ];
      
      const report = scorer.generateReport('test-project', signals, 'proceed_autonomous');
      
      expect(report).toBeDefined();
      expect(report.project_id).toBe('test-project');
      expect(report.project_level).toBe('Alpha');
      expect(report.confidence_score).toBeGreaterThan(0);
      expect(report.confidence_level).toBeDefined();
      expect(report.decision).toBe('proceed_autonomous');
      expect(report.signals).toHaveLength(2);
      expect(report.reasoning).toHaveLength(3);
      expect(report.timestamp).toBeDefined();
    });
  });

  describe('signal source weights', () => {
    it('should have correct weights for all sources', () => {
      expect(SIGNAL_SOURCE_WEIGHTS.spec_completeness).toBe(0.3);
      expect(SIGNAL_SOURCE_WEIGHTS.validation_results).toBe(0.25);
      expect(SIGNAL_SOURCE_WEIGHTS.code_quality).toBe(0.2);
      expect(SIGNAL_SOURCE_WEIGHTS.external_verification).toBe(0.15);
      expect(SIGNAL_SOURCE_WEIGHTS.historical_data).toBe(0.1);
    });
  });

  describe('project level thresholds', () => {
    it('should have thresholds for all project levels', () => {
      expect(PROJECT_LEVEL_THRESHOLDS.POC).toBeDefined();
      expect(PROJECT_LEVEL_THRESHOLDS.MVP).toBeDefined();
      expect(PROJECT_LEVEL_THRESHOLDS.Alpha).toBeDefined();
      expect(PROJECT_LEVEL_THRESHOLDS.Beta).toBeDefined();
      expect(PROJECT_LEVEL_THRESHOLDS.Production).toBeDefined();
      expect(PROJECT_LEVEL_THRESHOLDS.Startup).toBeDefined();
      expect(PROJECT_LEVEL_THRESHOLDS.SMB).toBeDefined();
      expect(PROJECT_LEVEL_THRESHOLDS.MSB).toBeDefined();
      expect(PROJECT_LEVEL_THRESHOLDS.Enterprise).toBeDefined();
    });
  });
});
