/**
 * SPECLANG-GENERATED: Header parsing implementation
 * Source: @speclang/headers @block:headers/parsing
 */
import type { SpecMetadata, Reference, Block } from './types';
/**
 * Parse the header of a spec file
 * Supports both formats:
 * - Efficient: "# speclang-header lines:N" + N lines of YAML
 * - Flexible: "# speclang-header" + scan for "---" terminator
 */
export declare function parseHeader(content: string): {
    metadata: SpecMetadata;
    headerLines: number;
    headerRaw: string;
    content: string;
};
/**
 * Extract blocks from spec content
 * Syntax: "# @block:{id} @kind:{kind} @{attr}:{value}*"
 */
export declare function extractBlocks(content: string, sourceFile: string): Block[];
/**
 * Extract all @ref: references from content.
 *
 * Fenced code blocks (``` and ~~~) are tracked using a stack so that nested
 * fences are handled correctly per CommonMark semantics: a closing fence must
 * match the most recently opened fence (same character, length ≥ opening).
 * Mismatched characters / longer fences are treated as nested openers, so an
 * inner ```` ```yaml ```` inside an outer ```` ```speclang ```` no longer
 * terminates the outer block early (the previous behaviour produced spurious
 * `@ref:auth%';` style extracts from SQL/code inside code blocks).
 */
export declare function extractReferences(content: string, sourceFile: string): Reference[];
export declare function normalizeMetadataRef(raw: string | unknown): string | null;
/**
 * Extract references from metadata (depends_on, refs, children, parent).
 *
 * Each raw metadata entry is run through `normalizeMetadataRef` so the
 * resulting reference list contains only entries that will pass the strict
 * format validator in `src/validation/rules/refs.ts`.
 */
export declare function extractMetadataReferences(metadata: SpecMetadata, sourceFile: string, baseLine?: number): Reference[];
/**
 * Parse a spec file
 */
export declare function parseSpec(filepath: string): {
    filepath: string;
    metadata: SpecMetadata;
    headerLines: number;
    content: string;
    blocks: Block[];
    references: Reference[];
    headerRaw: string;
};
/**
 * Parse spec from string content
 */
export declare function parseSpecContent(content: string, filepath?: string): {
    filepath: string;
    metadata: SpecMetadata;
    headerLines: number;
    content: string;
    blocks: Block[];
    references: Reference[];
    headerRaw: string;
};
//# sourceMappingURL=header.d.ts.map