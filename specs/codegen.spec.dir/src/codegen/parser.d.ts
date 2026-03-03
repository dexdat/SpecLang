/**
 * SPECLANG-GENERATED: Spec parser for codegen
 * Source: @speclang/codegen @block:parser
 */
import type { CodeSpec, CodeParserOptions } from './types';
/** Parse a spec file for code generation */
export declare function parseCodeSpec(filepath: string, options?: CodeParserOptions): CodeSpec;
/** Parse spec content string for code generation */
export declare function parseCodeSpecContent(content: string, filepath?: string): CodeSpec;
/** Find all spec files with code blocks in a directory */
export declare function findCodeSpecFiles(dir: string, recursive?: boolean): string[];
/** Check if a spec file has code blocks */
export declare function specHasCodeBlocks(filepath: string): boolean;
//# sourceMappingURL=parser.d.ts.map