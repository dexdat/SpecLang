"use strict";
/**
 * SPECLANG-GENERATED: Python type mappings
 * Source: @speclang/compiler.spec.dir/python
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PYDANTIC_TYPE_MAPPINGS = exports.ID_TYPE_MAPPINGS = exports.UUID_MAPPING = exports.TIME_TYPE_MAPPINGS = exports.PYTHON_TYPE_MAPPINGS = void 0;
exports.resolvePythonType = resolvePythonType;
exports.mapPythonType = mapPythonType;
exports.getPythonZeroValue = getPythonZeroValue;
exports.formatOptionalType = formatOptionalType;
exports.hasOptionalDefault = hasOptionalDefault;
exports.getOptionalDefault = getOptionalDefault;
exports.parseNullableField = parseNullableField;
exports.toPydanticType = toPydanticType;
exports.PYTHON_TYPE_MAPPINGS = [
    // Primitives - Basic
    { stdlib: 'String', python: 'str', default: '""' },
    { stdlib: 'Int', python: 'int', default: '0' },
    { stdlib: 'Int8', python: 'int', default: '0' },
    { stdlib: 'Int16', python: 'int', default: '0' },
    { stdlib: 'Int32', python: 'int', default: '0' },
    { stdlib: 'Int64', python: 'int', default: '0' },
    { stdlib: 'UInt', python: 'int', default: '0' },
    { stdlib: 'UInt8', python: 'int', default: '0' },
    { stdlib: 'UInt16', python: 'int', default: '0' },
    { stdlib: 'UInt32', python: 'int', default: '0' },
    { stdlib: 'UInt64', python: 'int', default: '0' },
    { stdlib: 'Float32', python: 'float', default: '0.0' },
    { stdlib: 'Float64', python: 'float', default: '0.0' },
    { stdlib: 'Float', python: 'float', default: '0.0' },
    { stdlib: 'Bool', python: 'bool', default: 'False' },
    { stdlib: 'Boolean', python: 'bool', default: 'False' },
    // Primitives - String variants
    { stdlib: 'Char', python: 'str', default: '""' },
    { stdlib: 'Text', python: 'str', default: '""' },
    // Time types
    { stdlib: 'Date', python: 'date', fromImport: 'datetime', default: 'date.today()' },
    { stdlib: 'DateTime', python: 'datetime', fromImport: 'datetime', default: 'datetime.now()' },
    { stdlib: 'Time', python: 'time', fromImport: 'datetime', default: 'time()' },
    { stdlib: 'Duration', python: 'timedelta', fromImport: 'datetime', default: 'timedelta()' },
    { stdlib: 'Timestamp', python: 'datetime', fromImport: 'datetime', default: 'datetime.now()' },
    // Identifiers
    { stdlib: 'UUID', python: 'UUID', fromImport: 'uuid', default: 'uuid4()' },
    { stdlib: 'ID', python: 'int', default: '0', notes: 'Auto-increment ID' },
    // Collections - base types (generics handled separately)
    { stdlib: 'Array<T>', python: 'list[T]', import: 'typing', default: '[]' },
    { stdlib: 'List<T>', python: 'list[T]', import: 'typing', default: '[]' },
    { stdlib: 'Sequence<T>', python: 'Sequence[T]', import: 'typing', default: '[]' },
    { stdlib: 'Map<K,V>', python: 'dict[K, V]', import: 'typing', default: '{}' },
    { stdlib: 'Dict<K,V>', python: 'dict[K, V]', import: 'typing', default: '{}' },
    { stdlib: 'Set<T>', python: 'set[T]', import: 'typing', default: 'set()' },
    { stdlib: 'FrozenSet<T>', python: 'frozenset[T]', import: 'typing', default: 'frozenset()' },
    { stdlib: 'Tuple<T...>', python: 'tuple[T, ...]', import: 'typing', default: '()' },
    // Optional
    { stdlib: 'Optional<T>', python: 'T | None', default: 'None' },
    { stdlib: 'Nullable<T>', python: 'T | None', default: 'None' },
    // Error handling
    { stdlib: 'Result<T>', python: 'T', default: 'None', notes: 'Use with exception handling' },
    { stdlib: 'Result<T,E>', python: 'tuple[T, E]', import: 'typing', default: 'None' },
    { stdlib: 'Error', python: 'Exception', default: 'None' },
    // Bytes
    { stdlib: 'Bytes', python: 'bytes', default: 'b""' },
    { stdlib: 'ByteArray', python: 'bytearray', default: 'bytearray()' },
    { stdlib: 'Blob', python: 'bytes', default: 'b""' },
    { stdlib: 'Binary', python: 'bytes', default: 'b""' },
    // Any
    { stdlib: 'Any', python: 'Any', import: 'typing', default: 'None' },
    { stdlib: 'Unknown', python: 'Any', import: 'typing', default: 'None' },
    { stdlib: 'Object', python: 'object', default: 'None' },
    // JSON
    { stdlib: 'JSON<T>', python: 'dict[str, Any]', import: 'typing', default: '{}' },
    { stdlib: 'JSON', python: 'dict', import: 'typing', default: '{}' },
    // Callable
    { stdlib: 'Callable<Args,Ret>', python: 'Callable[Args, Ret]', import: 'typing', default: 'None' },
    // Iterator
    { stdlib: 'Iterator<T>', python: 'Iterator[T]', import: 'typing', default: 'None' },
    { stdlib: 'Generator<T>', python: 'Generator[T, None, None]', import: 'typing', default: 'None' },
    // Literal
    { stdlib: 'Literal<T>', python: 'Literal[T]', import: 'typing', default: 'None' },
    // Union (explicit)
    { stdlib: 'Union<A,B>', python: 'A | B', default: 'None' },
    // Void/None
    { stdlib: 'Void', python: 'None', default: 'None' },
    { stdlib: 'None', python: 'None', default: 'None' },
];
function resolveGeneric(stdlibType) {
    // Array<T> / List<T> -> list[T]
    const listMatch = stdlibType.match(/^(?:Array|List)<(.+)>$/);
    if (listMatch) {
        const inner = resolvePythonType(listMatch[1]);
        return {
            type: `list[${inner.type}]`,
            imports: new Set([...inner.imports, 'typing']),
            isOptional: false,
            isCollection: true,
        };
    }
    // Sequence<T> -> Sequence[T]
    const seqMatch = stdlibType.match(/^Sequence<(.+)>$/);
    if (seqMatch) {
        const inner = resolvePythonType(seqMatch[1]);
        return {
            type: `Sequence[${inner.type}]`,
            imports: new Set([...inner.imports, 'typing']),
            isOptional: false,
            isCollection: true,
        };
    }
    // Map<K,V> / Dict<K,V> -> dict[K, V]
    const dictMatch = stdlibType.match(/^(?:Map|Dict)<(.+),\s*(.+)>$/);
    if (dictMatch) {
        const key = resolvePythonType(dictMatch[1]);
        const value = resolvePythonType(dictMatch[2]);
        return {
            type: `dict[${key.type}, ${value.type}]`,
            imports: new Set([...key.imports, ...value.imports, 'typing']),
            isOptional: false,
            isCollection: true,
        };
    }
    // Set<T> -> set[T]
    const setMatch = stdlibType.match(/^Set<(.+)>$/);
    if (setMatch) {
        const inner = resolvePythonType(setMatch[1]);
        return {
            type: `set[${inner.type}]`,
            imports: new Set([...inner.imports, 'typing']),
            isOptional: false,
            isCollection: true,
        };
    }
    // FrozenSet<T> -> frozenset[T]
    const frozenSetMatch = stdlibType.match(/^FrozenSet<(.+)>$/);
    if (frozenSetMatch) {
        const inner = resolvePythonType(frozenSetMatch[1]);
        return {
            type: `frozenset[${inner.type}]`,
            imports: new Set([...inner.imports, 'typing']),
            isOptional: false,
            isCollection: true,
        };
    }
    // Tuple<T...> -> tuple[T, ...]
    const tupleMatch = stdlibType.match(/^Tuple<(.+)>$/);
    if (tupleMatch) {
        const innerTypes = tupleMatch[1].split(',').map((t) => resolvePythonType(t.trim()));
        const allImports = innerTypes.flatMap((t) => [...t.imports]);
        return {
            type: `tuple[${innerTypes.map((t) => t.type).join(', ')}]`,
            imports: new Set([...allImports, 'typing']),
            isOptional: false,
            isCollection: true,
        };
    }
    // Optional<T> -> T | None
    const optMatch = stdlibType.match(/^(?:Optional|Nullable)<(.+)>$/);
    if (optMatch) {
        const inner = resolvePythonType(optMatch[1]);
        return {
            type: `${inner.type} | None`,
            imports: inner.imports,
            isOptional: true,
            isCollection: false,
        };
    }
    // Callable<Args,Ret> -> Callable[Args, Ret]
    const callableMatch = stdlibType.match(/^Callable<(.+),\s*(.+)>$/);
    if (callableMatch) {
        const args = resolvePythonType(callableMatch[1]);
        const ret = resolvePythonType(callableMatch[2]);
        return {
            type: `Callable[${args.type}, ${ret.type}]`,
            imports: new Set([...args.imports, ...ret.imports, 'typing']),
            isOptional: false,
            isCollection: false,
        };
    }
    // Iterator<T> -> Iterator[T]
    const iterMatch = stdlibType.match(/^Iterator<(.+)>$/);
    if (iterMatch) {
        const inner = resolvePythonType(iterMatch[1]);
        return {
            type: `Iterator[${inner.type}]`,
            imports: new Set([...inner.imports, 'typing']),
            isOptional: false,
            isCollection: false,
        };
    }
    // Generator<T> -> Generator[T, None, None]
    const genMatch = stdlibType.match(/^Generator<(.+)>$/);
    if (genMatch) {
        const inner = resolvePythonType(genMatch[1]);
        return {
            type: `Generator[${inner.type}, None, None]`,
            imports: new Set([...inner.imports, 'typing']),
            isOptional: false,
            isCollection: false,
        };
    }
    // Result<T,E> -> tuple[T, E]
    const resultMatch = stdlibType.match(/^Result<(.+),\s*(.+)>$/);
    if (resultMatch) {
        const ok = resolvePythonType(resultMatch[1]);
        const err = resolvePythonType(resultMatch[2]);
        return {
            type: `tuple[${ok.type}, ${err.type}]`,
            imports: new Set([...ok.imports, ...err.imports, 'typing']),
            isOptional: false,
            isCollection: false,
        };
    }
    // JSON<T> -> dict[str, Any]
    const jsonMatch = stdlibType.match(/^JSON<(.+)>$/);
    if (jsonMatch) {
        return {
            type: 'dict[str, Any]',
            imports: new Set(['typing']),
            isOptional: false,
            isCollection: false,
        };
    }
    // Literal<T> -> Literal[T]
    const literalMatch = stdlibType.match(/^Literal<(.+)>$/);
    if (literalMatch) {
        return {
            type: `Literal[${literalMatch[1]}]`,
            imports: new Set(['typing']),
            isOptional: false,
            isCollection: false,
        };
    }
    // Union<A,B> -> A | B
    const unionMatch = stdlibType.match(/^Union<(.+),\s*(.+)>$/);
    if (unionMatch) {
        const a = resolvePythonType(unionMatch[1]);
        const b = resolvePythonType(unionMatch[2]);
        return {
            type: `${a.type} | ${b.type}`,
            imports: new Set([...a.imports, ...b.imports]),
            isOptional: true,
            isCollection: false,
        };
    }
    return null;
}
function resolvePythonType(stdlibType) {
    // Handle generics first
    const generic = resolveGeneric(stdlibType);
    if (generic)
        return generic;
    // Lookup base type
    const mapping = exports.PYTHON_TYPE_MAPPINGS.find((m) => m.stdlib === stdlibType);
    if (mapping) {
        const imports = new Set();
        if (mapping.import)
            imports.add(mapping.import);
        if (mapping.fromImport)
            imports.add(mapping.fromImport);
        return {
            type: mapping.python,
            imports,
            isOptional: false,
            isCollection: false,
        };
    }
    // Unknown type - pass through
    return {
        type: stdlibType,
        imports: new Set(),
        isOptional: false,
        isCollection: false,
    };
}
function mapPythonType(stdlibType) {
    const resolved = resolvePythonType(stdlibType);
    return {
        type: resolved.type,
        imports: [...resolved.imports],
    };
}
function getPythonZeroValue(stdlibType) {
    const arrayMatch = stdlibType.match(/^(?:Array|List|Sequence)<(.+)>$/);
    if (arrayMatch)
        return '[]';
    const mapMatch = stdlibType.match(/^(?:Map|Dict)<(.+),\s*(.+)>$/);
    if (mapMatch)
        return '{}';
    const setMatch = stdlibType.match(/^Set<(.+)>$/);
    if (setMatch)
        return 'set()';
    const frozenSetMatch = stdlibType.match(/^FrozenSet<(.+)>$/);
    if (frozenSetMatch)
        return 'frozenset()';
    const tupleMatch = stdlibType.match(/^Tuple<(.+)>$/);
    if (tupleMatch)
        return '()';
    const optMatch = stdlibType.match(/^(?:Optional|Nullable)<(.+)>$/);
    if (optMatch)
        return 'None';
    const mapping = exports.PYTHON_TYPE_MAPPINGS.find((m) => m.stdlib === stdlibType);
    if (mapping)
        return mapping.default;
    return 'None';
}
// Optional type handling
function formatOptionalType(innerType, pythonVersion = 310) {
    if (pythonVersion >= 310) {
        return `${innerType} | None`;
    }
    return `Optional[${innerType}]`;
}
function hasOptionalDefault(stdlibType) {
    return (stdlibType.startsWith('Optional<') ||
        stdlibType.startsWith('Nullable<') ||
        stdlibType === 'Error' ||
        stdlibType === 'Any');
}
function getOptionalDefault(stdlibType) {
    if (stdlibType.startsWith('Optional<')) {
        const inner = stdlibType.match(/^Optional<(.+)>$/)?.[1];
        if (inner === 'String')
            return '""';
        if (inner === 'Int' || inner?.startsWith('Float'))
            return '0';
        if (inner === 'Bool')
            return 'False';
    }
    return 'None';
}
function parseNullableField(typeStr) {
    const optional = typeStr.match(/^(.+?)\?$/);
    if (optional) {
        const inner = resolvePythonType(optional[1]);
        return {
            type: inner.type,
            nullable: true,
            default: 'None',
        };
    }
    const resolved = resolvePythonType(typeStr);
    return {
        type: resolved.type,
        nullable: resolved.isOptional,
    };
}
// Time type mappings
exports.TIME_TYPE_MAPPINGS = {
    Date: {
        python: 'date',
        fromImport: 'datetime',
        default: 'date.today()',
        methods: ['year', 'month', 'day', 'isoformat'],
    },
    DateTime: {
        python: 'datetime',
        fromImport: 'datetime',
        default: 'datetime.now()',
        methods: ['year', 'month', 'day', 'hour', 'minute', 'second', 'isoformat'],
    },
    Time: {
        python: 'time',
        fromImport: 'datetime',
        default: 'time()',
        methods: ['hour', 'minute', 'second', 'isoformat'],
    },
    Duration: {
        python: 'timedelta',
        fromImport: 'datetime',
        default: 'timedelta()',
        methods: ['total_seconds', 'days', 'seconds', 'microseconds'],
    },
};
// UUID handling
exports.UUID_MAPPING = {
    stdlib: 'UUID',
    python: 'UUID',
    fromImport: 'uuid',
    default: 'uuid4()',
    methods: ['urn', 'hex', 'int', 'str'],
    notes: 'Use uuid4() for random UUIDs, uuid1() for time-based',
};
// Custom ID types
exports.ID_TYPE_MAPPINGS = {
    ID: { python: 'int', notes: 'Auto-increment database ID' },
    UUID: { python: 'UUID', fromImport: 'uuid' },
    ULID: { python: 'str', notes: 'Lexicographically sortable' },
    NanoID: { python: 'str', notes: 'URL-friendly unique ID' },
    Slug: { python: 'str', notes: 'URL-safe identifier' },
};
// Pydantic-specific mappings
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
    // Handle generics for Pydantic
    const arrayMatch = stdlibType.match(/^(?:Array|List)<(.+)>$/);
    if (arrayMatch) {
        return `List[${toPydanticType(arrayMatch[1])}]`;
    }
    const mapMatch = stdlibType.match(/^(?:Map|Dict)<(.+),\s*(.+)>$/);
    if (mapMatch) {
        return `Dict[${toPydanticType(mapMatch[1])}, ${toPydanticType(mapMatch[2])}]`;
    }
    const optMatch = stdlibType.match(/^(?:Optional|Nullable)<(.+)>$/);
    if (optMatch) {
        return `Optional[${toPydanticType(optMatch[1])}]`;
    }
    return stdlibType;
}
//# sourceMappingURL=types.js.map