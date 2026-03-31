// SPECLANG-GENERATED
// Source: @speclang/stdlib/objects
// DO NOT EDIT MANUALLY

/**
 * Object manipulation functions
 */

/**
 * Get keys of object
 */
export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Get values of object
 */
export function values<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj);
}

/**
 * Get entries of object as [key, value] pairs
 */
export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Create object from entries
 */
export function fromEntries<K extends string | number | symbol, V>(entries: [K, V][]): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

/**
 * Merge two objects shallowly (later overrides earlier)
 */
export function merge<T extends object, U extends object>(target: T, source: U): T & U {
  return { ...target, ...source };
}

/**
 * Deep merge two objects recursively
 */
export function deepMerge<T extends object, U extends object>(target: T, source: U): T & U {
  const result = { ...target } as any;
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceVal = source[key];
      const targetVal = (target as any)[key];
      if (isObject(sourceVal) && isObject(targetVal)) {
        result[key] = deepMerge(targetVal, sourceVal);
      } else {
        result[key] = sourceVal;
      }
    }
  }
  return result;
}

/**
 * Pick subset of object properties
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit properties from object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj } as any;
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Get property value by path string (e.g., 'a.b.c')
 */
export function get<T>(obj: any, path: string): T | undefined {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return current as T;
}

/**
 * Set property value by path string
 */
export function set(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] == null || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Check if object has property at path
 */
export function has(obj: any, path: string): boolean {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  return true;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Deep equality check (same as assertions deepEqual but exported)
 */
export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual((a as any)[key], (b as any)[key])) return false;
  }
  return true;
}

/**
 * Shallow equality check (reference equality)
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  return a === b;
}

/**
 * Freeze object deeply (recursive Object.freeze)
 */
export function deepFreeze<T>(obj: T): T {
  if (obj == null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      deepFreeze(obj[key]);
    }
  }
  return obj;
}

/**
 * Check if value is plain object (not array, not null)
 */
function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}