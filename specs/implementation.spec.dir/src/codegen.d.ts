export interface CodeGenSpec {
    id: string;
    target: 'go' | 'typescript' | 'python' | 'rust' | 'java' | 'javascript';
    produces: string;
    layer: number;
    refs: string[];
    blocks: CodeBlock[];
}
export interface CodeBlock {
    id: string;
    kind: 'code' | 'entity' | 'operation';
    language?: string;
    content: string;
}
export interface CodeGenResult {
    success: boolean;
    outputPath: string;
    generatedCode: string;
    errors: string[];
    warnings: string[];
}
export declare class SpecParser {
    static parseSpec(filePath: string): Promise<CodeGenSpec>;
}
export declare class GoCodeGenerator {
    static generate(block: CodeBlock): string;
}
export declare class TypeScriptCodeGenerator {
    static generate(block: CodeBlock): string;
}
export declare class PythonCodeGenerator {
    static generate(block: CodeBlock): string;
}
export declare class CodeGenerator {
    static generateFromSpec(specFilePath: string): Promise<CodeGenResult>;
    static generateAll(specDir?: string): Promise<CodeGenResult[]>;
    private static findSpecFiles;
}
//# sourceMappingURL=codegen.d.ts.map