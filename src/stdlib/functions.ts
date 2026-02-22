// SPECLANG-GENERATED
// Source: @speclang/stdlib/mapping
// DO NOT EDIT MANUALLY

/**
 * Built-in functional utilities
 */

/**
 * Identity function - returns input unchanged
 */
export function identity<T>(x: T): T {
  return x;
}

/**
 * Function composition - applies g then f
 */
export function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (a: A): C => f(g(a));
}

/**
 * Pipe - chain operations left to right
 */
export function pipe<T>(value: T, ...fns: ((t: T) => T)[]): T {
  return fns.reduce((v, f) => f(v), value);
}

/**
 * Curry - partial application
 */
export function curry<T extends (...args: any[]) => any>(fn: T): CurriedFunction<T> {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return curried.bind(null, ...args);
  } as CurriedFunction<T>;
}

/**
 * Type for curried function
 */
type CurriedFunction<T extends (...args: any[]) => any> = 
  T extends (a: infer A, b: infer B, c: infer C) => infer R
    ? (a: A) => (b: B) => (c: C) => R
    : T extends (a: infer A, b: infer B) => infer R
      ? (a: A) => (b: B) => R
      : T extends (a: infer A) => infer R
        ? (a: A) => R
        : T;

/**
 * Flip - swap function arguments
 */
export function flip<A, B, C>(fn: (a: A, b: B) => C): (b: B, a: A) => C {
  return (b: B, a: A): C => fn(a, b);
}

/**
 * Memoize - cache function results
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Partial - partially apply a function
 */
export function partial<T extends (...args: any[]) => any>(
  fn: T, 
  ...initialArgs: Partial<Parameters<T>>
): (...rest: Partial<Parameters<T>>) => ReturnType<T> {
  return (...laterArgs: Partial<Parameters<T>>): ReturnType<T> => {
    const allArgs = [...initialArgs, ...laterArgs].slice(0, fn.length);
    return fn(...(allArgs as Parameters<T>));
  };
}

/**
 * Debounce - delay function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T, 
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle - limit function execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T, 
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>): void => {
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
export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  }) as T;
}

/**
 * Noop - no operation function
 */
export function noop(): void {
  // Intentionally empty
}

/**
 * Constant - create constant function
 */
export function constant<T>(value: T): () => T {
  return () => value;
}
