/**
 * SPECLANG-GENERATED: Go code templates
 * Source: @speclang/compiler.spec.dir/go
 */
export declare const GO_TEMPLATES: {
    fileHeader: string;
    struct: string;
    field: string;
    jsonTag: string;
    interface: string;
    interfaceMethod: string;
    function: string;
    receiver: string;
    constructor: string;
    errorType: string;
    enum: string;
    httpHandler: string;
    importBlock: string;
    importSingle: string;
    fieldInit: string;
};
export declare function renderGoTemplate(template: string, vars: Record<string, string>): string;
export declare function toPascalCase(s: string): string;
export declare function toCamelCase(s: string): string;
export declare function toSnakeCase(s: string): string;
export declare function renderStruct(name: string, fields: {
    name: string;
    type: string;
    tag: string;
}[]): string;
export declare function renderInterface(name: string, methods: {
    name: string;
    params: string;
    returns: string;
}[]): string;
export declare function renderConstructor(name: string, fields: {
    name: string;
    type: string;
}[]): string;
export declare function renderImports(imports: string[]): string;
export declare function renderFile(pkg: string, imports: string[], body: string, source: string): string;
