/**
 * SPECLANG-GENERATED: TypeScript target generator
 * Source: @speclang/codegen @block:typescript-generator
 */
import type { ITargetGenerator, CodeSpec, GeneratedFile, TargetLanguage } from '../types';
export declare class TypeScriptGenerator implements ITargetGenerator {
    language: TargetLanguage;
    extension: string;
    /** Generate code from spec */
    generate(spec: CodeSpec): GeneratedFile[];
    /** Generate from code blocks */
    private generateFromBlocks;
    /** Generate a single block */
    private generateBlock;
    /** Generate interface from block */
    private generateInterface;
    /** Parse interface fields from content */
    private parseInterfaceFields;
    /** Generate function from block */
    private generateFunction;
    /** Generate class from block */
    private generateClass;
    /** Generate type from block */
    private generateType;
    /** Generate entity as interface */
    private generateEntity;
    /** Generate operation as function */
    private generateOperation;
    /** Generate placeholder file */
    private generatePlaceholder;
    /** Get output file path */
    private getOutputPath;
    /** Get output path for a block */
    private getBlockOutputPath;
    /** Parse parameters string */
    private parseParams;
    /** Map stdlib type to TypeScript */
    mapType(stdlibType: string): string;
    /** Format imports for TypeScript */
    formatImports(imports: string[]): string;
    /** Generate file header */
    fileHeader(spec: CodeSpec): string;
    /** Generate file footer */
    fileFooter(_spec: CodeSpec): string;
}
//# sourceMappingURL=typescript.d.ts.map