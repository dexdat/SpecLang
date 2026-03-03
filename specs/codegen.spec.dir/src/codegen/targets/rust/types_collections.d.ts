/**
 * SPECLANG-GENERATED: Rust collection type mappings
 * Source: @speclang/codegen @block:rust-types-collections
 */
import { TypeResolution } from './types';
export declare const RUST_COLLECTION_MAPPINGS: {
    Array: {
        rust: string;
        import: string;
        default: string;
    };
    List: {
        rust: string;
        import: string;
        default: string;
    };
    Vec: {
        rust: string;
        import: string;
        default: string;
    };
    Slice: {
        rust: string;
        import: any;
        default: string;
    };
    Map: {
        rust: string;
        import: string;
        default: string;
    };
    BTreeMap: {
        rust: string;
        import: string;
        default: string;
    };
    Set: {
        rust: string;
        import: string;
        default: string;
    };
    BTreeSet: {
        rust: string;
        import: string;
        default: string;
    };
};
export declare function resolveCollectionType(stdlibType: string): TypeResolution | null;
export declare function isCollectionType(stdlibType: string): boolean;
export declare function getCollectionDefault(stdlibType: string): string;
//# sourceMappingURL=types_collections.d.ts.map