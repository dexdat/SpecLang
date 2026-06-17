class CollectionClassImpl<T> {
  private readonly items: T[];

  private constructor(items: T[]) {
    this.items = items;
  }

  static from<T>(array: T[]): CollectionClass<T> {
    return new CollectionClassImpl([...array]) as unknown as CollectionClass<T>;
  }

  static of<T>(...items: T[]): CollectionClass<T> {
    return new CollectionClassImpl([...items]) as unknown as CollectionClass<T>;
  }

  get length(): number {
    return this.items.length;
  }

  filter(predicate: (item: T) => boolean): CollectionClass<T> {
    return new CollectionClassImpl(this.items.filter(predicate)) as unknown as CollectionClass<T>;
  }

  map<U>(fn: (item: T) => U): CollectionClass<U> {
    return new CollectionClassImpl(this.items.map(fn)) as unknown as CollectionClass<U>;
  }

  reduce<U>(fn: (acc: U, item: T) => U, initial: U): U {
    return this.items.reduce(fn, initial);
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  every(predicate: (item: T) => boolean): boolean {
    return this.items.every(predicate);
  }

  some(predicate: (item: T) => boolean): boolean {
    return this.items.some(predicate);
  }

  reverse(): CollectionClass<T> {
    return new CollectionClassImpl([...this.items].reverse()) as unknown as CollectionClass<T>;
  }

  sort(compareFn?: (a: T, b: T) => number): CollectionClass<T> {
    return new CollectionClassImpl([...this.items].sort(compareFn)) as unknown as CollectionClass<T>;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  first(): T | undefined {
    return this.items[0];
  }

  last(): T | undefined {
    return this.items[this.items.length - 1];
  }

  distinct(): CollectionClass<T> {
    return new CollectionClassImpl([...new Set(this.items)]) as unknown as CollectionClass<T>;
  }

  take(n: number): CollectionClass<T> {
    return new CollectionClassImpl(this.items.slice(0, n)) as unknown as CollectionClass<T>;
  }

  skip(n: number): CollectionClass<T> {
    return new CollectionClassImpl(this.items.slice(n)) as unknown as CollectionClass<T>;
  }

  toArray(): T[] {
    return [...this.items];
  }

  count(predicate: (item: T) => boolean): number {
    return this.items.filter(predicate).length;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }
}

type CollectionClass<T> = CollectionClassImpl<T>;
const CollectionClass = CollectionClassImpl;

export { CollectionClass };
