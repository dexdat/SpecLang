export interface ReferencePattern {
    child_to_parent: string[];
    parent_to_children: string[];
    example_header: string;
}
export interface FlatteningStrategy {
    purpose: string;
    approach: string[];
    benefits: string[];
}
export type SpecKind = 'entity' | 'operation' | 'code' | 'note' | 'table';
export interface CreateSpecOptions {
    parent: string;
    name: string;
    kind: SpecKind;
    content?: string;
}
/**
 * Create a new spec file following directory patterns
 */
export declare function createSpec(options: CreateSpecOptions): Promise<string>;
/**
 * SQLite tree queries for directory structure
 */
export declare const SQLITE_TREE_QUERIES: {
    getChildren: string;
    getFullTree: string;
    getParent: string;
};
/**
 * Git ignore rules for spec directories
 */
export declare const GIT_IGNORE_RULES = "# Symlinks are OK (they point to specs/)\n# Code lives in specs/, symlinks are just for convenience\n\n# Speclang internal\n.speclang/\n\n# Keep spec dirs\n!*.dir/\n!specs/\n";
//# sourceMappingURL=creator.d.ts.map