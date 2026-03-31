// SPECLANG-GENERATED
// Source: @speclang/stdlib/mapping
// DO NOT EDIT MANUALLY

/**
 * Assertion functions
 */

/**
 * Assert - throw if condition is false
 */
export function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || 'assertion failed');
  }
}

/**
 * Assert equals - throw if values not equal
 */
export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

/**
 * Assert not equals - throw if values are equal
 */
export function assertNotEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual === expected) {
    throw new Error(message || `Expected values to not be equal but both were ${actual}`);
  }
}

/**
 * Assert true - throw if value is not truthy
 */
export function assertTrue(value: unknown, message?: string): void {
  if (!value) {
    throw new Error(message || `Expected truthy value but got ${value}`);
  }
}

/**
 * Assert false - throw if value is not falsy
 */
export function assertFalse(value: unknown, message?: string): void {
  if (value) {
    throw new Error(message || `Expected falsy value but got ${value}`);
  }
}

/**
 * Assert null - throw if value is not null
 */
export function assertNull(value: unknown, message?: string): void {
  if (value !== null) {
    throw new Error(message || `Expected null but got ${value}`);
  }
}

/**
 * Assert not null - throw if value is null
 */
export function assertNotNull<T>(value: T | null, message?: string): asserts value is T {
  if (value === null) {
    throw new Error(message || 'Expected value to not be null');
  }
}

/**
 * Assert undefined - throw if value is not undefined
 */
export function assertUndefined(value: unknown, message?: string): void {
  if (value !== undefined) {
    throw new Error(message || `Expected undefined but got ${value}`);
  }
}

/**
 * Assert not undefined - throw if value is undefined
 */
export function assertDefined<T>(value: T | undefined, message?: string): asserts value is T {
  if (value === undefined) {
    throw new Error(message || 'Expected value to not be undefined');
  }
}

/**
 * Assert type - throw if value is not of expected type
 */
export function assertType<T>(value: unknown, typeName: string, message?: string): void {
  if (typeof value !== typeName) {
    throw new Error(message || `Expected type ${typeName} but got ${typeof value}`);
  }
}

/**
 * Assert is array - throw if value is not an array
 */
export function assertIsArray(value: unknown, message?: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(message || `Expected array but got ${typeof value}`);
  }
}

/**
 * Assert is object - throw if value is not an object
 */
export function assertIsObject(value: unknown, message?: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(message || 'Expected object but got ' + (value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value));
  }
}

/**
 * Assert length - throw if array length doesn't match
 */
export function assertLength<T extends { length: number }>(value: T, length: number, message?: string): void {
  if (value.length !== length) {
    throw new Error(message || `Expected length ${length} but got ${value.length}`);
  }
}

/**
 * Assert throws - throw if function doesn't throw
 */
export function assertThrows(fn: () => void, message?: string): void {
  try {
    fn();
    throw new Error(message || 'Expected function to throw but it did not');
  } catch (e) {
    if (e instanceof Error && e.message === (message || 'Expected function to throw but it did not')) {
      throw e;
    }
    // Expected to throw
  }
}

/**
 * Assert not throws - throw if function throws
 */
export function assertNotThrows(fn: () => void, message?: string): void {
  try {
    fn();
  } catch (e) {
    throw new Error(message || `Expected function to not throw but it threw: ${e}`);
  }
}

/**
 * Assert contains - throw if array doesn't contain item
 */
export function assertContains<T>(array: T[], item: T, message?: string): void {
  if (!array.includes(item)) {
    throw new Error(message || `Expected array to contain ${item}`);
  }
}

/**
 * Assert has property - throw if object doesn't have property
 */
export function assertHasProperty(obj: Record<string, unknown>, prop: string, message?: string): void {
  if (!(prop in obj)) {
    throw new Error(message || `Expected object to have property ${prop}`);
  }
}

/**
 * Deep equality check
 */
function deepEqual<T>(a: T, b: T): boolean {
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
 * Assert deep equality - throw if values are not deeply equal
 */
export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
  if (!deepEqual(actual, expected)) {
    throw new Error(message || `Expected deep equality but got ${actual}`);
  }
}

/**
 * Assert rejects - throw if promise does not reject
 */
export async function assertRejects(promise: Promise<unknown>, message?: string): Promise<void> {
  try {
    await promise;
    throw new Error(message || 'Expected promise to reject but it resolved');
  } catch (e) {
    // Expected to reject
  }
}

/**
 * Assert equal (alias for assertEquals)
 */
export const assertEqual = assertEquals;

/**
 * Custom matcher factory
 */
export function expect<T>(actual: T) {
  return {
    toBe(expected: T): void {
      assertEquals(actual, expected);
    },
    toEqual(expected: T): void {
      assertDeepEqual(actual, expected);
    },
    toThrow(message?: string): void {
      if (typeof actual !== 'function') {
        throw new Error('Expected a function');
      }
      assertThrows(actual as () => void, message);
    },
    toReject(message?: string): Promise<void> {
      if (typeof actual !== 'function' && !(actual instanceof Promise)) {
        throw new Error('Expected a function or promise');
      }
      const promise = typeof actual === 'function' ? actual() : actual;
      return assertRejects(promise, message);
    }
  };
}
