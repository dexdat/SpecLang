"use strict";
/**
 * SPECLANG-GENERATED: Python built-in types
 * Source: @speclang/compiler.spec.dir/python
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PYTHON_BUILTIN_TYPES = exports.COMMON_THIRD_PARTY = exports.PYTHON_STDLIB_MODULES = void 0;
exports.isStdlibModule = isStdlibModule;
exports.isBuiltinType = isBuiltinType;
exports.isThirdPartyModule = isThirdPartyModule;
exports.PYTHON_STDLIB_MODULES = [
    'abc', 'argparse', 'asyncio', 'base64', 'bisect', 'builtins',
    'collections', 'contextlib', 'copy', 'csv', 'dataclasses', 'datetime',
    'decimal', 'enum', 'functools', 'gc', 'glob', 'gzip', 'hashlib',
    'heapq', 'hmac', 'html', 'http', 'importlib', 'inspect', 'io',
    'itertools', 'json', 'logging', 'math', 'mmap', 'multiprocessing',
    'numbers', 'operator', 'os', 'pathlib', 'pickle', 'platform', 'pprint',
    'queue', 'random', 're', 'secrets', 'shutil', 'signal', 'socket',
    'sqlite3', 'ssl', 'stat', 'statistics', 'string', 'struct', 'subprocess',
    'sys', 'tempfile', 'textwrap', 'threading', 'time', 'timeit',
    'token', 'tokenize', 'traceback', 'types', 'typing', 'unicodedata',
    'unittest', 'urllib', 'uuid', 'warnings', 'weakref', 'xml', 'zipfile',
];
exports.COMMON_THIRD_PARTY = [
    'pydantic',
    'fastapi',
    'sqlalchemy',
    'django',
    'flask',
    'requests',
    'httpx',
    'pytest',
    'numpy',
    'pandas',
    'pyyaml',
    'python-dotenv',
    'rich',
    'typer',
    'click',
];
exports.PYTHON_BUILTIN_TYPES = {
    str: 'str',
    int: 'int',
    float: 'float',
    bool: 'bool',
    bytes: 'bytes',
    list: 'list',
    dict: 'dict',
    set: 'set',
    tuple: 'tuple',
    type: 'type',
    object: 'object',
    None: 'None',
    Any: 'Any',
};
function isStdlibModule(module) {
    const topLevel = module.split('.')[0];
    return exports.PYTHON_STDLIB_MODULES.includes(topLevel);
}
function isBuiltinType(type) {
    return type in exports.PYTHON_BUILTIN_TYPES;
}
function isThirdPartyModule(module) {
    const topLevel = module.split('.')[0];
    return exports.COMMON_THIRD_PARTY.includes(topLevel);
}
//# sourceMappingURL=builtins.js.map