/**
 * SPECLANG-GENERATED: Go target generator
 * Source: @speclang/compiler.spec.dir/go
 */
import type { CodeSpec, GeneratedFile } from '../../codegen/types';
export interface GoField {
    name: string;
    type: string;
    jsonName?: string;
    optional?: boolean;
}
export interface GoGeneratorConfig {
    packageName?: string;
    addJsonTags?: boolean;
    addGormTags?: boolean;
}
export declare class GoGenerator {
    language: string;
    extension: string;
    private imports;
    private config;
    constructor(config?: GoGeneratorConfig);
    generate(spec: CodeSpec): GeneratedFile[];
    private generateFromBlocks;
    private generateBlock;
    private generateStructFromBlock;
    private generateInterfaceFromBlock;
    private generateFunctionFromBlock;
    private generateEnumFromBlock;
    private generatePlaceholder;
    private getOutputPath;
    private getBlockOutputPath;
    generateStruct(name: string, fields: GoField[]): string;
    generateInterface(name: string, methods: Array<{
        name: string;
        params: string;
        returns: string;
    }>): string;
    generateFunction(name: string, params: string, returns: string, body: string, receiver?: string): string;
    generateEnum(name: string, values: string[]): string;
    formatImports(): string;
    fileHeader(source: string, packageName: string): string;
    fileFooter(): string;
    mapType(stdlibType: string): string;
    private toPascalCase;
    private toCamelCase;
    private toSnakeCase;
    private toUpperSnakeCase;
}
export declare function createGoGenerator(config?: GoGeneratorConfig): GoGenerator;
//# sourceMappingURL=go.d.ts.map