"use strict";
// SPECLANG-GENERATED
// Source: @speclang/stdlib/mapping
// DO NOT EDIT MANUALLY
Object.defineProperty(exports, "__esModule", { value: true });
exports.identity = identity;
exports.compose = compose;
exports.pipe = pipe;
exports.curry = curry;
exports.flip = flip;
exports.memoize = memoize;
exports.partial = partial;
exports.debounce = debounce;
exports.throttle = throttle;
exports.once = once;
exports.noop = noop;
exports.constant = constant;
/**
 * Built-in functional utilities
 */
/**
 * Identity function - returns input unchanged
 */
function identity(x) {
    return x;
}
/**
 * Function composition - applies g then f
 */
function compose(f, g) {
    return (a) => f(g(a));
}
/**
 * Pipe - chain operations left to right
 */
function pipe(value, ...fns) {
    return fns.reduce((v, f) => f(v), value);
}
/**
 * Curry - partial application
 */
function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn(...args);
        }
        return curried.bind(null, ...args);
    };
}
/**
 * Flip - swap function arguments
 */
function flip(fn) {
    return (b, a) => fn(a, b);
}
/**
 * Memoize - cache function results
 */
function memoize(fn) {
    const cache = new Map();
    return ((...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    });
}
/**
 * Partial - partially apply a function
 */
function partial(fn, ...initialArgs) {
    return (...laterArgs) => {
        const allArgs = [...initialArgs, ...laterArgs].slice(0, fn.length);
        return fn(...allArgs);
    };
}
/**
 * Debounce - delay function execution
 */
function debounce(fn, delay) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
/**
 * Throttle - limit function execution rate
 */
function throttle(fn, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
/**
 * Once - execute function only once
 */
function once(fn) {
    let called = false;
    let result;
    return ((...args) => {
        if (!called) {
            called = true;
            result = fn(...args);
        }
        return result;
    });
}
/**
 * Noop - no operation function
 */
function noop() {
    // Intentionally empty
}
/**
 * Constant - create constant function
 */
function constant(value) {
    return () => value;
}
//# sourceMappingURL=functions.js.map