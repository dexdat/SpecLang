/**
 * SPECLANG-GENERATED: Rust special type mappings (time, uuid, etc.)
 * Source: @speclang/codegen @block:rust-types-special
 */
import { TypeResolution } from './types';
export declare const TIME_TYPE_MAPPINGS: Record<string, {
    rust: string;
    import?: string;
    crate?: string;
    default?: string;
    methods?: string[];
    notes?: string;
}>;
export declare const UUID_MAPPING: {
    stdlib: string;
    rust: string;
    import: string;
    crate: string;
    default: string;
    methods: string[];
    variants: string[];
};
export declare const SERDE_TYPE_MAPPINGS: Record<string, string>;
export declare const TOKIO_TYPE_MAPPINGS: {
    Future: string;
    Stream: string;
    Mutex: string;
    RwLock: string;
    Channel: string;
};
export declare function toSerdeAttribute(stdlibType: string): string;
export declare function generateUseStatements(resolution: TypeResolution): string[];
export declare function resolveTimeType(stdlibType: string): TypeResolution | null;
export declare function resolveUUIDType(stdlibType: string): TypeResolution | null;
export declare function isTimeType(stdlibType: string): boolean;
export declare function isUUIDType(stdlibType: string): boolean;
export declare function getCrateDependencies(resolution: TypeResolution): string[];
//# sourceMappingURL=types_special.d.ts.map