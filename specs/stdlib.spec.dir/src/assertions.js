"use strict";
// SPECLANG-GENERATED
// Source: @speclang/stdlib/mapping
// DO NOT EDIT MANUALLY
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = assert;
exports.assertEquals = assertEquals;
exports.assertNotEquals = assertNotEquals;
exports.assertTrue = assertTrue;
exports.assertFalse = assertFalse;
exports.assertNull = assertNull;
exports.assertNotNull = assertNotNull;
exports.assertUndefined = assertUndefined;
exports.assertDefined = assertDefined;
exports.assertType = assertType;
exports.assertIsArray = assertIsArray;
exports.assertIsObject = assertIsObject;
exports.assertLength = assertLength;
exports.assertThrows = assertThrows;
exports.assertNotThrows = assertNotThrows;
exports.assertContains = assertContains;
exports.assertHasProperty = assertHasProperty;
/**
 * Assertion functions
 */
/**
 * Assert - throw if condition is false
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'assertion failed');
    }
}
/**
 * Assert equals - throw if values not equal
 */
function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
}
/**
 * Assert not equals - throw if values are equal
 */
function assertNotEquals(actual, expected, message) {
    if (actual === expected) {
        throw new Error(message || `Expected values to not be equal but both were ${actual}`);
    }
}
/**
 * Assert true - throw if value is not truthy
 */
function assertTrue(value, message) {
    if (!value) {
        throw new Error(message || `Expected truthy value but got ${value}`);
    }
}
/**
 * Assert false - throw if value is not falsy
 */
function assertFalse(value, message) {
    if (value) {
        throw new Error(message || `Expected falsy value but got ${value}`);
    }
}
/**
 * Assert null - throw if value is not null
 */
function assertNull(value, message) {
    if (value !== null) {
        throw new Error(message || `Expected null but got ${value}`);
    }
}
/**
 * Assert not null - throw if value is null
 */
function assertNotNull(value, message) {
    if (value === null) {
        throw new Error(message || 'Expected value to not be null');
    }
}
/**
 * Assert undefined - throw if value is not undefined
 */
function assertUndefined(value, message) {
    if (value !== undefined) {
        throw new Error(message || `Expected undefined but got ${value}`);
    }
}
/**
 * Assert not undefined - throw if value is undefined
 */
function assertDefined(value, message) {
    if (value === undefined) {
        throw new Error(message || 'Expected value to not be undefined');
    }
}
/**
 * Assert type - throw if value is not of expected type
 */
function assertType(value, typeName, message) {
    if (typeof value !== typeName) {
        throw new Error(message || `Expected type ${typeName} but got ${typeof value}`);
    }
}
/**
 * Assert is array - throw if value is not an array
 */
function assertIsArray(value, message) {
    if (!Array.isArray(value)) {
        throw new Error(message || `Expected array but got ${typeof value}`);
    }
}
/**
 * Assert is object - throw if value is not an object
 */
function assertIsObject(value, message) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(message || 'Expected object but got ' + (value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value));
    }
}
/**
 * Assert length - throw if array length doesn't match
 */
function assertLength(value, length, message) {
    if (value.length !== length) {
        throw new Error(message || `Expected length ${length} but got ${value.length}`);
    }
}
/**
 * Assert throws - throw if function doesn't throw
 */
function assertThrows(fn, message) {
    try {
        fn();
        throw new Error(message || 'Expected function to throw but it did not');
    }
    catch (e) {
        if (e instanceof Error && e.message === (message || 'Expected function to throw but it did not')) {
            throw e;
        }
        // Expected to throw
    }
}
/**
 * Assert not throws - throw if function throws
 */
function assertNotThrows(fn, message) {
    try {
        fn();
    }
    catch (e) {
        throw new Error(message || `Expected function to not throw but it threw: ${e}`);
    }
}
/**
 * Assert contains - throw if array doesn't contain item
 */
function assertContains(array, item, message) {
    if (!array.includes(item)) {
        throw new Error(message || `Expected array to contain ${item}`);
    }
}
/**
 * Assert has property - throw if object doesn't have property
 */
function assertHasProperty(obj, prop, message) {
    if (!(prop in obj)) {
        throw new Error(message || `Expected object to have property ${prop}`);
    }
}
//# sourceMappingURL=assertions.js.map