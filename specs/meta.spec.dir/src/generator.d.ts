import { ProjectSpec, GenerateOptions, GenerateResult, UpdateResult } from "./types.js";
/**
 * SpecGenerator - Generate spec files from existing code
 *
 * This is the core component for making SpecLang self-specifying.
 * It can analyze TypeScript, Go, Python, and other code files
 * and generate corresponding spec files.
 */
export declare class SpecGenerator {
    private projectRoot;
    private options;
    constructor(projectRoot?: string, options?: GenerateOptions);
    /**
     * Generate a spec file from a TypeScript source file
     */
    generateFromTypeScript(filepath: string): Promise<GenerateResult>;
    /**
     * Generate a spec file from a Go source file
     */
    generateFromGo(filepath: string): Promise<GenerateResult>;
    /**
     * Generate a spec file from a Python source file
     */
    generateFromPython(filepath: string): Promise<GenerateResult>;
    /**
     * Generate project-level spec containing all specs
     */
    generateProjectSpec(): Promise<ProjectSpec>;
    /**
     * Update an existing spec from code changes
     */
    updateSpecFromCode(specPath: string, codePath: string): Promise<UpdateResult>;
    /**
     * Generate specs for all source files in a directory
     */
    generateFromDirectory(dirPath: string, specOutputDir: string): Promise<GenerateResult[]>;
    private typescriptToSpec;
    private goToSpec;
    private pythonToSpec;
    private extractFileHeader;
    private extractBlocksFromTypeScript;
    private extractBlocksFromGo;
    private extractBlocksFromPython;
    private extractReferences;
    private renderSpecFile;
    private renderHeader;
    private renderBlock;
    private findNorthstar;
    private findSpecsByLayer;
    private findGeneratedSpecs;
    private findImplementationSpecs;
    private parseSpecFile;
    private parseHeader;
    private parseBlocks;
    private detectChanges;
    private applyChanges;
    private getSourceFiles;
    private specPathForCode;
}
export default SpecGenerator;
//# sourceMappingURL=generator.d.ts.map