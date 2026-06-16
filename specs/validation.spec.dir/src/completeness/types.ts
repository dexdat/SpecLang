/**
 * SPECLANG-GENERATED: Completeness types
 * Source: @specs/validation/completeness-types
 */

export interface CompletenessCriteria {
  metadata: {
    required: string[];
    recommended: string[];
  };
  blocks: {
    minimum: number;
    requiredKinds: string[];
  };
  references: {
    minReferences: number;
    mustResolve: boolean;
  };
  steps: {
    minCoverage: number;
  };
}

export interface CompletenessResult {
  specId: string;
  passed: boolean;
  score: number;
  checks: {
    metadata: MetadataCheck;
    blocks: BlocksCheck;
    references: ReferencesCheck;
    steps: StepsCheck;
  };
  missing: string[];
  suggestions: string[];
}

export interface MetadataCheck {
  passed: boolean;
  present: string[];
  missing: string[];
  score: number;
}

export interface BlocksCheck {
  passed: boolean;
  total: number;
  kinds: Record<string, number>;
  missing: string[];
  score: number;
}

export interface ReferencesCheck {
  passed: boolean;
  total: number;
  resolved: number;
  unresolved: string[];
  score: number;
}

export interface StepsCheck {
  passed: boolean;
  blocksWithSteps: number;
  totalBlocks: number;
  coverage: number;
  score: number;
}

export interface ParsedSpec {
  header: SpecHeader;
  blocks: SpecBlock[];
  content: string;
}

export interface SpecHeader {
  id: string;
  version?: string;
  layer?: number;
  project_level?: string;
  agent_support?: string;
  short?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface SpecBlock {
  id: string;
  kind: string;
  content: string;
}
