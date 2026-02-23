/**
 * SPECLANG-GENERATED: TypeScript types for spec parser
 * Source: @speclang/headers @block:headers/field-types
 */

import type { SpecRecord } from '../db/types';

// ============================================================================
// HEADER FIELD TYPES
// ============================================================================

/** Valid project maturity levels */
export type ProjectLevel = 
  | 'POC' 
  | 'MVP' 
  | 'Alpha' 
  | 'Beta' 
  | 'Production' 
  | 'Startup' 
  | 'SMB' 
  | 'MSB' 
  | 'Enterprise';

/** Valid agent support levels */
export type AgentSupport = 'human_only' | 'agent_assisted' | 'agent_autonomous';

/** Valid spec status */
export type SpecStatus = 'draft' | 'stable' | 'deprecated' | 'active' | 'generated';

/** Valid block kinds */
export type BlockKind = 
  | 'entity' 
  | 'operation' 
  | 'policy' 
  | 'test' 
  | 'mock' 
  | 'diagram' 
  | 'code' 
  | 'note' 
  | 'question' 
  | 'decision';

/** Layer values 0-10 */
export type Layer = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// ============================================================================
// METADATA TYPES
// ============================================================================

/** Parsed spec metadata from header */
export interface SpecMetadata {
  /** Unique identifier @domain/path */
  id: string;
  /** Semantic version */
  version: string;
  /** Abstraction layer 0-10 */
  layer?: Layer;
  /** Project maturity level */
  project_level?: ProjectLevel;
  /** Agent support readiness */
  agent_support?: AgentSupport;
  /** Tags for search */
  tags?: string[];
  /** Short description */
  short?: string;
  /** Output target language */
  target?: string;
  /** Spec status */
  status?: SpecStatus;
  /** Agent that owns this file */
  owned_by?: string;
  /** Session ID */
  session_id?: string;
  /** Dependencies - can be string refs or Reference objects */
  depends_on?: (string | Reference)[];
  /** References used in spec */
  refs?: (string | Reference)[];
  /** Children specs */
  children?: (string | Reference)[];
  /** Parent spec */
  parent?: string | Reference;
  /** Part number if split */
  part?: string;
  /** Sibling references */
  siblings?: {
    prev?: Reference;
    next?: Reference;
  };
  /** Generated files */
  generated?: string[];
  /** Header line count if declared */
  lines?: number;
  /** Custom additional fields */
  [key: string]: unknown;
}

// ============================================================================
// BLOCK TYPES
// ============================================================================

/** A content block in a spec */
export interface Block {
  /** Block ID like @block:auth/login */
  id: string;
  /** Block kind */
  kind: BlockKind;
  /** Raw content */
  content: string;
  /** Starting line number */
  line: number;
  /** Additional attributes */
  attrs?: Record<string, string>;
}

// ============================================================================
// REFERENCE TYPES
// ============================================================================

/** A reference to another spec or block */
export interface Reference {
  /** Full reference string @ref:path/to/block */
  ref: string;
  /** Source file where reference appears */
  sourceFile?: string;
  /** Target spec file path */
  targetFile?: string;
  /** Target block ID */
  targetBlock?: string;
  /** Line number where reference appears */
  line?: number;
}

// ============================================================================
// PARSING RESULT TYPES
// ============================================================================

/** Result of parsing a spec file */
export interface ParsedSpec {
  /** File path */
  filepath: string;
  /** Number of header lines */
  headerLines: number;
  /** Parsed metadata */
  metadata: SpecMetadata;
  /** Content after header */
  content: string;
  /** Extracted blocks */
  blocks: Block[];
  /** Extracted references */
  references: Reference[];
  /** Raw header text */
  headerRaw: string;
}

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/** Validation error */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Human message */
  message: string;
  /** File path */
  file?: string;
  /** Line number */
  line?: number;
  /** Field name */
  field?: string;
}

/** Validation warning */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Human message */
  message: string;
  /** File path */
  file?: string;
  /** Line number */
  line?: number;
}

/** Result of validating a single spec */
export interface ValidationResult {
  /** Whether spec is valid */
  valid: boolean;
  /** File path */
  filepath: string;
  /** Errors found */
  errors: ValidationError[];
  /** Warnings found */
  warnings: ValidationWarning[];
}

/** Reference check result */
export interface ReferenceCheck {
  /** Reference being checked */
  reference: Reference;
  /** Whether target exists */
  exists: boolean;
  /** Target file path if found */
  targetFile?: string;
  /** Target block if found */
  targetBlock?: string;
}

/** Validation report for all specs */
export interface ValidationReport {
  /** Total specs validated */
  total: number;
  /** Valid specs */
  valid: number;
  /** Invalid specs */
  invalid: number;
  /** Results by file */
  results: ValidationResult[];
  /** Timestamp */
  timestamp: string;
}

// ============================================================================
// PARSER OPTIONS
// ============================================================================

/** Parser configuration options */
export interface ParserOptions {
  /** Base directory for specs */
  specsDir?: string;
  /** Path to index file */
  indexPath?: string;
  /** Whether to validate references */
  validateRefs?: boolean;
  /** Whether to extract blocks */
  extractBlocks?: boolean;
}

/** Default parser options */
export const DEFAULT_PARSER_OPTIONS: ParserOptions = {
  specsDir: 'specs',
  indexPath: '_index.json',
  validateRefs: true,
  extractBlocks: true,
};
