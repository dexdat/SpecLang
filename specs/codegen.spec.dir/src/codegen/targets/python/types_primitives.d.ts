/**
 * SPECLANG-GENERATED: Python primitive type handling
 * Source: @speclang/codegen @block:python-types-primitives
 */
export interface PrimitiveMapping {
    stdlib: string;
    python: string;
    default: string;
    python310?: string;
}
export declare const PRIMITIVE_MAPPINGS: PrimitiveMapping[];
export declare function getPrimitivePythonType(stdlibType: string): string | undefined;
export declare function getPrimitiveDefault(stdlibType: string): string | undefined;
export declare function isPrimitiveType(stdlibType: string): boolean;
//# sourceMappingURL=types_primitives.d.ts.map