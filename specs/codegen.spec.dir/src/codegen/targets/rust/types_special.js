"use strict";
/**
 * SPECLANG-GENERATED: Rust special type mappings (time, uuid, etc.)
 * Source: @speclang/codegen @block:rust-types-special
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKIO_TYPE_MAPPINGS = exports.SERDE_TYPE_MAPPINGS = exports.UUID_MAPPING = exports.TIME_TYPE_MAPPINGS = void 0;
exports.toSerdeAttribute = toSerdeAttribute;
exports.generateUseStatements = generateUseStatements;
exports.resolveTimeType = resolveTimeType;
exports.resolveUUIDType = resolveUUIDType;
exports.isTimeType = isTimeType;
exports.isUUIDType = isUUIDType;
exports.getCrateDependencies = getCrateDependencies;
exports.TIME_TYPE_MAPPINGS = {
    Date: {
        rust: 'NaiveDate',
        import: 'chrono',
        crate: 'chrono',
        default: 'NaiveDate::MIN',
        methods: ['year', 'month', 'day', 'from_ymd_opt']
    },
    DateTime: {
        rust: 'DateTime<Utc>',
        import: 'chrono',
        crate: 'chrono',
        default: 'DateTime::MIN_UTC',
        methods: ['year', 'month', 'day', 'timestamp', 'now', 'from_timestamp']
    },
    Time: {
        rust: 'NaiveTime',
        import: 'chrono',
        crate: 'chrono',
        default: 'NaiveTime::MIN',
        methods: ['hour', 'minute', 'second', 'from_hms_opt']
    },
    Duration: {
        rust: 'Duration',
        import: 'std::time',
        default: 'Duration::ZERO',
        methods: ['as_secs', 'as_millis', 'from_secs', 'from_millis']
    },
    Timestamp: {
        rust: 'i64',
        notes: 'Unix timestamp in seconds'
    },
};
exports.UUID_MAPPING = {
    stdlib: 'UUID',
    rust: 'Uuid',
    import: 'uuid',
    crate: 'uuid',
    default: 'Uuid::nil()',
    methods: ['new_v4', 'nil', 'parse_str', 'to_string'],
    variants: ['Uuid::new_v4()', 'Uuid::nil()', 'Uuid::parse_str(s)']
};
exports.SERDE_TYPE_MAPPINGS = {
    String: 'String',
    Int: 'i32',
    Int64: 'i64',
    Float: 'f64',
    Bool: 'bool',
    UUID: 'Uuid',
    JSON: 'Value',
    Email: 'String',
};
exports.TOKIO_TYPE_MAPPINGS = {
    Future: 'impl Future<Output = T> + Send',
    Stream: 'impl Stream<Item = T>',
    Mutex: 'tokio::sync::Mutex<T>',
    RwLock: 'tokio::sync::RwLock<T>',
    Channel: 'tokio::sync::mpsc::Sender<T>',
};
function toSerdeAttribute(stdlibType) {
    const mapping = exports.SERDE_TYPE_MAPPINGS[stdlibType];
    if (mapping)
        return `#[serde(rename = "${mapping.toLowerCase()}")]`;
    return '';
}
function generateUseStatements(resolution) {
    const statements = [];
    for (const imp of resolution.imports) {
        statements.push(`use ${imp};`);
    }
    return statements;
}
function resolveTimeType(stdlibType) {
    const mapping = exports.TIME_TYPE_MAPPINGS[stdlibType];
    if (!mapping)
        return null;
    const imports = new Set();
    const crates = new Set();
    if (mapping.import)
        imports.add(mapping.import);
    if (mapping.crate)
        crates.add(mapping.crate);
    return {
        type: mapping.rust,
        imports,
        crates,
        isOption: false,
        isReference: false,
        isSmartPointer: false
    };
}
function resolveUUIDType(stdlibType) {
    if (stdlibType !== 'UUID')
        return null;
    const imports = new Set();
    const crates = new Set();
    if (exports.UUID_MAPPING.import)
        imports.add(exports.UUID_MAPPING.import);
    if (exports.UUID_MAPPING.crate)
        crates.add(exports.UUID_MAPPING.crate);
    return {
        type: exports.UUID_MAPPING.rust,
        imports,
        crates,
        isOption: false,
        isReference: false,
        isSmartPointer: false
    };
}
function isTimeType(stdlibType) {
    return stdlibType in exports.TIME_TYPE_MAPPINGS;
}
function isUUIDType(stdlibType) {
    return stdlibType === 'UUID';
}
function getCrateDependencies(resolution) {
    return Array.from(resolution.crates);
}
//# sourceMappingURL=types_special.js.map