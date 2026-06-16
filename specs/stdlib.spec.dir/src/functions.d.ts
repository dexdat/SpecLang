/**
 * Built-in functional utilities
 */
/**
 * Identity function - returns input unchanged
 */
export declare function identity<T>(x: T): T;
/**
 * Function composition - applies g then f
 */
export declare function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C;
/**
 * Pipe - chain operations left to right
 */
export declare function pipe<T>(value: T, ...fns: ((t: T) => T)[]): T;
/**
 * Curry - partial application
 */
export declare function curry<T extends (...args: any[]) => any>(fn: T): CurriedFunction<T>;
/**
 * Type for curried function
 */
type CurriedFunction<T extends (...args: any[]) => any> = T extends (a: infer A, b: infer B, c: infer C) => infer R ? (a: A) => (b: B) => (c: C) => R : T extends (a: infer A, b: infer B) => infer R ? (a: A) => (b: B) => R : T extends (a: infer A) => infer R ? (a: A) => R : T;
/**
 * Flip - swap function arguments
 */
export declare function flip<A, B, C>(fn: (a: A, b: B) => C): (b: B, a: A) => C;
/**
 * Memoize - cache function results
 */
export declare function memoize<T extends (...args: any[]) => any>(fn: T): T;
/**
 * Partial - partially apply a function
 */
export declare function partial<T extends (...args: any[]) => any>(fn: T, ...initialArgs: Partial<Parameters<T>>): (...rest: Partial<Parameters<T>>) => ReturnType<T>;
/**
 * Debounce - delay function execution
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Throttle - limit function execution rate
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Once - execute function only once
 */
export declare function once<T extends (...args: any[]) => any>(fn: T): T;
/**
 * Noop - no operation function
 */
export declare function noop(): void;
/**
 * Constant - create constant function
 */
export declare function constant<T>(value: T): () => T;
export {};
//# sourceMappingURL=functions.d.ts.map