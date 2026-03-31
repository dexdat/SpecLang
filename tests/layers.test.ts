/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer.spec.md
 * Blocks: @block:testing
 * Generated: 2026-03-31T00:00:00.000Z
 * 
 * Edit the spec, not this file.
 */

import { describe, it, expect } from 'vitest';
import {
  Layer,
  LAYER_NAMES,
  LAYER_DESCRIPTIONS,
  LAYER_EXTENSIONS,
  LAYER_OWNERS,
  isValidLayer,
  getMinValidLayer,
} from '../src/layers/types';

import {
  validateLayer,
  validateLayerDependency,
  validateLayerChain,
  getMaxLayerForMaturity,
  LAYER_VALIDATION_RULES,
} from '../src/layers/validator';

import {
  resolveLayer,
  resolveLayerFromPath,
  resolveLayerFromContent,
} from '../src/layers/resolver';

describe('Layer System', () => {
  describe('Layer Enum', () => {
    it('should have all 10 layers defined', () => {
      expect(Layer.NORTH_STAR).toBe(0);
      expect(Layer.COMPONENT_ARCHITECTURE).toBe(1);
      expect(Layer.DOMAIN_MODELS).toBe(2);
      expect(Layer.INTERFACE_SPECIFICATIONS).toBe(3);
      expect(Layer.BUSINESS_LOGIC).toBe(4);
      expect(Layer.CODE_MAPPING).toBe(5);
      expect(Layer.GENERATED_IMPLEMENTATION).toBe(6);
      expect(Layer.TEST_SPECIFICATIONS).toBe(7);
      expect(Layer.GENERATED_TESTS).toBe(8);
      expect(Layer.PIPELINE_CONFIGURATION).toBe(9);
    });

    it('should have correct layer names', () => {
      expect(LAYER_NAMES[Layer.NORTH_STAR]).toBe('North Star');
      expect(LAYER_NAMES[Layer.CODE_MAPPING]).toBe('Code Mapping');
      expect(LAYER_NAMES[Layer.PIPELINE_CONFIGURATION]).toBe('Pipeline Configuration');
    });

    it('should have descriptions for all layers', () => {
      for (let i = 0; i <= 9; i++) {
        expect(LAYER_DESCRIPTIONS[i as Layer]).toBeDefined();
        expect(LAYER_DESCRIPTIONS[i as Layer].length).toBeGreaterThan(0);
      }
    });
  });

  describe('Layer Extensions', () => {
    it('should have extensions for all layers', () => {
      for (let i = 0; i <= 9; i++) {
        expect(LAYER_EXTENSIONS[i as Layer]).toBeDefined();
        expect(LAYER_EXTENSIONS[i as Layer].length).toBeGreaterThan(0);
      }
    });

    it('should map code mapping to language specs', () => {
      expect(LAYER_EXTENSIONS[Layer.CODE_MAPPING]).toContain('.go.spec');
      expect(LAYER_EXTENSIONS[Layer.CODE_MAPPING]).toContain('.ts.spec');
      expect(LAYER_EXTENSIONS[Layer.CODE_MAPPING]).toContain('.py.spec');
    });

    it('should map generated implementation to generated files', () => {
      expect(LAYER_EXTENSIONS[Layer.GENERATED_IMPLEMENTATION]).toContain('.go');
      expect(LAYER_EXTENSIONS[Layer.GENERATED_IMPLEMENTATION]).toContain('.ts');
    });
  });

  describe('Layer Owners', () => {
    it('should have owners for all layers', () => {
      for (let i = 0; i <= 9; i++) {
        expect(LAYER_OWNERS[i as Layer]).toBeDefined();
        expect(LAYER_OWNERS[i as Layer].length).toBeGreaterThan(0);
      }
    });

    it('should assign north-star to layer 0', () => {
      expect(LAYER_OWNERS[Layer.NORTH_STAR]).toContain('north-star');
    });

    it('should assign spec-writer to component architecture', () => {
      expect(LAYER_OWNERS[Layer.COMPONENT_ARCHITECTURE]).toContain('spec-writer');
    });

    it('should assign code-gen to code mapping', () => {
      expect(LAYER_OWNERS[Layer.CODE_MAPPING]).toContain('code-gen');
    });
  });

  describe('isValidLayer', () => {
    it('should return true for valid layers 0-9', () => {
      for (let i = 0; i <= 9; i++) {
        expect(isValidLayer(i)).toBe(true);
      }
    });

    it('should return false for invalid layers', () => {
      expect(isValidLayer(-1)).toBe(false);
      expect(isValidLayer(10)).toBe(false);
      expect(isValidLayer(1.5)).toBe(false);
      expect(isValidLayer(NaN)).toBe(false);
      expect(isValidLayer(Infinity)).toBe(false);
    });
  });

  describe('getMinValidLayer', () => {
    it('should return NORTH_STAR for empty dependencies', () => {
      expect(getMinValidLayer([])).toBe(Layer.NORTH_STAR);
    });

    it('should return minimum layer from dependencies', () => {
      expect(getMinValidLayer([Layer.DOMAIN_MODELS, Layer.COMPONENT_ARCHITECTURE])).toBe(Layer.COMPONENT_ARCHITECTURE);
    });

    it('should handle single dependency', () => {
      expect(getMinValidLayer([Layer.CODE_MAPPING])).toBe(Layer.CODE_MAPPING);
    });
  });

  describe('validateLayer', () => {
    it('should pass for valid layer', () => {
      const result = validateLayer(5);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for undefined layer', () => {
      const result = validateLayer(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(LAYER_VALIDATION_RULES.LAYER_FIELD_REQUIRED);
    });

    it('should fail for invalid layer values', () => {
      const result1 = validateLayer(10);
      expect(result1.valid).toBe(false);
      expect(result1.errors[0]).toContain('Invalid layer value: 10');

      const result2 = validateLayer(-1);
      expect(result2.valid).toBe(false);
      expect(result2.errors[0]).toContain('Invalid layer value: -1');
    });
  });

  describe('validateLayerDependency', () => {
    it('should allow lower layer dependencies', () => {
      // Layer 5 can depend on layers 0-5
      const result1 = validateLayerDependency(Layer.CODE_MAPPING, Layer.NORTH_STAR);
      expect(result1.valid).toBe(true);

      const result2 = validateLayerDependency(Layer.CODE_MAPPING, Layer.BUSINESS_LOGIC);
      expect(result2.valid).toBe(true);
    });

    it('should allow same layer dependencies', () => {
      const result = validateLayerDependency(Layer.BUSINESS_LOGIC, Layer.BUSINESS_LOGIC);
      expect(result.valid).toBe(true);
    });

    it('should reject higher layer dependencies', () => {
      // Layer 3 cannot depend on layer 5
      const result = validateLayerDependency(Layer.INTERFACE_SPECIFICATIONS, Layer.CODE_MAPPING);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain(LAYER_VALIDATION_RULES.NO_BACKWARD_DEPENDENCIES);
    });
  });

  describe('validateLayerChain', () => {
    it('should pass for valid dependency chain', () => {
      const result = validateLayerChain(Layer.CODE_MAPPING, [
        Layer.BUSINESS_LOGIC,
        Layer.INTERFACE_SPECIFICATIONS,
        Layer.DOMAIN_MODELS,
        Layer.COMPONENT_ARCHITECTURE,
        Layer.NORTH_STAR,
      ]);
      expect(result.valid).toBe(true);
    });

    it('should fail if any dependency is invalid', () => {
      const result = validateLayerChain(Layer.CODE_MAPPING, [
        Layer.GENERATED_IMPLEMENTATION, // Higher than 5 - invalid!
      ]);
      expect(result.valid).toBe(false);
    });

    it('should warn if chain does not include NORTH_STAR', () => {
      const result = validateLayerChain(Layer.CODE_MAPPING, [
        Layer.BUSINESS_LOGIC,
        Layer.DOMAIN_MODELS,
      ]);
      expect(result.warnings).toContain('Dependency chain does not include layer 0 (North Star).');
    });
  });

  describe('getMaxLayerForMaturity', () => {
    it('should return correct max layer for each maturity level', () => {
      expect(getMaxLayerForMaturity('POC')).toBe(Layer.INTERFACE_SPECIFICATIONS);
      expect(getMaxLayerForMaturity('MVP')).toBe(Layer.CODE_MAPPING);
      expect(getMaxLayerForMaturity('ALPHA')).toBe(Layer.TEST_SPECIFICATIONS);
      expect(getMaxLayerForMaturity('BETA')).toBe(Layer.GENERATED_TESTS);
      expect(getMaxLayerForMaturity('PRODUCTION')).toBe(Layer.PIPELINE_CONFIGURATION);
    });

    it('should be case insensitive', () => {
      expect(getMaxLayerForMaturity('poc')).toBe(Layer.INTERFACE_SPECIFICATIONS);
      expect(getMaxLayerForMaturity('MVP')).toBe(Layer.CODE_MAPPING);
      expect(getMaxLayerForMaturity('Alpha')).toBe(Layer.TEST_SPECIFICATIONS);
    });

    it('should default to CODE_MAPPING for unknown maturity', () => {
      expect(getMaxLayerForMaturity('UNKNOWN')).toBe(Layer.CODE_MAPPING);
    });
  });

  describe('resolveLayer', () => {
    it('should resolve valid layer numbers', () => {
      expect(resolveLayer({ explicitLayer: 0 })).toBe(Layer.NORTH_STAR);
      expect(resolveLayer({ explicitLayer: 5 })).toBe(Layer.CODE_MAPPING);
      expect(resolveLayer({ explicitLayer: 9 })).toBe(Layer.PIPELINE_CONFIGURATION);
    });

    it('should return the value even if outside valid range (validation is separate)', () => {
      // resolveLayer just resolves, validation is done separately with validateLayer()
      expect(resolveLayer({ explicitLayer: 10 })).toBe(10);
      expect(resolveLayer({ explicitLayer: -1 })).toBe(-1);
    });

    it('should return undefined when no information provided', () => {
      expect(resolveLayer({})).toBeUndefined();
    });
  });

  describe('resolveLayerFromPath', () => {
    it('should resolve layer from file path patterns', () => {
      // North Star
      expect(resolveLayerFromPath('project.scl')).toBe(Layer.NORTH_STAR);
      expect(resolveLayerFromPath('project.yaml')).toBe(Layer.NORTH_STAR);

      // Code Mapping
      expect(resolveLayerFromPath('handler.ts.spec')).toBe(Layer.CODE_MAPPING);
      expect(resolveLayerFromPath('auth.go.spec')).toBe(Layer.CODE_MAPPING);

      // Test Specs
      expect(resolveLayerFromPath('handler.test.spec.md')).toBe(Layer.TEST_SPECIFICATIONS);

      // Pipeline
      expect(resolveLayerFromPath('pipeline.yaml')).toBe(Layer.PIPELINE_CONFIGURATION);
    });

    it('should return undefined for unrecognized patterns', () => {
      expect(resolveLayerFromPath('README.md')).toBeUndefined();
      expect(resolveLayerFromPath('some-file.ts')).toBeUndefined();
    });
  });

  describe('resolveLayerFromContent', () => {
    it('should resolve layer from content keywords', () => {
      expect(resolveLayerFromContent('northstar or intent')).toBe(Layer.NORTH_STAR);
      expect(resolveLayerFromContent('component and service')).toBe(Layer.COMPONENT_ARCHITECTURE);
      expect(resolveLayerFromContent('interface and api')).toBe(Layer.INTERFACE_SPECIFICATIONS);
      expect(resolveLayerFromContent('business and workflow')).toBe(Layer.BUSINESS_LOGIC);
    });

    it('should return undefined for unrecognized content', () => {
      expect(resolveLayerFromContent('some random content')).toBeUndefined();
    });
  });
});
