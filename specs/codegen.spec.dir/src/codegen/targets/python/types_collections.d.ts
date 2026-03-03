/**
 * SPECLANG-GENERATED: Python collection type handling
 * Source: @speclang/codegen @block:python-types-collections
 */
import { type TypeResolution } from './types';
export interface CollectionMapping {
    stdlib: string;
    python: string;
    import: string;
    default: string;
}
export declare const COLLECTION_MAPPINGS: CollectionMapping[];
export declare function isCollectionType(stdlibType: string): boolean;
export declare function resolveCollectionType(stdlibType: string): TypeResolution | null;
export declare function getCollectionDefault(stdlibType: string): string;
//# sourceMappingURL=types_collections.d.ts.map