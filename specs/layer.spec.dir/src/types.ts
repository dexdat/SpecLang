/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer.spec.md
 * Generated: 2026-03-31T00:00:00.000Z
 * 
 * Edit the spec, not this file.
 */

/**
 * Layer abstraction levels in SpecLang
 */
export enum Layer {
  /** Layer 0: North Star - Root project intent and vision */
  NORTH_STAR = 0,
  
  /** Layer 1: Component Architecture - High-level component design */
  COMPONENT_ARCHITECTURE = 1,
  
  /** Layer 2: Domain Models - Domain entity definitions */
  DOMAIN_MODELS = 2,
  
  /** Layer 3: Interface Specifications - API and interface definitions */
  INTERFACE_SPECIFICATIONS = 3,
  
  /** Layer 4: Business Logic - Business rules and workflows */
  BUSINESS_LOGIC = 4,
  
  /** Layer 5: Code Mapping - Direct mapping to implementation */
  CODE_MAPPING = 5,
  
  /** Layer 6: Generated Implementation - Generated target language code */
  GENERATED_IMPLEMENTATION = 6,
  
  /** Layer 7: Test Specifications - Test definitions in natural language */
  TEST_SPECIFICATIONS = 7,
  
  /** Layer 8: Generated Tests - Generated test code */
  GENERATED_TESTS = 8,
  
  /** Layer 9: Pipeline Configuration - Build and deployment configuration */
  PIPELINE_CONFIGURATION = 9,
}

/**
 * Layer names mapped to their values
 */
export const LAYER_NAMES: Record<Layer, string> = {
  [Layer.NORTH_STAR]: 'North Star',
  [Layer.COMPONENT_ARCHITECTURE]: 'Component Architecture',
  [Layer.DOMAIN_MODELS]: 'Domain Models',
  [Layer.INTERFACE_SPECIFICATIONS]: 'Interface Specifications',
  [Layer.BUSINESS_LOGIC]: 'Business Logic',
  [Layer.CODE_MAPPING]: 'Code Mapping',
  [Layer.GENERATED_IMPLEMENTATION]: 'Generated Implementation',
  [Layer.TEST_SPECIFICATIONS]: 'Test Specifications',
  [Layer.GENERATED_TESTS]: 'Generated Tests',
  [Layer.PIPELINE_CONFIGURATION]: 'Pipeline Configuration',
};

/**
 * Layer descriptions
 */
export const LAYER_DESCRIPTIONS: Record<Layer, string> = {
  [Layer.NORTH_STAR]: 'Top-level project intent and vision. The root specification that defines what the project is and why it exists.',
  [Layer.COMPONENT_ARCHITECTURE]: 'High-level component design. Defines major components and their relationships.',
  [Layer.DOMAIN_MODELS]: 'Domain entity and value object definitions. Defines the core domain concepts.',
  [Layer.INTERFACE_SPECIFICATIONS]: 'API and interface definitions. Defines how components interact.',
  [Layer.BUSINESS_LOGIC]: 'Business rules and workflows. Defines how the system behaves.',
  [Layer.CODE_MAPPING]: 'Direct mapping to implementation. Maps specs to target language code.',
  [Layer.GENERATED_IMPLEMENTATION]: 'Generated target language code. The output of code generation.',
  [Layer.TEST_SPECIFICATIONS]: 'Test definitions in natural language. Defines what to test, not how.',
  [Layer.GENERATED_TESTS]: 'Generated test code. The output of test generation.',
  [Layer.PIPELINE_CONFIGURATION]: 'Build and deployment configuration. Defines how to build, test, and deploy.',
};

/**
 * Typical file extensions for each layer
 */
export const LAYER_EXTENSIONS: Record<Layer, string[]> = {
  [Layer.NORTH_STAR]: ['.scl', '.spec.md'],
  [Layer.COMPONENT_ARCHITECTURE]: ['.spec.md', '.scl'],
  [Layer.DOMAIN_MODELS]: ['.spec.md', '.spec.yaml'],
  [Layer.INTERFACE_SPECIFICATIONS]: ['.spec.yaml', '.spec.md'],
  [Layer.BUSINESS_LOGIC]: ['.spec.md', '.spec.yaml'],
  [Layer.CODE_MAPPING]: ['.go.spec', '.ts.spec', '.py.spec', '.rs.spec'],
  [Layer.GENERATED_IMPLEMENTATION]: ['.go', '.ts', '.py', '.rs'],
  [Layer.TEST_SPECIFICATIONS]: ['.test.spec.md'],
  [Layer.GENERATED_TESTS]: ['_test.go', '.test.ts', '_test.py'],
  [Layer.PIPELINE_CONFIGURATION]: ['.yaml', '.yml'],
};

/**
 * Agent roles that own each layer
 */
export const LAYER_OWNERS: Record<Layer, string[]> = {
  [Layer.NORTH_STAR]: ['north-star'],
  [Layer.COMPONENT_ARCHITECTURE]: ['spec-writer'],
  [Layer.DOMAIN_MODELS]: ['spec-writer'],
  [Layer.INTERFACE_SPECIFICATIONS]: ['spec-writer', 'code-gen'],
  [Layer.BUSINESS_LOGIC]: ['spec-writer', 'code-gen'],
  [Layer.CODE_MAPPING]: ['code-gen'],
  [Layer.GENERATED_IMPLEMENTATION]: ['code-gen'],
  [Layer.TEST_SPECIFICATIONS]: ['test-writer'],
  [Layer.GENERATED_TESTS]: ['test-writer'],
  [Layer.PIPELINE_CONFIGURATION]: ['pipeline-agent'],
};

/**
 * Layer validation result
 */
export interface LayerValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Layer transition information
 */
export interface LayerTransition {
  from: Layer;
  to: Layer;
  isValid: boolean;
  reason?: string;
}

/**
 * Check if a layer value is valid
 */
export function isValidLayer(value: number): value is Layer {
  return Number.isInteger(value) && value >= 0 && value <= 9;
}

/**
 * Get the minimum valid layer for a dependency chain
 */
export function getMinValidLayer(dependencies: Layer[]): Layer {
  if (dependencies.length === 0) {
    return Layer.NORTH_STAR;
  }
  return Math.min(...dependencies) as Layer;
}
