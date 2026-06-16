"use strict";
/**
 * SPECLANG-GENERATED: Go special type handling (time, uuid, etc.)
 * Source: @speclang/codegen @block:go-types-special
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ID_TYPE_MAPPINGS = exports.UUID_MAPPING = exports.TIME_TYPE_MAPPINGS = void 0;
exports.isJSONType = isJSONType;
exports.extractJSONType = extractJSONType;
exports.getSpecialTypeImport = getSpecialTypeImport;
exports.TIME_TYPE_MAPPINGS = {
    Date: { go: 'time.Time', import: 'time', methods: ['Year', 'Month', 'Day'] },
    DateTime: { go: 'time.Time', import: 'time', methods: ['Year', 'Month', 'Day', 'Hour', 'Minute', 'Second'] },
    Time: { go: 'time.Time', import: 'time', methods: ['Hour', 'Minute', 'Second', 'Nanosecond'] },
    Duration: { go: 'time.Duration', import: 'time', methods: ['Hours', 'Minutes', 'Seconds', 'Milliseconds'] },
};
exports.UUID_MAPPING = {
    stdlib: 'UUID',
    go: 'uuid.UUID',
    import: 'github.com/google/uuid',
    zeroValue: 'uuid.Nil',
    methods: ['String', 'Bytes', 'Parse'],
    notes: 'Requires github.com/google/uuid package'
};
exports.ID_TYPE_MAPPINGS = {
    ID: { go: 'uint64', notes: 'Auto-increment database ID' },
    UUID: { go: 'uuid.UUID', import: 'github.com/google/uuid' },
    ULID: { go: 'string', notes: 'Lexicographically sortable UUID' },
    NanoID: { go: 'string', notes: 'URL-friendly unique ID' },
};
function isJSONType(stdlibType) {
    return stdlibType.startsWith('JSON<');
}
function extractJSONType(stdlibType) {
    const match = stdlibType.match(/^JSON<(.+)>$/);
    return match ? match[1] : null;
}
function getSpecialTypeImport(stdlibType) {
    if (['Date', 'DateTime', 'Time', 'Duration'].includes(stdlibType)) {
        return 'time';
    }
    if (stdlibType === 'UUID') {
        return 'github.com/google/uuid';
    }
    if (isJSONType(stdlibType)) {
        return 'encoding/json';
    }
    return null;
}
//# sourceMappingURL=types_special.js.map