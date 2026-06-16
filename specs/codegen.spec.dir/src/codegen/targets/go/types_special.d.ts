/**
 * SPECLANG-GENERATED: Go special type handling (time, uuid, etc.)
 * Source: @speclang/codegen @block:go-types-special
 */
export declare const TIME_TYPE_MAPPINGS: {
    Date: {
        go: string;
        import: string;
        methods: string[];
    };
    DateTime: {
        go: string;
        import: string;
        methods: string[];
    };
    Time: {
        go: string;
        import: string;
        methods: string[];
    };
    Duration: {
        go: string;
        import: string;
        methods: string[];
    };
};
export declare const UUID_MAPPING: {
    stdlib: string;
    go: string;
    import: string;
    zeroValue: string;
    methods: string[];
    notes: string;
};
export declare const ID_TYPE_MAPPINGS: {
    ID: {
        go: string;
        notes: string;
    };
    UUID: {
        go: string;
        import: string;
    };
    ULID: {
        go: string;
        notes: string;
    };
    NanoID: {
        go: string;
        notes: string;
    };
};
export declare function isJSONType(stdlibType: string): boolean;
export declare function extractJSONType(stdlibType: string): string | null;
export declare function getSpecialTypeImport(stdlibType: string): string | null;
//# sourceMappingURL=types_special.d.ts.map