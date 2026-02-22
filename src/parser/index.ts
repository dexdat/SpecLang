/**
 * SPECLANG-GENERATED: Main parser module exports
 * Source: @speclang/headers @block:headers/parsing
 */

// Types
export * from './types';

// Header parsing
export {
  parseHeader,
  parseSpec,
  parseSpecContent,
  extractBlocks,
  extractReferences,
  extractMetadataReferences,
} from './header';

// Validation
export {
  isValidSemver,
  isValidLayer,
  validateIdFormat,
  validateMetadata,
  validateHeaderLines,
  validateSpec,
  validateAllSpecs,
  checkReference,
  checkReferences,
  findSpecFiles,
  loadSpecIndex,
  clearIndexCache,
} from './validator';
