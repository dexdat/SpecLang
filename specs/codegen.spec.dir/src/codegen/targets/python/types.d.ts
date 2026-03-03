/**
 * SPECLANG-GENERATED: Python type mappings
 * Source: @speclang/codegen @block:python-types
 */
export interface PythonTypeMapping {
    stdlib: string;
    python: string;
    import?: string;
    fromImport?: string;
    default: string;
    notes?: string;
}
export interface TypeResolution {
    type: string;
    imports: Set<string>;
    isOptional: boolean;
    isCollection: boolean;
}
export declare const PYTHON_TYPE_MAPPINGS: PythonTypeMapping[];
export declare function resolvePythonType(stdlibType: string): TypeResolution;
declare function resolveGenericInternal(stdlibType: string): TypeResolution | null;
export { resolveGenericInternal as resolveGeneric };
//# sourceMappingURL=types.d.ts.map