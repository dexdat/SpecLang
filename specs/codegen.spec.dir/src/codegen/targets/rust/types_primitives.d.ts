/**
 * SPECLANG-GENERATED: Rust primitive type mappings
 * Source: @speclang/codegen @block:rust-types-primitives
 */
export declare const RUST_PRIMITIVE_MAPPINGS: {
    Int: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    Int8: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    Int16: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    Int32: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    Int64: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    Int128: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    UInt: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    UInt8: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    UInt16: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    UInt32: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    UInt64: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    UInt128: {
        rust: string;
        default: string;
        bits: number;
        signed: boolean;
    };
    Float32: {
        rust: string;
        default: string;
        bits: number;
    };
    Float64: {
        rust: string;
        default: string;
        bits: number;
    };
    Float: {
        rust: string;
        default: string;
        bits: number;
    };
    Bool: {
        rust: string;
        default: string;
    };
    Boolean: {
        rust: string;
        default: string;
    };
    Char: {
        rust: string;
        default: string;
    };
    Unit: {
        rust: string;
        default: string;
    };
    String: {
        rust: string;
        default: string;
    };
    Text: {
        rust: string;
        default: string;
    };
    Str: {
        rust: string;
        default: string;
    };
};
export declare function getPrimitiveDefault(stdlibType: string): string;
export declare function isPrimitiveType(stdlibType: string): boolean;
export declare function isIntegerType(stdlibType: string): boolean;
export declare function isFloatType(stdlibType: string): boolean;
export declare function isNumericType(stdlibType: string): boolean;
export declare function getIntegerRange(stdlibType: string): {
    min: number;
    max: number;
} | null;
//# sourceMappingURL=types_primitives.d.ts.map