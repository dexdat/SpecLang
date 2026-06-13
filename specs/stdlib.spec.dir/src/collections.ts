// SPECLANG-GENERATED
// Source: @speclang/stdlib/collections
// DO NOT EDIT MANUALLY

/**
 * Collection manipulation functions
 */

/**
 * Map over array elements
 */
export function map<T, U>(array: T[], fn: (item: T, index: number, array: T[]) => U): U[] {
  return array.map(fn);
}

/**
 * Filter array elements
 */
export function filter<T>(array: T[], fn: (item: T, index: number, array: T[]) => boolean): T[] {
  return array.filter(fn);
}

/**
 * Reduce array to a single value
 */
export function reduce<T, U>(array: T[], fn: (accumulator: U, item: T, index: number, array: T[]) => U, initialValue: U): U {
  return array.reduce(fn, initialValue);
}

/**
 * Find first element matching predicate
 */
export function find<T>(array: T[], fn: (item: T, index: number, array: T[]) => boolean): T | undefined {
  return array.find(fn);
}

/**
 * Sort array with comparator
 */
export function sort<T>(array: T[], comparator?: (a: T, b: T) => number): T[] {
  return [...array].sort(comparator);
}

/**
 * Group array elements by key derived from each element
 */
export function groupBy<T, K extends string | number | symbol>(array: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const groups = {} as Record<K, T[]>;
  for (const item of array) {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }
  return groups;
}

/**
 * Chunk array into smaller arrays of given size
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Flatten nested array by one level
 */
export function flatten<T>(array: (T | T[])[]): T[] {
  const result: T[] = [];
  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...item);
    } else {
      result.push(item);
    }
  }
  return result;
}

/**
 * Flatten deeply nested array recursively
 */
export function flattenDeep<T>(array: unknown[]): T[] {
  const result: T[] = [];
  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...flattenDeep<T>(item));
    } else {
      result.push(item as T);
    }
  }
  return result;
}

/**
 * Get unique elements from array
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Zip two arrays into array of pairs
 */
export function zip<T, U>(array1: T[], array2: U[]): [T, U][] {
  const length = Math.min(array1.length, array2.length);
  const result: [T, U][] = [];
  for (let i = 0; i < length; i++) {
    result.push([array1[i], array2[i]]);
  }
  return result;
}

/**
 * Unzip array of pairs into two arrays
 */
export function unzip<T, U>(pairs: [T, U][]): [T[], U[]] {
  const array1: T[] = [];
  const array2: U[] = [];
  for (const [a, b] of pairs) {
    array1.push(a);
    array2.push(b);
  }
  return [array1, array2];
}

/**
 * Partition array into two arrays based on predicate
 */
export function partition<T>(array: T[], fn: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  for (const item of array) {
    if (fn(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }
  return [truthy, falsy];
}

/**
 * Shuffle array randomly (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Sample random element from array
 */
export function sample<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

/**
 * Sample n random elements without replacement
 */
export function sampleSize<T>(array: T[], n: number): T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, n);
}

/**
 * Count occurrences of each element
 */
export function countBy<T, K extends string | number | symbol>(array: T[], keyFn: (item: T) => K): Record<K, number> {
  const counts = {} as Record<K, number>;
  for (const item of array) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/**
 * Create range of numbers from start to end (exclusive)
 */
export function range(start: number, end?: number, step: number = 1): number[] {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}
export class CollectionClass<T> {
  constructor(private _items: T[] = []) {}

  static of<T>(...items: T[]): CollectionClass<T> {
    return new CollectionClass<T>(items);
  }

  static from<T>(items: T[]): CollectionClass<T> {
    return new CollectionClass<T>([...items]);
  }

  get items(): T[] {
    return [...this._items];
  }

  get length(): number {
    return this._items.length;
  }

  filter(predicate: (value: T, index: number) => boolean): CollectionClass<T> {
    return new CollectionClass(this._items.filter(predicate));
  }

  map<U>(fn: (value: T, index: number) => U): CollectionClass<U> {
    return new CollectionClass(this._items.map(fn));
  }

  reduce<U>(fn: (acc: U, value: T, index: number) => U, initialValue: U): U {
    return this._items.reduce(fn, initialValue);
  }

  find(predicate: (value: T, index: number) => boolean): T | undefined {
    return this._items.find(predicate);
  }

  every(predicate: (value: T, index: number) => boolean): boolean {
    return this._items.every(predicate);
  }

  some(predicate: (value: T, index: number) => boolean): boolean {
    return this._items.some(predicate);
  }

  forEach(fn: (value: T, index: number) => void): void {
    this._items.forEach(fn);
  }

  includes(value: T): boolean {
    return this._items.includes(value);
  }

  indexOf(value: T): number {
    return this._items.indexOf(value);
  }

  slice(start: number, end?: number): CollectionClass<T> {
    return new CollectionClass(this._items.slice(start, end));
  }

  concat(other: CollectionClass<T>): CollectionClass<T> {
    return new CollectionClass(this._items.concat(other._items));
  }

  reverse(): CollectionClass<T> {
    return new CollectionClass([...this._items].reverse());
  }

  sort(comparator?: (a: T, b: T) => number): CollectionClass<T> {
    return new CollectionClass([...this._items].sort(comparator));
  }

  first(): T | undefined {
    return this._items[0];
  }

  last(): T | undefined {
    return this._items[this._items.length - 1];
  }

  toArray(): T[] {
    return [...this._items];
  }

  isEmpty(): boolean {
    return this._items.length === 0;
  }

  count(predicate: (value: T) => boolean): number {
    return this._items.filter(predicate).length;
  }

  distinct(): CollectionClass<T> {
    return new CollectionClass([...new Set(this._items)]);
  }

  take(n: number): CollectionClass<T> {
    return new CollectionClass(this._items.slice(0, n));
  }

  skip(n: number): CollectionClass<T> {
    return new CollectionClass(this._items.slice(n));
  }

  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    const items = this._items;
    return {
      next(): IteratorResult<T> {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }
}
