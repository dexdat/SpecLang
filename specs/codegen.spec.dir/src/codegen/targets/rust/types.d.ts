/**
 * SPECLANG-GENERATED: Rust type mappings
 * Source: @speclang/codegen @block:rust-types
 */
export interface RustTypeMapping {
    stdlib: string;
    rust: string;
    import?: string;
    crate?: string;
    default: string;
    notes?: string;
}
export interface TypeResolution {
    type: string;
    imports: Set<string>;
    crates: Set<string>;
    isOption: boolean;
    isReference: boolean;
    isSmartPointer: boolean;
}
export declare const RUST_TYPE_MAPPINGS: RustTypeMapping[];
export declare function resolveRustType(stdlibType: string): TypeResolution;
declare function resolveGeneric(stdlibType: string): TypeResolution | null;
export { resolveGeneric as resolveGenericType };
//# sourceMappingURL=types.d.ts.map