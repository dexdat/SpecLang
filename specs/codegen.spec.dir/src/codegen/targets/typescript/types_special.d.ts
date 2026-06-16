/**
 * SPECLANG-GENERATED: TypeScript special types (date, uuid, etc.)
 * Source: @speclang/codegen @block:typescript-special
 */
export declare const DATE_TYPE_MAPPINGS: {
    Date: {
        typescript: string;
        import: string;
        default: string;
    };
    DateTime: {
        typescript: string;
        import: string;
        default: string;
    };
    Time: {
        typescript: string;
        notes: string;
        default: string;
    };
    Duration: {
        typescript: string;
        notes: string;
        default: string;
    };
    Timestamp: {
        typescript: string;
        notes: string;
        default: string;
    };
};
export declare const UUID_MAPPING: {
    stdlib: string;
    typescript: string;
    notes: string;
    default: string;
};
export declare const BYTES_TYPE_MAPPINGS: {
    Bytes: {
        typescript: string;
        default: string;
    };
    Blob: {
        typescript: string;
        import: string;
    };
    ArrayBuffer: {
        typescript: string;
        import: string;
    };
    SharedArrayBuffer: {
        typescript: string;
        import: string;
    };
};
export declare const NODE_TYPE_MAPPINGS: {
    Readable: {
        typescript: string;
        import: string;
    };
    Writable: {
        typescript: string;
        import: string;
    };
    Buffer: {
        typescript: string;
        import: string;
    };
    Process: {
        typescript: string;
        import: string;
    };
};
export declare const ZOD_TYPE_MAPPINGS: Record<string, string>;
export declare function toZodSchema(stdlibType: string): string;
export declare function isDateType(stdlibType: string): boolean;
export declare function isUUIDType(stdlibType: string): boolean;
export declare function isBytesType(stdlibType: string): boolean;
//# sourceMappingURL=types_special.d.ts.map