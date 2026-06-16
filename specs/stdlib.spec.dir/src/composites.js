"use strict";
// SPECLANG-GENERATED
// Source: @speclang/stdlib/types
// DO NOT EDIT MANUALLY
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneOf = exports.OptionalOps = exports.SetOps = exports.Map = exports.ListOps = void 0;
/**
 * List (Array) operations
 */
exports.ListOps = {
    of: (itemValidator) => ({
        validate: (value) => {
            if (!Array.isArray(value))
                return false;
            return value.every(item => itemValidator.validate(item));
        },
        default: [],
        examples: [[]]
    }),
    map: (list, fn) => list.map(fn),
    filter: (list, predicate) => list.filter(predicate),
    reduce: (list, fn, initial) => list.reduce(fn, initial),
    find: (list, predicate) => list.find(predicate),
    some: (list, predicate) => list.some(predicate),
    every: (list, predicate) => list.every(predicate),
    first: (list) => list[0],
    last: (list) => list[list.length - 1],
    length: (list) => list.length,
    isEmpty: (list) => list.length === 0,
    includes: (list, item) => list.includes(item),
    push: (list, item) => [...list, item],
    pop: (list) => {
        if (list.length === 0)
            return [undefined, []];
        const newList = [...list];
        const item = newList.pop();
        return [item, newList];
    },
    sort: (list, cmp) => [...list].sort(cmp),
    reverse: (list) => [...list].reverse()
};
/**
 * Map (Record) operations
 */
exports.Map = {
    of: (valueValidator) => ({
        validate: (value) => {
            if (typeof value !== 'object' || value === null)
                return false;
            return Object.values(value).every(v => valueValidator.validate(v));
        },
        default: {},
        examples: [{}]
    }),
    get: (map, key) => map[key],
    set: (map, key, value) => ({ ...map, [key]: value }),
    has: (map, key) => key in map,
    keys: (map) => Object.keys(map),
    values: (map) => Object.values(map),
    entries: (map) => Object.entries(map),
    size: (map) => Object.keys(map).length,
    delete: (map, key) => {
        const newMap = { ...map };
        delete newMap[key];
        return newMap;
    }
};
/**
 * Set operations
 */
exports.SetOps = {
    add: (set, item) => {
        if (set.includes(item))
            return set;
        return [...set, item];
    },
    has: (set, item) => set.includes(item),
    delete: (set, item) => set.filter(x => x !== item),
    union: (a, b) => {
        const result = [...a];
        b.forEach(item => {
            if (!result.includes(item))
                result.push(item);
        });
        return result;
    },
    intersect: (a, b) => a.filter(item => b.includes(item)),
    diff: (a, b) => a.filter(item => !b.includes(item)),
    size: (set) => set.length
};
/**
 * Optional (Maybe) type operations
 */
exports.OptionalOps = {
    of: (value) => value ?? null,
    isSome: (value) => value !== null,
    isNone: (value) => value === null,
    map: (value, fn) => value === null ? null : fn(value),
    orElse: (value, defaultValue) => value ?? defaultValue,
    orElseGet: (value, supplier) => value ?? supplier(),
    flatten: (value) => value === null ? null : value
};
/**
 * OneOf type validator
 */
exports.OneOf = {
    validate: (options) => (value) => options.includes(value)
};
//# sourceMappingURL=composites.js.map