/**
 * SPECLANG-GENERATED: Go primitive type handling
 * Source: @speclang/codegen @block:go-types-primitives
 */
export interface PrimitiveMapping {
    stdlib: string;
    go: string;
    zeroValue: string;
}
export declare const PRIMITIVE_MAPPINGS: PrimitiveMapping[];
export declare function resolvePrimitive(stdlibType: string): PrimitiveMapping | undefined;
export declare function isPrimitive(stdlibType: string): boolean;
export declare function getZeroValue(stdlibType: string): string;
//# sourceMappingURL=types_primitives.d.ts.map