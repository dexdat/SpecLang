// SPECLANG-GENERATED
// Source: @speclang/stdlib/compose
// DO NOT EDIT MANUALLY

/**
 * Function composition utilities
 */

// Re-export from functions module
import { pipe, compose, curry, partial, memoize, debounce, throttle, once, noop, constant } from './functions';
export { pipe, compose, curry, partial, memoize, debounce, throttle, once, noop, constant };

/**
 * Flow - compose functions left to right (alias for pipe)
 */
export const flow = pipe;

/**
 * ComposeRight - compose functions right to left (alias for compose)
 */
export const composeRight = compose;

/**
 * PartialRight - partially apply arguments from the right
 */
export function partialRight<T extends (...args: any[]) => any>(
  fn: T,
  ...rightArgs: Partial<Parameters<T>>
): (...leftArgs: Partial<Parameters<T>>) => ReturnType<T> {
  return (...leftArgs: Partial<Parameters<T>>): ReturnType<T> => {
    const allArgs = [...leftArgs, ...rightArgs].slice(0, fn.length);
    return fn(...(allArgs as Parameters<T>));
  };
}

/**
 * Tap - perform side effect and return value
 */
export function tap<T>(fn: (value: T) => void): (value: T) => T {
  return (value: T) => {
    fn(value);
    return value;
  };
}