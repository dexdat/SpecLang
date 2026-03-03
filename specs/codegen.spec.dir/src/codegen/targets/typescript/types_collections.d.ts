/**
 * SPECLANG-GENERATED: TypeScript collection type handling
 * Source: @speclang/codegen @block:typescript-collections
 */
export interface CollectionMapping {
    stdlib: string;
    typescript: string;
    default: string;
}
export declare const COLLECTION_TYPE_MAPPINGS: CollectionMapping[];
export declare function isCollectionType(stdlibType: string): boolean;
export declare function resolveCollectionType(stdlibType: string): import("./types").TypeResolution;
export declare function getCollectionDefault(stdlibType: string): string;
//# sourceMappingURL=types_collections.d.ts.map