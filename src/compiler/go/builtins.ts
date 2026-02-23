/**
 * SPECLANG-GENERATED: Go built-in types
 * Source: @speclang/compiler.spec.dir/go
 */

export const GO_STDLIB_PACKAGES = [
  'archive', 'bufio', 'bytes', 'compress', 'container',
  'context', 'crypto', 'database', 'debug', 'embed',
  'encoding', 'errors', 'expvar', 'flag', 'fmt',
  'go', 'hash', 'html', 'image', 'index', 'io',
  'log', 'map', 'math', 'mime', 'net', 'os',
  'path', 'plugin', 'reflect', 'regexp', 'runtime',
  'sort', 'strconv', 'strings', 'sync', 'syscall',
  'testing', 'text', 'time', 'unicode', 'unsafe',
];

export function isStdlibPackage(pkg: string): boolean {
  return GO_STDLIB_PACKAGES.some(
    (p) => pkg === p || pkg.startsWith(p + '/')
  );
}

export const GO_BUILTIN_TYPES: Record<string, string> = {
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

export const COMMON_THIRD_PARTY = [
  'github.com/google/uuid',
  'github.com/lib/pq',
  'github.com/stretchr/testify',
  'gopkg.in/yaml.v3',
  'gorm.io/gorm',
  'github.com/gin-gonic/gin',
  'github.com/labstack/echo/v4',
];

export function isBuiltinType(type: string): boolean {
  return type in GO_BUILTIN_TYPES;
}
