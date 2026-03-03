"use strict";
/**
 * SPECLANG-GENERATED: Python special types (datetime, uuid, etc.)
 * Source: @speclang/codegen @block:python-types-special
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PYDANTIC_TYPE_MAPPINGS = exports.ID_TYPE_MAPPINGS = exports.UUID_MAPPING = exports.TIME_TYPE_MAPPINGS = void 0;
exports.toPydanticType = toPydanticType;
exports.isTimeType = isTimeType;
exports.getTimeMapping = getTimeMapping;
exports.isUUIDType = isUUIDType;
exports.getUUIDMapping = getUUIDMapping;
exports.isIDType = isIDType;
exports.getIDMapping = getIDMapping;
exports.TIME_TYPE_MAPPINGS = {
    Date: {
        python: 'date',
        fromImport: 'datetime',
        default: 'date.today()',
        methods: ['year', 'month', 'day', 'isoformat']
    },
    DateTime: {
        python: 'datetime',
        fromImport: 'datetime',
        default: 'datetime.now()',
        methods: ['year', 'month', 'day', 'hour', 'minute', 'second', 'isoformat']
    },
    Time: {
        python: 'time',
        fromImport: 'datetime',
        default: 'time()',
        methods: ['hour', 'minute', 'second', 'isoformat']
    },
    Duration: {
        python: 'timedelta',
        fromImport: 'datetime',
        default: 'timedelta()',
        methods: ['total_seconds', 'days', 'seconds', 'microseconds']
    },
};
exports.UUID_MAPPING = {
    stdlib: 'UUID',
    python: 'UUID',
    fromImport: 'uuid',
    default: 'uuid4()',
    methods: ['urn', 'hex', 'int', 'str'],
    notes: 'Use uuid4() for random UUIDs, uuid1() for time-based'
};
exports.ID_TYPE_MAPPINGS = {
    ID: { python: 'int', notes: 'Auto-increment database ID' },
    UUID: { python: 'UUID', fromImport: 'uuid' },
    ULID: { python: 'str', notes: 'Lexicographically sortable' },
    NanoID: { python: 'str', notes: 'URL-friendly unique ID' },
    Slug: { python: 'str', notes: 'URL-safe identifier' },
};
exports.PYDANTIC_TYPE_MAPPINGS = {
    String: 'str',
    Int: 'int',
    Float: 'float',
    Bool: 'bool',
    UUID: 'UUID',
    DateTime: 'datetime',
    Date: 'date',
    Json: 'Json',
};
function toPydanticType(stdlibType) {
    const mapping = exports.PYDANTIC_TYPE_MAPPINGS[stdlibType];
    if (mapping)
        return mapping;
    const arrayMatch = stdlibType.match(/^Array<(.+)>$/);
    if (arrayMatch) {
        return `List[${toPydanticType(arrayMatch[1])}]`;
    }
    const mapMatch = stdlibType.match(/^Map<(.+),\s*(.+)>$/);
    if (mapMatch) {
        return `Dict[${toPydanticType(mapMatch[1])}, ${toPydanticType(mapMatch[2])}]`;
    }
    const optMatch = stdlibType.match(/^Optional<(.+)>$/);
    if (optMatch) {
        return `Optional[${toPydanticType(optMatch[1])}]`;
    }
    return stdlibType;
}
function isTimeType(stdlibType) {
    return stdlibType in exports.TIME_TYPE_MAPPINGS;
}
function getTimeMapping(stdlibType) {
    return exports.TIME_TYPE_MAPPINGS[stdlibType];
}
function isUUIDType(stdlibType) {
    return stdlibType === 'UUID';
}
function getUUIDMapping() {
    return exports.UUID_MAPPING;
}
function isIDType(stdlibType) {
    return stdlibType in exports.ID_TYPE_MAPPINGS;
}
function getIDMapping(stdlibType) {
    return exports.ID_TYPE_MAPPINGS[stdlibType];
}
//# sourceMappingURL=types_special.js.map