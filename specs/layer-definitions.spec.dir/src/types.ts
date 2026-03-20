/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/layer-definitions.spec.dir/abstraction.spec.md
 * Generated: 2026-03-20T17:45:00.000Z
 * 
 * Edit the spec, not this file.
 */

/**
 * Layer depth values in the spec hierarchy
 */
export enum LayerDepth {
  NORTH_STAR = 0,
  FEATURE = 1,
  COMPONENT = 2,
  DETAIL = 3,
  IMPLEMENTATION = 4,
  CODE_SPEC = 5,
  GENERATED_CODE = 6,
  TEST_SPEC = 7,
  TEST_CODE_SPEC = 8,
  GENERATED_TEST = 9,
  DEPLOYMENT = 10,
}

/**
 * Layer names mapped to depths
 */
export const LAYER_NAMES: Record<LayerDepth, string> = {
  [LayerDepth.NORTH_STAR]: 'North Star',
  [LayerDepth.FEATURE]: 'Feature',
  [LayerDepth.COMPONENT]: 'Component',
  [LayerDepth.DETAIL]: 'Detail',
  [LayerDepth.IMPLEMENTATION]: 'Implementation',
  [LayerDepth.CODE_SPEC]: 'Code Spec',
  [LayerDepth.GENERATED_CODE]: 'Generated Code',
  [LayerDepth.TEST_SPEC]: 'Test Spec',
  [LayerDepth.TEST_CODE_SPEC]: 'Test Code Spec',
  [LayerDepth.GENERATED_TEST]: 'Generated Test',
  [LayerDepth.DEPLOYMENT]: 'Deployment',
};

/**
 * Layer descriptions
 */
export const LAYER_DESCRIPTIONS: Record<LayerDepth, string> = {
  [LayerDepth.NORTH_STAR]: 'Overall project intent, goals, architecture',
  [LayerDepth.FEATURE]: 'High-level feature breakdown, user stories',
  [LayerDepth.COMPONENT]: 'Entities, operations, interfaces, data models',
  [LayerDepth.DETAIL]: 'Detailed design, pseudocode, algorithms, diagrams',
  [LayerDepth.IMPLEMENTATION]: 'Mapping to target language constructs, APIs',
  [LayerDepth.CODE_SPEC]: 'Direct code mapping with language-specific syntax',
  [LayerDepth.GENERATED_CODE]: 'Actual output code (not edited by humans)',
  [LayerDepth.TEST_SPEC]: 'Natural language test descriptions',
  [LayerDepth.TEST_CODE_SPEC]: 'Test code mapping',
  [LayerDepth.GENERATED_TEST]: 'Generated test code',
  [LayerDepth.DEPLOYMENT]: 'Deployment configuration, infrastructure',
};

/**
 * Typical file extensions for each layer
 */
export const LAYER_EXTENSIONS: Record<LayerDepth, string[]> = {
  [LayerDepth.NORTH_STAR]: ['.scl', '.spec.md'],
  [LayerDepth.FEATURE]: ['.spec.md'],
  [LayerDepth.COMPONENT]: ['.spec.md', '.spec.yaml'],
  [LayerDepth.DETAIL]: ['.spec.yaml'],
  [LayerDepth.IMPLEMENTATION]: ['.spec.yaml'],
  [LayerDepth.CODE_SPEC]: ['.go.spec', '.ts.spec', '.py.spec', '.rs.spec'],
  [LayerDepth.GENERATED_CODE]: ['.go', '.ts', '.py', '.rs'],
  [LayerDepth.TEST_SPEC]: ['.test.spec.md'],
  [LayerDepth.TEST_CODE_SPEC]: ['.test.go.spec', '.test.ts.spec'],
  [LayerDepth.GENERATED_TEST]: ['_test.go', '.test.ts'],
  [LayerDepth.DEPLOYMENT]: ['.spec.yaml', '.yaml'],
};

/**
 * Agent roles that own each layer
 */
export const LAYER_OWNERS: Record<LayerDepth, string[]> = {
  [LayerDepth.NORTH_STAR]: ['north-star'],
  [LayerDepth.FEATURE]: ['spec-writer'],
  [LayerDepth.COMPONENT]: ['spec-writer'],
  [LayerDepth.DETAIL]: ['spec-writer', 'code-gen'],
  [LayerDepth.IMPLEMENTATION]: ['code-gen'],
  [LayerDepth.CODE_SPEC]: ['code-gen'],
  [LayerDepth.GENERATED_CODE]: ['code-gen'],
  [LayerDepth.TEST_SPEC]: ['test-writer'],
  [LayerDepth.TEST_CODE_SPEC]: ['test-writer'],
  [LayerDepth.GENERATED_TEST]: ['test-writer'],
  [LayerDepth.DEPLOYMENT]: ['ops-agent'],
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
  from: LayerDepth;
  to: LayerDepth;
  isValid: boolean;
  reason?: string;
}
