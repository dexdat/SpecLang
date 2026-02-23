/**
 * SPECLANG-GENERATED: Python built-in types
 * Source: @speclang/compiler.spec.dir/python
 */

export const PYTHON_STDLIB_MODULES = [
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

export const COMMON_THIRD_PARTY = [
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

export const PYTHON_BUILTIN_TYPES: Record<string, string> = {
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

export function isStdlibModule(module: string): boolean {
  const topLevel = module.split('.')[0];
  return PYTHON_STDLIB_MODULES.includes(topLevel);
}

export function isBuiltinType(type: string): boolean {
  return type in PYTHON_BUILTIN_TYPES;
}

export function isThirdPartyModule(module: string): boolean {
  const topLevel = module.split('.')[0];
  return COMMON_THIRD_PARTY.includes(topLevel);
}
