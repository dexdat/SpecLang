/**
 * SPECLANG-GENERATED: TypeScript type mappings
 * Source: @speclang/codegen @block:typescript-types
 */
export interface TypeScriptTypeMapping {
    stdlib: string;
    typescript: string;
    import?: string;
    importType?: string;
    default?: string;
    notes?: string;
}
export interface TypeResolution {
    type: string;
    imports: Set<string>;
    isOptional: boolean;
    isUnion: boolean;
    isGeneric: boolean;
}
export declare const TYPESCRIPT_TYPE_MAPPINGS: TypeScriptTypeMapping[];
export declare function resolveTypeScriptType(stdlibType: string): TypeResolution;
declare function resolveGeneric(stdlibType: string): TypeResolution | null;
export { resolveGeneric as resolveGenericType };
//# sourceMappingURL=types.d.ts.map