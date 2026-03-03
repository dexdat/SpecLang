/**
 * SPECLANG-GENERATED: Go type mappings
 * Source: @speclang/codegen @block:go-types
 */
export interface GoTypeMapping {
    stdlib: string;
    go: string;
    import?: string;
    zeroValue: string;
    notes?: string;
}
export interface TypeResolution {
    type: string;
    imports: string[];
    isPointer: boolean;
    isSlice: boolean;
    isMap: boolean;
}
export declare const GO_TYPE_MAPPINGS: GoTypeMapping[];
export declare function resolveGoType(stdlibType: string): TypeResolution;
declare function resolveGenericInternal(stdlibType: string): TypeResolution | null;
export { resolveGenericInternal as resolveGeneric };
//# sourceMappingURL=types.d.ts.map