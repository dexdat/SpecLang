/**
 * SPECLANG-GENERATED: Parse Phase
 * Source: @speclang/compiler.spec.dir/phases @compiler/parse
 */
import type { SpecGraph } from './types';
export interface ParseOptions {
    sources: string[];
    encoding?: BufferEncoding;
}
export declare function parsePhase(sources: string[]): Promise<SpecGraph>;
export declare function parse(sources: string[]): SpecGraph;
//# sourceMappingURL=parse.d.ts.map