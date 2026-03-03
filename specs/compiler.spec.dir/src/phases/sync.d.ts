/**
 * SPECLANG-GENERATED: Sync Phase (Bidirectional Sync)
 * Source: @speclang/compiler.spec.dir/phases @compiler/detect-drift @compiler/sync-code-to-spec @compiler/sync-spec-to-code
 */
import type { SpecGraph, DriftReport, BlockUpdate, CodeUpdate, Artifact } from './types';
export declare function detectDrift(spec: SpecGraph, files: string[]): DriftReport;
export declare function syncCodeToSpec(code: string, blockId: string): BlockUpdate;
export declare function syncSpecToCode(specBlock: import('../../parser/types').Block, artifacts: Artifact[]): CodeUpdate[];
//# sourceMappingURL=sync.d.ts.map