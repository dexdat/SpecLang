/**
 * SPECLANG-GENERATED: Go target generator
 * Source: @speclang/codegen @block:go-generator
 */
import type { ITargetGenerator, CodeSpec, GeneratedFile, TargetLanguage } from '../types';
export declare class GoGenerator implements ITargetGenerator {
    language: TargetLanguage;
    extension: string;
    /** Generate code from spec */
    generate(spec: CodeSpec): GeneratedFile[];
    /** Generate from code blocks */
    private generateFromBlocks;
    /** Convert TypeScript-like content to Go */
    private convertToGo;
    /** Map field to Go format */
    private goFieldMapper;
    /** Generate a single block */
    private generateBlock;
    /** Generate struct from block */
    private generateStruct;
    /** Generate function from block */
    private generateFunc;
    /** Generate interface from block */
    private generateInterface;
    /** Generate placeholder file */
    private generatePlaceholder;
    /** Get output file path */
    private getOutputPath;
    /** Get output path for a block */
    private getBlockOutputPath;
    /** Map stdlib type to Go */
    mapType(stdlibType: string): string;
    /** Format imports for Go */
    formatImports(imports: string[]): string;
    /** Generate file header */
    fileHeader(spec: CodeSpec): string;
    /** Generate file footer */
    fileFooter(_spec: CodeSpec): string;
}
//# sourceMappingURL=go.d.ts.map