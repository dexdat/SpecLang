/**
 * SPECLANG-GENERATED: Codegen types
 * Source: @speclang/codegen
 */
import type { SpecMetadata } from '../parser/types';
/** Supported target languages */
export type TargetLanguage = 'typescript' | 'go' | 'python' | 'rust';
/** Target configuration */
export interface TargetConfig {
    language: TargetLanguage;
    outputPath: string;
    options?: Record<string, unknown>;
}
/** Code block extracted from spec */
export interface CodeBlock {
    /** Block ID like @block:auth/login */
    id: string;
    /** Block kind */
    kind: 'code' | 'interface' | 'function' | 'class' | 'type' | 'struct' | 'entity' | 'operation' | 'impl' | 'enum';
    /** Source language hint */
    language: string;
    /** Code content */
    content: string;
    /** @ref: markers */
    refs: string[];
    /** Line number in source */
    line: number;
}
/** Complete code spec parsed from file */
export interface CodeSpec {
    /** Spec metadata */
    header: SpecMetadata;
    /** Target configuration */
    target: TargetConfig;
    /** Extracted code blocks */
    blocks: CodeBlock[];
    /** Required imports */
    imports: string[];
    /** Source file path */
    sourceFile: string;
}
/** Generated file output */
export interface GeneratedFile {
    /** Output file path */
    path: string;
    /** File content */
    content: string;
    /** Source block ID */
    sourceBlock: string;
    /** Language */
    language: TargetLanguage;
}
/** Generator result */
export interface GenerateResult {
    /** Successfully generated files */
    generated: GeneratedFile[];
    /** Skipped files (unchanged) */
    skipped: string[];
    /** Errors */
    errors: Array<{
        file: string;
        error: string;
    }>;
    /** Generation timestamp */
    timestamp: string;
}
/** Standard library types */
export type StdlibType = 'String' | 'Int' | 'Float' | 'Bool' | 'Date' | 'DateTime' | 'Timestamp' | 'UUID' | 'JSON' | 'Any' | 'Array<T>' | 'Map<K,V>' | 'Optional<T>' | 'Result<T,E>' | 'Void' | 'Binary' | 'Bytes';
/** Type mapping for a single type */
export interface TypeMapping {
    /** Stdlib type name */
    stdlib: StdlibType;
    /** TypeScript mapping */
    typescript: string;
    /** Go mapping */
    go: string;
    /** Python mapping */
    python: string;
    /** Rust mapping */
    rust: string;
}
/** Template definition */
export interface Template {
    /** Template name */
    name: string;
    /** Target language */
    target: TargetLanguage;
    /** Template content with placeholders */
    content: string;
    /** Required variables */
    variables: string[];
}
/** Target generator interface */
export interface ITargetGenerator {
    /** Language identifier */
    language: TargetLanguage;
    /** File extension */
    extension: string;
    /** Generate code from spec */
    generate(spec: CodeSpec): GeneratedFile[];
    /** Map stdlib type to target type */
    mapType(stdlibType: string): string;
    /** Format imports for target */
    formatImports(imports: string[]): string;
    /** Generate file header */
    fileHeader(spec: CodeSpec): string;
    /** Generate file footer */
    fileFooter(spec: CodeSpec): string;
}
/** Write result */
export interface WriteResult {
    /** Successfully written files */
    written: string[];
    /** Skipped files */
    skipped: string[];
    /** Errors */
    errors: Array<{
        file: string;
        error: string;
    }>;
}
/** Parser options for code spec */
export interface CodeParserOptions {
    /** Base directory */
    baseDir?: string;
    /** Extract code blocks only */
    extractCodeOnly?: boolean;
    /** Validate refs */
    validateRefs?: boolean;
}
/** Default parser options */
export declare const DEFAULT_CODE_PARSER_OPTIONS: CodeParserOptions;
//# sourceMappingURL=types.d.ts.map