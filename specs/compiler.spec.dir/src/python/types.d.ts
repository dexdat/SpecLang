/**
 * SPECLANG-GENERATED: Python type mappings
 * Source: @speclang/compiler.spec.dir/python
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
export declare function mapPythonType(stdlibType: string): {
    type: string;
    imports: string[];
};
export declare function getPythonZeroValue(stdlibType: string): string;
export declare function formatOptionalType(innerType: string, pythonVersion?: number): string;
export declare function hasOptionalDefault(stdlibType: string): boolean;
export declare function getOptionalDefault(stdlibType: string): string;
export interface NullableAnnotation {
    type: string;
    nullable: boolean;
    default?: string;
}
export declare function parseNullableField(typeStr: string): NullableAnnotation;
export declare const TIME_TYPE_MAPPINGS: {
    Date: {
        python: string;
        fromImport: string;
        default: string;
        methods: string[];
    };
    DateTime: {
        python: string;
        fromImport: string;
        default: string;
        methods: string[];
    };
    Time: {
        python: string;
        fromImport: string;
        default: string;
        methods: string[];
    };
    Duration: {
        python: string;
        fromImport: string;
        default: string;
        methods: string[];
    };
};
export declare const UUID_MAPPING: {
    stdlib: string;
    python: string;
    fromImport: string;
    default: string;
    methods: string[];
    notes: string;
};
export declare const ID_TYPE_MAPPINGS: {
    ID: {
        python: string;
        notes: string;
    };
    UUID: {
        python: string;
        fromImport: string;
    };
    ULID: {
        python: string;
        notes: string;
    };
    NanoID: {
        python: string;
        notes: string;
    };
    Slug: {
        python: string;
        notes: string;
    };
};
export declare const PYDANTIC_TYPE_MAPPINGS: Record<string, string>;
export declare function toPydanticType(stdlibType: string): string;
//# sourceMappingURL=types.d.ts.map