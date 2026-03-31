/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer.spec.md
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
} from './types';

import {
  validateLayer,
  validateLayerDependency,
  validateLayerChain,
  getMaxLayerForMaturity,
  LAYER_VALIDATION_RULES,
} from './validator';

import {
  resolveLayerFromPath,
  resolveLayerFromContent,
  resolveLayerFromDependencies,
  resolveLayer,
  getDefaultLayer,
} from './resolver';

describe('Layer Types', () => {
  describe('Layer enum', () => {
    it('should have correct layer values', () => {
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
      expect(LAYER_NAMES[Layer.COMPONENT_ARCHITECTURE]).toBe('Component Architecture');
      expect(LAYER_NAMES[Layer.DOMAIN_MODELS]).toBe('Domain Models');
      expect(LAYER_NAMES[Layer.CODE_MAPPING]).toBe('Code Mapping');
    });

    it('should have descriptions for all layers', () => {
      for (let i = 0; i <= 9; i++) {
        expect(LAYER_DESCRIPTIONS[i as Layer]).toBeDefined();
        expect(LAYER_DESCRIPTIONS[i as Layer].length).toBeGreaterThan(0);
      }
    });
  });

  describe('isValidLayer', () => {
    it('should return true for valid layers', () => {
      expect(isValidLayer(0)).toBe(true);
      expect(isValidLayer(5)).toBe(true);
      expect(isValidLayer(9)).toBe(true);
    });

    it('should return false for invalid layers', () => {
      expect(isValidLayer(-1)).toBe(false);
      expect(isValidLayer(10)).toBe(false);
      expect(isValidLayer(3.5)).toBe(false);
    });
  });

  describe('getMinValidLayer', () => {
    it('should return NORTH_STAR for empty dependencies', () => {
      expect(getMinValidLayer([])).toBe(Layer.NORTH_STAR);
    });

    it('should return minimum layer from dependencies', () => {
      expect(getMinValidLayer([Layer.COMPONENT_ARCHITECTURE, Layer.DOMAIN_MODELS])).toBe(Layer.COMPONENT_ARCHITECTURE);
    });
  });
});

describe('Layer Validator', () => {
  describe('validateLayer', () => {
    it('should validate correct layers', () => {
      expect(validateLayer(0).valid).toBe(true);
      expect(validateLayer(5).valid).toBe(true);
      expect(validateLayer(9).valid).toBe(true);
    });

    it('should reject undefined layer', () => {
      const result = validateLayer(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(LAYER_VALIDATION_RULES.LAYER_FIELD_REQUIRED);
    });

    it('should reject invalid layer values', () => {
      const result = validateLayer(10);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid layer value');
    });
  });

  describe('validateLayerDependency', () => {
    it('should allow valid dependencies', () => {
      const result = validateLayerDependency(Layer.CODE_MAPPING, Layer.BUSINESS_LOGIC);
      expect(result.valid).toBe(true);
    });

    it('should allow same layer dependencies', () => {
      const result = validateLayerDependency(Layer.BUSINESS_LOGIC, Layer.BUSINESS_LOGIC);
      expect(result.valid).toBe(true);
    });

    it('should reject backward dependencies', () => {
      const result = validateLayerDependency(Layer.BUSINESS_LOGIC, Layer.CODE_MAPPING);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain(LAYER_VALIDATION_RULES.NO_BACKWARD_DEPENDENCIES);
    });
  });

  describe('validateLayerChain', () => {
    it('should validate valid dependency chains', () => {
      const result = validateLayerChain(Layer.CODE_MAPPING, [
        Layer.BUSINESS_LOGIC,
        Layer.INTERFACE_SPECIFICATIONS,
        Layer.DOMAIN_MODELS,
        Layer.COMPONENT_ARCHITECTURE,
        Layer.NORTH_STAR,
      ]);
      expect(result.valid).toBe(true);
    });

    it('should warn when chain does not include NORTH_STAR', () => {
      const result = validateLayerChain(Layer.CODE_MAPPING, [
        Layer.BUSINESS_LOGIC,
      ]);
      expect(result.warnings).toContain('Dependency chain does not include layer 0');
    });
  });

  describe('getMaxLayerForMaturity', () => {
    it('should return correct max layers for maturity levels', () => {
      expect(getMaxLayerForMaturity('POC')).toBe(Layer.INTERFACE_SPECIFICATIONS);
      expect(getMaxLayerForMaturity('MVP')).toBe(Layer.CODE_MAPPING);
      expect(getMaxLayerForMaturity('ALPHA')).toBe(Layer.TEST_SPECIFICATIONS);
      expect(getMaxLayerForMaturity('BETA')).toBe(Layer.GENERATED_TESTS);
      expect(getMaxLayerForMaturity('PRODUCTION')).toBe(Layer.PIPELINE_CONFIGURATION);
    });

    it('should handle case-insensitive maturity levels', () => {
      expect(getMaxLayerForMaturity('poc')).toBe(Layer.INTERFACE_SPECIFICATIONS);
      expect(getMaxLayerForMaturity('Alpha')).toBe(Layer.TEST_SPECIFICATIONS);
    });

    it('should return CODE_MAPPING for unknown maturity', () => {
      expect(getMaxLayerForMaturity('UNKNOWN')).toBe(Layer.CODE_MAPPING);
    });
  });
});

describe('Layer Resolver', () => {
  describe('resolveLayerFromPath', () => {
    it('should resolve project.scl to NORTH_STAR', () => {
      expect(resolveLayerFromPath('project.scl')).toBe(Layer.NORTH_STAR);
    });

    it('should resolve component files to COMPONENT_ARCHITECTURE', () => {
      expect(resolveLayerFromPath('components.scl')).toBe(Layer.COMPONENT_ARCHITECTURE);
      expect(resolveLayerFromPath('components.spec.md')).toBe(Layer.COMPONENT_ARCHITECTURE);
    });

    it('should resolve entities to DOMAIN_MODELS', () => {
      expect(resolveLayerFromPath('entities.spec.md')).toBe(Layer.DOMAIN_MODELS);
      expect(resolveLayerFromPath('entities.spec.yaml')).toBe(Layer.DOMAIN_MODELS);
    });

    it('should resolve api files to INTERFACE_SPECIFICATIONS', () => {
      expect(resolveLayerFromPath('api.spec.md')).toBe(Layer.INTERFACE_SPECIFICATIONS);
    });

    it('should resolve workflows to BUSINESS_LOGIC', () => {
      expect(resolveLayerFromPath('workflows.spec.md')).toBe(Layer.BUSINESS_LOGIC);
    });

    it('should resolve .ts.spec to CODE_MAPPING', () => {
      expect(resolveLayerFromPath('handler.ts.spec')).toBe(Layer.CODE_MAPPING);
    });

    it('should resolve .go.spec to CODE_MAPPING', () => {
      expect(resolveLayerFromPath('handler.go.spec')).toBe(Layer.CODE_MAPPING);
    });

    it('should resolve test specs to TEST_SPECIFICATIONS', () => {
      expect(resolveLayerFromPath('handler.test.spec.md')).toBe(Layer.TEST_SPECIFICATIONS);
    });

    it('should resolve pipeline files to PIPELINE_CONFIGURATION', () => {
      expect(resolveLayerFromPath('pipeline.yaml')).toBe(Layer.PIPELINE_CONFIGURATION);
      expect(resolveLayerFromPath('build.yaml')).toBe(Layer.PIPELINE_CONFIGURATION);
    });

    it('should return undefined for unknown paths', () => {
      expect(resolveLayerFromPath('unknown.file')).toBeUndefined();
    });
  });

  describe('resolveLayerFromContent', () => {
    it('should resolve NORTH_STAR content', () => {
      expect(resolveLayerFromContent('This is the northstar intent')).toBe(Layer.NORTH_STAR);
      expect(resolveLayerFromContent('Project vision and goals')).toBe(Layer.NORTH_STAR);
    });

    it('should resolve component content', () => {
      expect(resolveLayerFromContent('A component that handles auth')).toBe(Layer.COMPONENT_ARCHITECTURE);
    });

    it('should resolve api content', () => {
      expect(resolveLayerFromContent('REST API endpoint for users')).toBe(Layer.INTERFACE_SPECIFICATIONS);
      expect(resolveLayerFromContent('GraphQL interface definition')).toBe(Layer.INTERFACE_SPECIFICATIONS);
    });

    it('should resolve business logic content', () => {
      expect(resolveLayerFromContent('Business workflow for approval')).toBe(Layer.BUSINESS_LOGIC);
    });

    it('should resolve test content', () => {
      expect(resolveLayerFromContent('Given a user When they login Then')).toBe(Layer.TEST_SPECIFICATIONS);
    });

    it('should resolve pipeline content', () => {
      expect(resolveLayerFromContent('CI pipeline for deployment')).toBe(Layer.PIPELINE_CONFIGURATION);
    });
  });

  describe('resolveLayerFromDependencies', () => {
    it('should return NORTH_STAR for no dependencies', () => {
      expect(resolveLayerFromDependencies([])).toBe(Layer.NORTH_STAR);
    });

    it('should return minimum dependency + 1', () => {
      expect(resolveLayerFromDependencies([Layer.NORTH_STAR])).toBe(Layer.COMPONENT_ARCHITECTURE);
      expect(resolveLayerFromDependencies([Layer.COMPONENT_ARCHITECTURE])).toBe(Layer.DOMAIN_MODELS);
    });
  });

  describe('resolveLayer', () => {
    it('should prefer explicit layer', () => {
      const result = resolveLayer({
        explicitLayer: 5,
        filePath: 'project.scl',
      });
      expect(result).toBe(5);
    });

    it('should resolve from path when no explicit layer', () => {
      const result = resolveLayer({
        filePath: 'handler.ts.spec',
      });
      expect(result).toBe(Layer.CODE_MAPPING);
    });

    it('should resolve from content when no path match', () => {
      const result = resolveLayer({
        content: 'REST API for users',
      });
      expect(result).toBe(Layer.INTERFACE_SPECIFICATIONS);
    });

    it('should resolve from dependencies when no other info', () => {
      const result = resolveLayer({
        dependencyLayers: [Layer.NORTH_STAR],
      });
      expect(result).toBe(Layer.COMPONENT_ARCHITECTURE);
    });

    it('should return undefined when no resolution possible', () => {
      const result = resolveLayer({});
      expect(result).toBeUndefined();
    });
  });

  describe('getDefaultLayer', () => {
    it('should return COMPONENT_ARCHITECTURE', () => {
      expect(getDefaultLayer()).toBe(Layer.COMPONENT_ARCHITECTURE);
    });
  });
});
