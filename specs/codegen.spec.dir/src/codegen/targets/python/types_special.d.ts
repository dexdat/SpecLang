/**
 * SPECLANG-GENERATED: Python special types (datetime, uuid, etc.)
 * Source: @speclang/codegen @block:python-types-special
 */
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
export declare const PYDANTIC_TYPE_MAPPINGS: {
    String: string;
    Int: string;
    Float: string;
    Bool: string;
    UUID: string;
    DateTime: string;
    Date: string;
    Json: string;
};
export declare function toPydanticType(stdlibType: string): string;
export declare function isTimeType(stdlibType: string): boolean;
export declare function getTimeMapping(stdlibType: string): {
    python: string;
    fromImport: string;
    default: string;
    methods: string[];
} | {
    python: string;
    fromImport: string;
    default: string;
    methods: string[];
} | {
    python: string;
    fromImport: string;
    default: string;
    methods: string[];
} | {
    python: string;
    fromImport: string;
    default: string;
    methods: string[];
};
export declare function isUUIDType(stdlibType: string): boolean;
export declare function getUUIDMapping(): {
    stdlib: string;
    python: string;
    fromImport: string;
    default: string;
    methods: string[];
    notes: string;
};
export declare function isIDType(stdlibType: string): boolean;
export declare function getIDMapping(stdlibType: string): {
    python: string;
    notes: string;
} | {
    python: string;
    fromImport: string;
} | {
    python: string;
    notes: string;
} | {
    python: string;
    notes: string;
} | {
    python: string;
    notes: string;
};
//# sourceMappingURL=types_special.d.ts.map