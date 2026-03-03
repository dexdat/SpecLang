"use strict";
// SPECLANG-GENERATED
// Source: @speclang/stdlib/types
// DO NOT EDIT MANUALLY
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArray = exports.isObject = exports.isFunction = exports.isUndefined = exports.isNull = exports.isBoolean = exports.isNumber = exports.isString = exports.Primitives = void 0;
// Primitive validators
exports.Primitives = {
    String: {
        validate: (value) => typeof value === 'string',
        default: '',
        examples: ['hello', 'world']
    },
    Number: {
        validate: (value) => typeof value === 'number' && !isNaN(value),
        default: 0,
        examples: [0, 1, 3.14, -42]
    },
    Boolean: {
        validate: (value) => typeof value === 'boolean',
        default: false,
        examples: [true, false]
    },
    Null: {
        validate: (value) => value === null,
        default: null,
        examples: [null]
    },
    Undefined: {
        validate: (value) => value === undefined,
        default: undefined,
        examples: [undefined]
    },
    UUID: {
        validate: (value) => {
            if (typeof value !== 'string')
                return false;
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        },
        generate: () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        },
        default: '00000000-0000-0000-0000-000000000000',
        examples: ['550e8400-e29b-41d4-a716-446655440000']
    },
    DateTime: {
        validate: (value) => {
            if (typeof value !== 'string')
                return false;
            return !isNaN(Date.parse(value));
        },
        now: () => new Date().toISOString(),
        parse: (value) => {
            const parsed = Date.parse(value);
            if (isNaN(parsed))
                return null;
            return new Date(parsed).toISOString();
        },
        default: '1970-01-01T00:00:00.000Z',
        examples: ['2024-01-15T10:30:00.000Z']
    },
    Email: {
        validate: (value) => {
            if (typeof value !== 'string')
                return false;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        default: '',
        examples: ['user@example.com']
    },
    URL: {
        validate: (value) => {
            if (typeof value !== 'string')
                return false;
            try {
                new globalThis.URL(value);
                return true;
            }
            catch {
                return false;
            }
        },
        default: '',
        examples: ['https://example.com']
    },
    Path: {
        validate: (value) => {
            if (typeof value !== 'string')
                return false;
            return value.length > 0 && !value.includes('\0');
        },
        default: '',
        examples: ['/usr/local/bin', 'src/index.ts']
    }
};
// Type predicates
const isString = (value) => typeof value === 'string';
exports.isString = isString;
const isNumber = (value) => typeof value === 'number' && !isNaN(value);
exports.isNumber = isNumber;
const isBoolean = (value) => typeof value === 'boolean';
exports.isBoolean = isBoolean;
const isNull = (value) => value === null;
exports.isNull = isNull;
const isUndefined = (value) => value === undefined;
exports.isUndefined = isUndefined;
const isFunction = (value) => typeof value === 'function';
exports.isFunction = isFunction;
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
exports.isObject = isObject;
const isArray = (value) => Array.isArray(value);
exports.isArray = isArray;
//# sourceMappingURL=primitives.js.map