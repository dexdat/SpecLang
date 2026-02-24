/**
 * SPECLANG-GENERATED: Compiler Phases Types
 * Source: @speclang/compiler.spec.dir/phases
 */

import type { Block, Reference, SpecMetadata } from '../../parser/types';
import type { CompilerTarget } from '../targets';

export interface Location {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface SpecGraph {
  nodes: Block[];
  edges: Reference[];
  headers: Record<string, SpecMetadata>;
  errors: CompileError[];
  sources: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: CompileError[];
  warnings: CompileWarning[];
}

export interface CompileWarning {
  code: string;
  message: string;
  location?: Location;
  block?: string;
}

export interface ResolvedGraph {
  graph: SpecGraph;
  orderedBlocks: Block[];
  resolvedTypes: Map<string, string>;
  dependencyMap: Map<string, string[]>;
}

export interface IRBlock {
  id: string;
  kind: string;
  name: string;
  fields: IRField[];
  methods: IROperation[];
}

export interface IRField {
  name: string;
  type: string;
  optional: boolean;
}

export interface IROperation {
  name: string;
  params: IRField[];
  returnType: string;
  body: string;
}

export interface IR {
  entities: IRBlock[];
  operations: IROperation[];
  policies: string[];
}

export interface Artifact {
  path: string;
  content: string;
  markers: string[];
  target: string;
}

export type DriftStatus = 'spec_ahead' | 'code_ahead' | 'in_sync';

export interface DriftReport {
  status: DriftStatus;
  specChanges: string[];
  codeChanges: string[];
}

export interface BlockUpdate {
  blockId: string;
  proposedContent: string;
}

export interface CodeUpdate {
  path: string;
  newContent: string;
  oldContent: string;
}

export interface CompileCache {
  location: string;
  entries: CacheEntry[];
}

export interface CacheEntry {
  blockId: string;
  irHash: string;
  artifactHash?: string;
}

export interface Lockfile {
  version: string;
  compilerVersion: string;
  entries: LockEntry[];
  generatedAt: string;
}

export interface LockEntry {
  specId: string;
  specVersion: string;
  specHash: string;
  artifacts: ArtifactEntry[];
}

export interface ArtifactEntry {
  path: string;
  hash: string;
  target: string;
}

export interface CompileOptions {
  target: string;
  outputDir?: string;
  watch?: boolean;
  incremental?: boolean;
  cacheDir?: string;
}

export interface CompilerPlugin {
  name: string;
  version: string;
  beforeParse?: (source: string) => string;
  afterParse?: (graph: SpecGraph) => SpecGraph;
  beforeValidate?: (graph: SpecGraph) => SpecGraph;
  afterValidate?: (result: ValidationResult) => ValidationResult;
  beforeTransform?: (ir: IR) => IR;
  beforeCodegen?: (ir: IR, target: CompilerTarget) => IR;
  afterCodegen?: (artifacts: Artifact[]) => Artifact[];
}

export class CompileError extends Error {
  constructor(
    public code: string,
    message: string,
    public location?: Location,
    public block?: string,
    public suggestions: string[] = []
  ) {
    super(message);
    this.name = 'CompileError';
  }
}
