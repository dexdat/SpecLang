"use strict";
/**
 * SPECLANG-GENERATED: Go built-in types
 * Source: @speclang/compiler.spec.dir/go
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_THIRD_PARTY = exports.GO_BUILTIN_TYPES = exports.GO_STDLIB_PACKAGES = void 0;
exports.isStdlibPackage = isStdlibPackage;
exports.isBuiltinType = isBuiltinType;
exports.GO_STDLIB_PACKAGES = [
    'archive', 'bufio', 'bytes', 'compress', 'container',
    'context', 'crypto', 'database', 'debug', 'embed',
    'encoding', 'errors', 'expvar', 'flag', 'fmt',
    'go', 'hash', 'html', 'image', 'index', 'io',
    'log', 'map', 'math', 'mime', 'net', 'os',
    'path', 'plugin', 'reflect', 'regexp', 'runtime',
    'sort', 'strconv', 'strings', 'sync', 'syscall',
    'testing', 'text', 'time', 'unicode', 'unsafe',
];
function isStdlibPackage(pkg) {
    return exports.GO_STDLIB_PACKAGES.some((p) => pkg === p || pkg.startsWith(p + '/'));
}
exports.GO_BUILTIN_TYPES = {
    int: 'int',
    int8: 'int8',
    int16: 'int16',
    int32: 'int32',
    int64: 'int64',
    uint: 'uint',
    uint8: 'uint8',
    uint16: 'uint16',
    uint32: 'uint32',
    uint64: 'uint64',
    uintptr: 'uintptr',
    float32: 'float32',
    float64: 'float64',
    complex64: 'complex64',
    complex128: 'complex128',
    bool: 'bool',
    byte: 'byte',
    rune: 'rune',
    string: 'string',
    error: 'error',
};
exports.COMMON_THIRD_PARTY = [
    'github.com/google/uuid',
    'github.com/lib/pq',
    'github.com/stretchr/testify',
    'gopkg.in/yaml.v3',
    'gorm.io/gorm',
    'github.com/gin-gonic/gin',
    'github.com/labstack/echo/v4',
];
function isBuiltinType(type) {
    return type in exports.GO_BUILTIN_TYPES;
}
//# sourceMappingURL=builtins.js.map