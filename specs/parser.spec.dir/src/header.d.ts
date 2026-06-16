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
 * Extract all @ref: references from content
 */
export declare function extractReferences(content: string, sourceFile: string): Reference[];
/**
 * Extract references from metadata (depends_on, refs, children, parent)
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