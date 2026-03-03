"use strict";
// SPECLANG-GENERATED
// Source: @speclang/stdlib/types
// DO NOT EDIT MANUALLY
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = exports.Results = void 0;
/**
 * Type guard to check if result is Success
 */
function isSuccess(result) {
    return result.ok === true;
}
/**
 * Type guard to check if result is Failure
 */
function isFailure(result) {
    return result.ok === false;
}
/**
 * Result operations
 */
exports.Results = {
    /**
     * Create a success result
     */
    success: (value) => ({
        ok: true,
        value
    }),
    /**
     * Create a failure result
     */
    failure: (error) => ({
        ok: false,
        error
    }),
    /**
     * Try to execute a function and wrap result
     */
    fromTry: (fn) => {
        try {
            return exports.Results.success(fn());
        }
        catch (e) {
            return exports.Results.failure(e instanceof Error ? e : new Error(String(e)));
        }
    },
    /**
     * Wrap a promise
     */
    fromPromise: async (promise) => {
        try {
            const value = await promise;
            return exports.Results.success(value);
        }
        catch (e) {
            return exports.Results.failure(e instanceof Error ? e : new Error(String(e)));
        }
    },
    /**
     * Check if result is success
     */
    isOk: (result) => result.ok === true,
    /**
     * Check if result is failure
     */
    isError: (result) => result.ok === false,
    /**
     * Map success value
     */
    map: (result, fn) => {
        if (isSuccess(result)) {
            return exports.Results.success(fn(result.value));
        }
        return exports.Results.failure(result.error);
    },
    /**
     * Map error value
     */
    mapError: (result, fn) => {
        if (isSuccess(result)) {
            return exports.Results.success(result.value);
        }
        return exports.Results.failure(fn(result.error));
    },
    /**
     * FlatMap/chain result
     */
    flatMap: (result, fn) => {
        if (isSuccess(result)) {
            return fn(result.value);
        }
        return exports.Results.failure(result.error);
    },
    /**
     * Unwrap result or throw
     */
    unwrap: (result) => {
        if (isSuccess(result))
            return result.value;
        throw result.error;
    },
    /**
     * Unwrap result or return default
     */
    unwrapOr: (result, defaultValue) => {
        if (isSuccess(result))
            return result.value;
        return defaultValue;
    },
    /**
     * Unwrap result or compute from error
     */
    unwrapOrElse: (result, fn) => {
        if (isSuccess(result))
            return result.value;
        return fn(result.error);
    },
    /**
     * Get value or undefined
     */
    ok: (result) => {
        if (isSuccess(result))
            return result.value;
        return undefined;
    },
    /**
     * Get error or undefined
     */
    err: (result) => {
        if (isFailure(result))
            return result.error;
        return undefined;
    }
};
/**
 * Option operations
 */
exports.Options = {
    /**
     * Create Some variant
     */
    some: (value) => ({
        some: true,
        value
    }),
    /**
     * Create None variant
     */
    none: () => ({
        some: false
    }),
    /**
     * Wrap value in Option
     */
    of: (value) => value !== null && value !== undefined ? exports.Options.some(value) : exports.Options.none(),
    /**
     * Check if Option is Some
     */
    isSome: (option) => option.some === true,
    /**
     * Check if Option is None
     */
    isNone: (option) => option.some === false,
    /**
     * Map Option value
     */
    map: (option, fn) => option.some ? exports.Options.some(fn(option.value)) : exports.Options.none(),
    /**
     * FlatMap Option
     */
    flatMap: (option, fn) => option.some ? fn(option.value) : exports.Options.none(),
    /**
     * Unwrap Option or throw
     */
    unwrap: (option) => {
        if (option.some)
            return option.value;
        throw new Error('Option is None');
    },
    /**
     * Unwrap Option or return default
     */
    unwrapOr: (option, defaultValue) => option.some ? option.value : defaultValue,
    /**
     * Unwrap Option or compute from None
     */
    unwrapOrElse: (option, fn) => option.some ? option.value : fn()
};
//# sourceMappingURL=results.js.map