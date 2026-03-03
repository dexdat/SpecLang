/**
 * SPECLANG-GENERATED: Rust Option type mappings
 * Source: @speclang/codegen @block:rust-types-option
 */
import { TypeResolution } from './types';
export declare function formatOptionType(innerType: string): string;
export declare function isOptionType(stdlibType: string): boolean;
export declare function getOptionDefault(_stdlibType: string): string;
export declare function resolveOptionType(stdlibType: string): TypeResolution | null;
export declare const OPTION_PATTERNS: {
    some: string;
    none: string;
    isSome: string;
    isNone: string;
    unwrap: string;
    unwrapOr: string;
    unwrapOrElse: string;
    map: string;
    andThen: string;
    orElse: string;
};
export declare function generateOptionMatch(fieldName: string): string;
export declare function generateOptionMatchFull(fieldName: string, someExpr: string, noneExpr: string): string;
export declare function isOptionRustType(rustType: string): boolean;
export declare function extractOptionInner(rustType: string): string | null;
//# sourceMappingURL=types_option.d.ts.map