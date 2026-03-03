"use strict";
// SPECLANG-GENERATED
// Source: @speclang/stdlib/mapping
// DO NOT EDIT MANUALLY
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeMappings = void 0;
exports.mapType = mapType;
exports.mapSignature = mapSignature;
exports.getAllMappings = getAllMappings;
exports.addTypeMapping = addTypeMapping;
/**
 * Built-in type mappings
 */
exports.TypeMappings = {
    // Primitives
    'string': {
        typescript: 'string',
        python: 'str',
        go: 'string',
        rust: 'String',
        java: 'String'
    },
    'number': {
        typescript: 'number',
        python: 'int | float',
        go: 'float64',
        rust: 'f64',
        java: 'double'
    },
    'boolean': {
        typescript: 'boolean',
        python: 'bool',
        go: 'bool',
        rust: 'bool',
        java: 'boolean'
    },
    'null': {
        typescript: 'null',
        python: 'None',
        go: 'nil',
        rust: 'None',
        java: 'null'
    },
    'void': {
        typescript: 'void',
        python: 'None',
        go: '',
        rust: '()',
        java: 'void'
    },
    'any': {
        typescript: 'any',
        python: 'Any',
        go: 'interface{}',
        rust: 'Any',
        java: 'Object'
    },
    'unknown': {
        typescript: 'unknown',
        python: 'Any',
        go: 'interface{}',
        rust: 'Any',
        java: 'Object'
    },
    // Composite types
    'list': {
        typescript: 'T[]',
        python: 'List[T]',
        go: '[]T',
        rust: 'Vec<T>',
        java: 'List<T>'
    },
    'map': {
        typescript: 'Record<K, V>',
        python: 'Dict[K, V]',
        go: 'map[K]V',
        rust: 'HashMap<K, V>',
        java: 'Map<K, V>'
    },
    'set': {
        typescript: 'Set<T>',
        python: 'Set[T]',
        go: 'map[T]struct{}',
        rust: 'HashSet<T>',
        java: 'Set<T>'
    },
    'tuple': {
        typescript: '[T1, T2, ...]',
        python: 'Tuple[T1, T2, ...]',
        go: '[N]T',
        rust: '(T1, T2, ...)',
        java: 'Tuple2<T1, T2>'
    },
    // Result types
    'result': {
        typescript: 'Result<T, E>',
        python: 'Result[T, E]',
        go: '(T, error)',
        rust: 'Result<T, E>',
        java: 'Result<T>'
    },
    'option': {
        typescript: 'T | null',
        python: 'Optional[T]',
        go: '*T',
        rust: 'Option<T>',
        java: 'Optional<T>'
    },
    // Special types
    'uuid': {
        typescript: 'string',
        python: 'str',
        go: 'string',
        rust: 'Uuid',
        java: 'UUID'
    },
    'datetime': {
        typescript: 'string',
        python: 'datetime',
        go: 'time.Time',
        rust: 'DateTime',
        java: 'Instant'
    },
    'email': {
        typescript: 'string',
        python: 'str',
        go: 'string',
        rust: 'String',
        java: 'String'
    },
    'url': {
        typescript: 'string',
        python: 'str',
        go: 'string',
        rust: 'Url',
        java: 'URI'
    },
    'path': {
        typescript: 'string',
        python: 'Path | str',
        go: 'string',
        rust: 'PathBuf',
        java: 'Path'
    }
};
/**
 * Map a type to a specific language
 */
function mapType(typeName, language) {
    const mapping = exports.TypeMappings[typeName.toLowerCase()];
    if (!mapping) {
        return typeName; // Return original if no mapping found
    }
    return mapping[language];
}
/**
 * Map all types in a signature
 */
function mapSignature(signature, language) {
    // Replace type names with mapped types
    let result = signature;
    // Sort keys by length (longest first) to avoid partial replacements
    const sortedTypes = Object.keys(exports.TypeMappings).sort((a, b) => b.length - a.length);
    for (const typeName of sortedTypes) {
        // Replace generic type usage
        const regex = new RegExp(`\\b${typeName}(?:<|,|>|\\b)`, 'g');
        result = result.replace(regex, (match) => {
            const mapped = mapType(typeName, language);
            if (match.endsWith('<') || match.endsWith(',')) {
                return mapped + match.slice(-1);
            }
            if (match.endsWith('>')) {
                return mapped + '>';
            }
            return mapped;
        });
    }
    return result;
}
/**
 * Get type mapping for all languages
 */
function getAllMappings(typeName) {
    return exports.TypeMappings[typeName.toLowerCase()];
}
/**
 * Add custom type mapping
 */
function addTypeMapping(name, mapping) {
    exports.TypeMappings[name.toLowerCase()] = {
        typescript: mapping.typescript || name,
        python: mapping.python || name,
        go: mapping.go || name,
        rust: mapping.rust || name,
        java: mapping.java || name
    };
}
//# sourceMappingURL=mapping.js.map