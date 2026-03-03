/**
 * SPECLANG-GENERATED: Python target generator
 * Source: @speclang/compiler.spec.dir/python
 */
import type { CodeSpec, GeneratedFile } from '../../codegen/types';
export interface PythonField {
    name: string;
    type: string;
    optional?: boolean;
    default?: string;
}
export interface PythonGeneratorConfig {
    useDataclass?: boolean;
    usePydantic?: boolean;
    addTypeHints?: boolean;
}
export declare class PythonGenerator {
    language: string;
    extension: string;
    private imports;
    private fromImports;
    private config;
    constructor(config?: PythonGeneratorConfig);
    generate(spec: CodeSpec): GeneratedFile[];
    private generateFromBlocks;
    private generateBlock;
    private generateDataclassFromBlock;
    private generateProtocolFromBlock;
    private generateFunctionFromBlock;
    private generateClassFromBlock;
    private generateEnumFromBlock;
    private generatePlaceholder;
    private getOutputPath;
    private getBlockOutputPath;
    generateDataclass(name: string, fields: PythonField[]): string;
    generatePydanticModel(name: string, fields: PythonField[]): string;
    generateFunction(name: string, params: string, returns: string, body: string, isAsync?: boolean): string;
    generateEnum(name: string, values: string[]): string;
    generateProtocol(name: string, methods: Array<{
        name: string;
        params: string;
        returns: string;
    }>): string;
    formatImports(): string;
    fileHeader(source: string): string;
    fileFooter(): string;
    mapType(stdlibType: string): string;
    private toPascalCase;
    private toSnakeCase;
    private toUpperSnakeCase;
}
export declare function createPythonGenerator(config?: PythonGeneratorConfig): PythonGenerator;
//# sourceMappingURL=python.d.ts.map