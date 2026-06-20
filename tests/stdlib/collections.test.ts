import { describe, it, expect } from 'vitest';
import { CollectionClass } from '../../src/stdlib/collections';

describe('CollectionClass', () => {
  describe('construction', () => {
    it('should create from array', () => {
      const c = CollectionClass.from([1, 2, 3]);
      expect(c.length).toBe(3);
      expect(c.toArray()).toEqual([1, 2, 3]);
    });

    it('should create with of', () => {
      const c = CollectionClass.of(1, 2, 3);
      expect(c.toArray()).toEqual([1, 2, 3]);
    });

    it('should create empty collection from empty array', () => {
      const c = CollectionClass.from([]);
      expect(c.length).toBe(0);
      expect(c.isEmpty()).toBe(true);
    });

    it('should create empty collection with of()', () => {
      const c = CollectionClass.of<number>();
      expect(c.isEmpty()).toBe(true);
    });

    it('should create from array with undefined items', () => {
      const c = CollectionClass.from([1, undefined, 3]);
      expect(c.length).toBe(3);
    });
  });

  describe('filter', () => {
    it('should filter items', () => {
      const c = CollectionClass.of(1, 2, 3, 4).filter(x => x % 2 === 0);
      expect(c.toArray()).toEqual([2, 4]);
    });

    it('should return empty when no match', () => {
      const c = CollectionClass.of(1, 2, 3).filter(x => x > 10);
      expect(c.isEmpty()).toBe(true);
    });

    it('should preserve all when all match', () => {
      const c = CollectionClass.of(1, 2, 3).filter(x => x > 0);
      expect(c.length).toBe(3);
    });

    it('should not mutate original', () => {
      const original = CollectionClass.of(1, 2, 3, 4);
      original.filter(x => x % 2 === 0);
      expect(original.toArray()).toEqual([1, 2, 3, 4]);
    });
  });

  describe('map', () => {
    it('should map items', () => {
      const c = CollectionClass.of(1, 2, 3).map(x => x * 2);
      expect(c.toArray()).toEqual([2, 4, 6]);
    });

    it('should map to different type', () => {
      const c = CollectionClass.of(1, 2, 3).map(x => x.toString());
      expect(c.toArray()).toEqual(['1', '2', '3']);
    });

    it('should map empty collection', () => {
      const c = CollectionClass.of<number>().map(x => x * 2);
      expect(c.isEmpty()).toBe(true);
    });

    it('should not mutate original', () => {
      const original = CollectionClass.of(1, 2, 3);
      original.map(x => x * 10);
      expect(original.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe('reduce', () => {
    it('should reduce to sum', () => {
      const sum = CollectionClass.of(1, 2, 3).reduce((acc, x) => acc + x, 0);
      expect(sum).toBe(6);
    });

    it('should reduce to concatenated string', () => {
      const result = CollectionClass.of('a', 'b', 'c').reduce((acc, x) => acc + x, '');
      expect(result).toBe('abc');
    });

    it('should reduce with initial value as first element', () => {
      const max = CollectionClass.of(3, 7, 2, 9, 1).reduce((acc, x) => (x > acc ? x : acc), -Infinity);
      expect(max).toBe(9);
    });

    it('should reduce empty collection to initial', () => {
      const result = CollectionClass.of<number>().reduce((acc, x) => acc + x, 42);
      expect(result).toBe(42);
    });
  });

  describe('find', () => {
    it('should find first matching item', () => {
      const found = CollectionClass.of(1, 2, 3).find(x => x > 1);
      expect(found).toBe(2);
    });

    it('should return undefined when no match', () => {
      const found = CollectionClass.of(1, 2, 3).find(x => x > 10);
      expect(found).toBeUndefined();
    });

    it('should return first match only', () => {
      const found = CollectionClass.of(1, 2, 3, 4).find(x => x > 2);
      expect(found).toBe(3);
    });
  });

  describe('every', () => {
    it('should return true when all match', () => {
      expect(CollectionClass.of(2, 4, 6).every(x => x % 2 === 0)).toBe(true);
    });

    it('should return false when some miss', () => {
      expect(CollectionClass.of(2, 3, 6).every(x => x % 2 === 0)).toBe(false);
    });

    it('should return true for empty collection', () => {
      expect(CollectionClass.of<number>().every(x => x > 0)).toBe(true);
    });

    it('should return false on first non-matching', () => {
      let count = 0;
      CollectionClass.of(2, 3, 4).every(x => {
        count++;
        return x % 2 === 0;
      });
      expect(count).toBe(2);
    });
  });

  describe('some', () => {
    it('should return true when any match', () => {
      expect(CollectionClass.of(1, 2, 3).some(x => x > 2)).toBe(true);
    });

    it('should return false when none match', () => {
      expect(CollectionClass.of(1, 2, 3).some(x => x > 10)).toBe(false);
    });

    it('should return false for empty collection', () => {
      expect(CollectionClass.of<number>().some(x => x > 0)).toBe(false);
    });

    it('should stop on first match', () => {
      let count = 0;
      CollectionClass.of(1, 2, 3, 4, 5).some(x => {
        count++;
        return x > 2;
      });
      expect(count).toBe(3);
    });
  });

  describe('reverse', () => {
    it('should reverse items', () => {
      expect(CollectionClass.of(1, 2, 3).reverse().toArray()).toEqual([3, 2, 1]);
    });

    it('should not mutate original', () => {
      const original = CollectionClass.of(1, 2, 3);
      original.reverse();
      expect(original.toArray()).toEqual([1, 2, 3]);
    });

    it('should reverse single element', () => {
      expect(CollectionClass.of(42).reverse().toArray()).toEqual([42]);
    });

    it('should reverse empty collection', () => {
      expect(CollectionClass.of<number>().reverse().toArray()).toEqual([]);
    });
  });

  describe('sort', () => {
    it('should sort with default comparator', () => {
      expect(CollectionClass.of(3, 1, 2).sort().toArray()).toEqual([1, 2, 3]);
    });

    it('should sort with custom comparator', () => {
      const c = CollectionClass.of(3, 1, 2).sort((a, b) => b - a);
      expect(c.toArray()).toEqual([3, 2, 1]);
    });

    it('should not mutate original', () => {
      const original = CollectionClass.of(3, 1, 2);
      original.sort();
      expect(original.toArray()).toEqual([3, 1, 2]);
    });

    it('should sort objects by property', () => {
      type Item = { name: string; priority: number };
      const c = CollectionClass.of<Item>(
        { name: 'a', priority: 3 },
        { name: 'b', priority: 1 },
        { name: 'c', priority: 2 }
      ).sort((a, b) => a.priority - b.priority);
      expect(c.toArray().map(x => x.name)).toEqual(['b', 'c', 'a']);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty', () => {
      expect(CollectionClass.of<number>().isEmpty()).toBe(true);
    });

    it('should return false for non-empty', () => {
      expect(CollectionClass.of(1).isEmpty()).toBe(false);
    });

    it('should return false for single item', () => {
      expect(CollectionClass.of(42).isEmpty()).toBe(false);
    });
  });

  describe('first', () => {
    it('should get first element', () => {
      expect(CollectionClass.of(10, 20, 30).first()).toBe(10);
    });

    it('should return undefined for empty', () => {
      expect(CollectionClass.of<number>().first()).toBeUndefined();
    });

    it('should return only element for single-item collection', () => {
      expect(CollectionClass.of(42).first()).toBe(42);
    });
  });

  describe('last', () => {
    it('should get last element', () => {
      expect(CollectionClass.of(10, 20, 30).last()).toBe(30);
    });

    it('should return undefined for empty', () => {
      expect(CollectionClass.of<number>().last()).toBeUndefined();
    });

    it('should return only element for single-item collection', () => {
      expect(CollectionClass.of(42).last()).toBe(42);
    });
  });

  describe('distinct', () => {
    it('should remove duplicates', () => {
      const c = CollectionClass.of(1, 2, 2, 3, 3, 3).distinct();
      expect(c.toArray()).toEqual([1, 2, 3]);
    });

    it('should keep order of first occurrence', () => {
      const c = CollectionClass.of(3, 1, 2, 1, 3).distinct();
      expect(c.toArray()).toEqual([3, 1, 2]);
    });

    it('should handle all same items', () => {
      const c = CollectionClass.of(1, 1, 1, 1).distinct();
      expect(c.toArray()).toEqual([1]);
    });

    it('should handle empty collection', () => {
      const c = CollectionClass.of<number>().distinct();
      expect(c.isEmpty()).toBe(true);
    });

    it('should not mutate original', () => {
      const original = CollectionClass.of(1, 2, 2, 3);
      original.distinct();
      expect(original.toArray()).toEqual([1, 2, 2, 3]);
    });
  });

  describe('take', () => {
    it('should take first n items', () => {
      expect(CollectionClass.of(1, 2, 3, 4, 5).take(2).toArray()).toEqual([1, 2]);
    });

    it('should take 0 items', () => {
      expect(CollectionClass.of(1, 2, 3).take(0).toArray()).toEqual([]);
    });

    it('should take more than available', () => {
      expect(CollectionClass.of(1, 2, 3).take(999).toArray()).toEqual([1, 2, 3]);
    });

    it('should take all items when n equals length', () => {
      expect(CollectionClass.of(1, 2, 3).take(3).toArray()).toEqual([1, 2, 3]);
    });

    it('should take negative as offset from end', () => {
      expect(CollectionClass.of(1, 2, 3).take(-1).toArray()).toEqual([1, 2]);
    });

    it('should not mutate original', () => {
      const original = CollectionClass.of(1, 2, 3);
      original.take(2);
      expect(original.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe('skip', () => {
    it('should skip first n items', () => {
      expect(CollectionClass.of(1, 2, 3, 4, 5).skip(3).toArray()).toEqual([4, 5]);
    });

    it('should skip 0 items', () => {
      expect(CollectionClass.of(1, 2, 3).skip(0).toArray()).toEqual([1, 2, 3]);
    });

    it('should skip more than available', () => {
      expect(CollectionClass.of(1, 2, 3).skip(999).toArray()).toEqual([]);
    });

    it('should skip all when n equals length', () => {
      expect(CollectionClass.of(1, 2, 3).skip(3).toArray()).toEqual([]);
    });

    it('should skip negative as offset from end', () => {
      expect(CollectionClass.of(1, 2, 3).skip(-1).toArray()).toEqual([3]);
    });

    it('should not mutate original', () => {
      const original = CollectionClass.of(1, 2, 3);
      original.skip(2);
      expect(original.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe('toArray', () => {
    it('should return a copy of items', () => {
      const c = CollectionClass.of(1, 2, 3);
      const arr = c.toArray();
      arr.push(4);
      expect(c.toArray()).toEqual([1, 2, 3]);
    });

    it('should return empty array for empty collection', () => {
      expect(CollectionClass.of<number>().toArray()).toEqual([]);
    });
  });

  describe('count', () => {
    it('should count matching items', () => {
      expect(CollectionClass.of(1, 2, 3, 4, 5).count(x => x % 2 === 0)).toBe(2);
    });

    it('should return 0 when none match', () => {
      expect(CollectionClass.of(1, 2, 3).count(x => x > 10)).toBe(0);
    });

    it('should count all matching items', () => {
      expect(CollectionClass.of(1, 2, 3, 4, 5, 6).count(x => x > 0)).toBe(6);
    });
  });

  describe('Symbol.iterator', () => {
    it('should support for...of', () => {
      const items: number[] = [];
      for (const item of CollectionClass.of(1, 2, 3)) {
        items.push(item);
      }
      expect(items).toEqual([1, 2, 3]);
    });

    it('should support spread operator', () => {
      const items = [...CollectionClass.of('a', 'b', 'c')];
      expect(items).toEqual(['a', 'b', 'c']);
    });

    it('should work with empty collection', () => {
      const items: number[] = [];
      for (const item of CollectionClass.of<number>()) {
        items.push(item);
      }
      expect(items).toEqual([]);
    });
  });

  describe('length', () => {
    it('should return correct length', () => {
      expect(CollectionClass.of(1, 2, 3).length).toBe(3);
    });

    it('should return 0 for empty', () => {
      expect(CollectionClass.of<number>().length).toBe(0);
    });

    it('should be read-only', () => {
      const c = CollectionClass.of(1, 2, 3);
      expect(c.length).toBe(3);
    });
  });

  describe('chaining', () => {
    it('should chain filter and map', () => {
      const result = CollectionClass.of(1, 2, 3, 4)
        .filter(x => x % 2 === 0)
        .map(x => x * 10);
      expect(result.toArray()).toEqual([20, 40]);
    });

    it('should chain filter map take', () => {
      const result = CollectionClass.of(1, 2, 3, 4, 5, 6)
        .filter(x => x > 2)
        .map(x => x * 2)
        .take(3);
      expect(result.toArray()).toEqual([6, 8, 10]);
    });

    it('should chain distinct sort reverse', () => {
      const result = CollectionClass.of(3, 1, 2, 1, 3, 2)
        .distinct()
        .sort()
        .reverse();
      expect(result.toArray()).toEqual([3, 2, 1]);
    });

    it('should chain skip take', () => {
      const result = CollectionClass.of(1, 2, 3, 4, 5)
        .skip(1)
        .take(3);
      expect(result.toArray()).toEqual([2, 3, 4]);
    });

    it('should chain filter on empty result', () => {
      const result = CollectionClass.of(1, 2, 3)
        .filter(x => x > 10)
        .map(x => x * 2)
        .take(5);
      expect(result.isEmpty()).toBe(true);
    });
  });
});
