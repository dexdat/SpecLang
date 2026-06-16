/**
 * SPECLANG-GENERATED: Rust target generator
 * Source: @speclang/codegen @block:rust-generator
 */
import type { ITargetGenerator, CodeSpec, GeneratedFile, TargetLanguage } from '../types';
export declare class RustGenerator implements ITargetGenerator {
    language: TargetLanguage;
    extension: string;
    /** Generate code from spec */
    generate(spec: CodeSpec): GeneratedFile[];
    /** Generate from code blocks */
    private generateFromBlocks;
    /** Convert TypeScript-like content to Rust */
    private convertToRust;
    /** Generate a single block */
    private generateBlock;
    /** Generate struct from block */
    private generateStruct;
    /** Generate function from block */
    private generateFunction;
    /** Generate impl block */
    private generateImpl;
    /** Generate enum from block */
    private generateEnum;
    /** Generate placeholder file */
    private generatePlaceholder;
    /** Get output file path */
    private getOutputPath;
    /** Get output path for a block */
    private getBlockOutputPath;
    /** Map stdlib type to Rust */
    mapType(stdlibType: string): string;
    /** Format imports for Rust */
    formatImports(imports: string[]): string;
    /** Generate file header */
    fileHeader(spec: CodeSpec): string;
    /** Generate file footer */
    fileFooter(_spec: CodeSpec): string;
}
//# sourceMappingURL=rust.d.ts.map