/**
 * SPECLANG-GENERATED: Go type mappings
 * Source: @speclang/compiler.spec.dir/go
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
export declare function mapGoType(stdlibType: string): {
    type: string;
    imports: string[];
};
export declare function getGoZeroValue(stdlibType: string): string;
export declare function resolveGoType(stdlibType: string): TypeResolution;
export declare function isJSONType(stdlibType: string): boolean;
export declare function extractJSONType(stdlibType: string): string | null;
//# sourceMappingURL=types.d.ts.map