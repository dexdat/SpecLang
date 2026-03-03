/**
 * SPECLANG-GENERATED: Python target generator
 * Source: @speclang/codegen @block:python-generator
 */
import type { ITargetGenerator, CodeSpec, GeneratedFile, TargetLanguage } from '../types';
export declare class PythonGenerator implements ITargetGenerator {
    language: TargetLanguage;
    extension: string;
    /** Generate code from spec */
    generate(spec: CodeSpec): GeneratedFile[];
    /** Generate from code blocks */
    private generateFromBlocks;
    /** Convert TypeScript-like content to Python */
    private convertToPython;
    /** Generate a single block */
    private generateBlock;
    /** Generate class from block */
    private generateClass;
    /** Generate function from block */
    private generateFunction;
    /** Generate dataclass from block */
    private generateDataclass;
    /** Generate type alias */
    private generateTypeAlias;
    /** Generate placeholder file */
    private generatePlaceholder;
    /** Get output file path */
    private getOutputPath;
    /** Get output path for a block */
    private getBlockOutputPath;
    /** Map stdlib type to Python */
    mapType(stdlibType: string): string;
    /** Format imports for Python */
    formatImports(imports: string[]): string;
    /** Generate file header */
    fileHeader(spec: CodeSpec): string;
    /** Generate file footer */
    fileFooter(_spec: CodeSpec): string;
}
//# sourceMappingURL=python.d.ts.map