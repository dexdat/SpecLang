/**
 * Assertion functions
 */
/**
 * Assert - throw if condition is false
 */
export declare function assert(condition: boolean, message?: string): void;
/**
 * Assert equals - throw if values not equal
 */
export declare function assertEquals<T>(actual: T, expected: T, message?: string): void;
/**
 * Assert not equals - throw if values are equal
 */
export declare function assertNotEquals<T>(actual: T, expected: T, message?: string): void;
/**
 * Assert true - throw if value is not truthy
 */
export declare function assertTrue(value: unknown, message?: string): void;
/**
 * Assert false - throw if value is not falsy
 */
export declare function assertFalse(value: unknown, message?: string): void;
/**
 * Assert null - throw if value is not null
 */
export declare function assertNull(value: unknown, message?: string): void;
/**
 * Assert not null - throw if value is null
 */
export declare function assertNotNull<T>(value: T | null, message?: string): asserts value is T;
/**
 * Assert undefined - throw if value is not undefined
 */
export declare function assertUndefined(value: unknown, message?: string): void;
/**
 * Assert not undefined - throw if value is undefined
 */
export declare function assertDefined<T>(value: T | undefined, message?: string): asserts value is T;
/**
 * Assert type - throw if value is not of expected type
 */
export declare function assertType<T>(value: unknown, typeName: string, message?: string): void;
/**
 * Assert is array - throw if value is not an array
 */
export declare function assertIsArray(value: unknown, message?: string): asserts value is unknown[];
/**
 * Assert is object - throw if value is not an object
 */
export declare function assertIsObject(value: unknown, message?: string): asserts value is Record<string, unknown>;
/**
 * Assert length - throw if array length doesn't match
 */
export declare function assertLength<T extends {
    length: number;
}>(value: T, length: number, message?: string): void;
/**
 * Assert throws - throw if function doesn't throw
 */
export declare function assertThrows(fn: () => void, message?: string): void;
/**
 * Assert not throws - throw if function throws
 */
export declare function assertNotThrows(fn: () => void, message?: string): void;
/**
 * Assert contains - throw if array doesn't contain item
 */
export declare function assertContains<T>(array: T[], item: T, message?: string): void;
/**
 * Assert has property - throw if object doesn't have property
 */
export declare function assertHasProperty(obj: Record<string, unknown>, prop: string, message?: string): void;
//# sourceMappingURL=assertions.d.ts.map