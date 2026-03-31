/**
 * SPECLANG-GENERATED - Do not edit directly
 * Source: specs/stdlib.spec.dir
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as assertions from '../../specs/stdlib.spec.dir/src/assertions';
import * as strings from '../../specs/stdlib.spec.dir/src/strings';
import * as collections from '../../specs/stdlib.spec.dir/src/collections';
import * as math from '../../specs/stdlib.spec.dir/src/math';
import * as objects from '../../specs/stdlib.spec.dir/src/objects';
import * as compose from '../../specs/stdlib.spec.dir/src/compose';

describe('stdlib: assertions', () => {
  describe('assert', () => {
    it('should not throw when condition is true', () => {
      expect(() => assertions.assert(true)).not.toThrow();
    });
    it('should throw when condition is false', () => {
      expect(() => assertions.assert(false)).toThrow();
    });
    it('should throw with custom message', () => {
      expect(() => assertions.assert(false, 'custom error')).toThrow('custom error');
    });
  });

  describe('assertEquals', () => {
    it('should not throw when values are equal', () => {
      expect(() => assertions.assertEquals(1, 1)).not.toThrow();
    });
    it('should throw when values are not equal', () => {
      expect(() => assertions.assertEquals(1, 2)).toThrow();
    });
  });

  describe('assertNotEquals', () => {
    it('should not throw when values are not equal', () => {
      expect(() => assertions.assertNotEquals(1, 2)).not.toThrow();
    });
    it('should throw when values are equal', () => {
      expect(() => assertions.assertNotEquals(1, 1)).toThrow();
    });
  });

  describe('assertTrue', () => {
    it('should not throw for truthy values', () => {
      expect(() => assertions.assertTrue(1)).not.toThrow();
      expect(() => assertions.assertTrue('hello')).not.toThrow();
      expect(() => assertions.assertTrue(true)).not.toThrow();
    });
    it('should throw for falsy values', () => {
      expect(() => assertions.assertTrue(0)).toThrow();
      expect(() => assertions.assertTrue('')).toThrow();
      expect(() => assertions.assertTrue(false)).toThrow();
    });
  });

  describe('assertFalse', () => {
    it('should not throw for falsy values', () => {
      expect(() => assertions.assertFalse(0)).not.toThrow();
      expect(() => assertions.assertFalse('')).not.toThrow();
      expect(() => assertions.assertFalse(false)).not.toThrow();
    });
    it('should throw for truthy values', () => {
      expect(() => assertions.assertFalse(1)).toThrow();
    });
  });

  describe('assertNull', () => {
    it('should not throw for null', () => {
      expect(() => assertions.assertNull(null)).not.toThrow();
    });
    it('should throw for non-null', () => {
      expect(() => assertions.assertNull(undefined)).toThrow();
    });
  });

  describe('assertNotNull', () => {
    it('should not throw for non-null', () => {
      expect(() => assertions.assertNotNull('hello')).not.toThrow();
    });
    it('should throw for null', () => {
      expect(() => assertions.assertNotNull(null)).toThrow();
    });
  });

  describe('assertUndefined', () => {
    it('should not throw for undefined', () => {
      expect(() => assertions.assertUndefined(undefined)).not.toThrow();
    });
    it('should throw for defined values', () => {
      expect(() => assertions.assertUndefined(1)).toThrow();
    });
  });

  describe('assertDefined', () => {
    it('should not throw for defined values', () => {
      expect(() => assertions.assertDefined(1)).not.toThrow();
    });
    it('should throw for undefined', () => {
      expect(() => assertions.assertDefined(undefined)).toThrow();
    });
  });

  describe('assertType', () => {
    it('should not throw for correct type', () => {
      expect(() => assertions.assertType('hello', 'string')).not.toThrow();
      expect(() => assertions.assertType(123, 'number')).not.toThrow();
      expect(() => assertions.assertType(true, 'boolean')).not.toThrow();
    });
    it('should throw for incorrect type', () => {
      expect(() => assertions.assertType('hello', 'number')).toThrow();
    });
  });

  describe('assertIsArray', () => {
    it('should not throw for arrays', () => {
      expect(() => assertions.assertIsArray([1, 2, 3])).not.toThrow();
    });
    it('should throw for non-arrays', () => {
      expect(() => assertions.assertIsArray('hello')).toThrow();
    });
  });

  describe('assertIsObject', () => {
    it('should not throw for plain objects', () => {
      expect(() => assertions.assertIsObject({})).not.toThrow();
      expect(() => assertions.assertIsObject({ a: 1 })).not.toThrow();
    });
    it('should throw for arrays', () => {
      expect(() => assertions.assertIsObject([1, 2])).toThrow();
    });
    it('should throw for null', () => {
      expect(() => assertions.assertIsObject(null)).toThrow();
    });
  });

  describe('assertLength', () => {
    it('should not throw when length matches', () => {
      expect(() => assertions.assertLength([1, 2, 3], 3)).not.toThrow();
      expect(() => assertions.assertLength('hello', 5)).not.toThrow();
    });
    it('should throw when length does not match', () => {
      expect(() => assertions.assertLength([1, 2], 3)).toThrow();
    });
  });

  describe('assertThrows', () => {
    it('should not throw when function throws', () => {
      expect(() => assertions.assertThrows(() => { throw new Error(); })).not.toThrow();
    });
    it('should throw when function does not throw', () => {
      expect(() => assertions.assertThrows(() => {})).toThrow();
    });
  });

  describe('assertNotThrows', () => {
    it('should not throw when function does not throw', () => {
      expect(() => assertions.assertNotThrows(() => {})).not.toThrow();
    });
    it('should throw when function throws', () => {
      expect(() => assertions.assertNotThrows(() => { throw new Error(); })).toThrow();
    });
  });

  describe('assertContains', () => {
    it('should not throw when array contains item', () => {
      expect(() => assertions.assertContains([1, 2, 3], 2)).not.toThrow();
    });
    it('should throw when array does not contain item', () => {
      expect(() => assertions.assertContains([1, 2], 3)).toThrow();
    });
  });

  describe('assertHasProperty', () => {
    it('should not throw when object has property', () => {
      expect(() => assertions.assertHasProperty({ a: 1 }, 'a')).not.toThrow();
    });
    it('should throw when object does not have property', () => {
      expect(() => assertions.assertHasProperty({ a: 1 }, 'b')).toThrow();
    });
  });

  // assertDeepEqual is not exported from the module
  // It uses a private deepEqual helper function
});

describe('stdlib: strings', () => {
  describe('split', () => {
    it('should split string by separator', () => {
      expect(strings.split('a,b,c', ',')).toEqual(['a', 'b', 'c']);
    });
    it('should split by regex', () => {
      expect(strings.split('a1b2c', /\d/)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('join', () => {
    it('should join array with separator', () => {
      expect(strings.join(['a', 'b', 'c'], ',')).toBe('a,b,c');
    });
  });

  describe('trim', () => {
    it('should trim whitespace', () => {
      expect(strings.trim('  hello  ')).toBe('hello');
    });
  });

  describe('trimStart', () => {
    it('should trim start whitespace', () => {
      expect(strings.trimStart('  hello')).toBe('hello');
    });
  });

  describe('trimEnd', () => {
    it('should trim end whitespace', () => {
      expect(strings.trimEnd('hello  ')).toBe('hello');
    });
  });

  describe('format', () => {
    it('should format with positional placeholders', () => {
      expect(strings.format('{0} {1}', 'hello', 'world')).toBe('hello world');
    });
    it('should handle missing args', () => {
      expect(strings.format('{0} {1}', 'hello')).toBe('hello {1}');
    });
  });

  describe('interpolate', () => {
    it('should interpolate with object properties', () => {
      expect(strings.interpolate('{name} is {age}', { name: 'John', age: 30 })).toBe('John is 30');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(strings.capitalize('hello')).toBe('Hello');
    });
    it('should handle empty string', () => {
      expect(strings.capitalize('')).toBe('');
    });
  });

  describe('lowerCase', () => {
    it('should convert to lowercase', () => {
      expect(strings.lowerCase('HELLO')).toBe('hello');
    });
  });

  describe('upperCase', () => {
    it('should convert to uppercase', () => {
      expect(strings.upperCase('hello')).toBe('HELLO');
    });
  });

  describe('replaceAll', () => {
    it('should replace all occurrences', () => {
      expect(strings.replaceAll('hello world', 'o', 'x')).toBe('hellx wxrld');
    });
  });

  describe('padStart', () => {
    it('should pad start', () => {
      expect(strings.padStart('hello', 10)).toBe('     hello');
    });
  });

  describe('padEnd', () => {
    it('should pad end', () => {
      expect(strings.padEnd('hello', 10)).toBe('hello     ');
    });
  });

  describe('startsWith', () => {
    it('should check prefix', () => {
      expect(strings.startsWith('hello', 'hel')).toBe(true);
      expect(strings.startsWith('hello', 'world')).toBe(false);
    });
  });

  describe('endsWith', () => {
    it('should check suffix', () => {
      expect(strings.endsWith('hello', 'llo')).toBe(true);
      expect(strings.endsWith('hello', 'hel')).toBe(false);
    });
  });

  describe('includes', () => {
    it('should check substring', () => {
      expect(strings.includes('hello', 'ell')).toBe(true);
      expect(strings.includes('hello', 'world')).toBe(false);
    });
  });

  describe('repeat', () => {
    it('should repeat string', () => {
      expect(strings.repeat('ha', 3)).toBe('hahaha');
    });
  });

  describe('slice', () => {
    it('should slice string', () => {
      expect(strings.slice('hello', 1, 3)).toBe('el');
    });
  });

  describe('substring', () => {
    it('should get substring', () => {
      expect(strings.substring('hello', 1, 3)).toBe('el');
    });
  });
});

describe('stdlib: collections', () => {
  describe('map', () => {
    it('should map over array', () => {
      expect(collections.map([1, 2, 3], x => x * 2)).toEqual([2, 4, 6]);
    });
  });

  describe('filter', () => {
    it('should filter array', () => {
      expect(collections.filter([1, 2, 3, 4], x => x % 2 === 0)).toEqual([2, 4]);
    });
  });

  describe('reduce', () => {
    it('should reduce array', () => {
      expect(collections.reduce([1, 2, 3], (acc, x) => acc + x, 0)).toBe(6);
    });
  });

  describe('find', () => {
    it('should find element', () => {
      expect(collections.find([1, 2, 3], x => x > 1)).toBe(2);
    });
    it('should return undefined if not found', () => {
      expect(collections.find([1, 2, 3], x => x > 10)).toBeUndefined();
    });
  });

  describe('sort', () => {
    it('should sort array', () => {
      expect(collections.sort([3, 1, 2])).toEqual([1, 2, 3]);
    });
    it('should not mutate original', () => {
      const original = [3, 1, 2];
      collections.sort(original);
      expect(original).toEqual([3, 1, 2]);
    });
  });

  describe('groupBy', () => {
    it('should group by key', () => {
      expect(collections.groupBy(['a', 'bb', 'ccc'], x => x.length)).toEqual({
        1: ['a'],
        2: ['bb'],
        3: ['ccc']
      });
    });
  });

  describe('chunk', () => {
    it('should chunk array', () => {
      expect(collections.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('flatten', () => {
    it('should flatten one level', () => {
      expect(collections.flatten([1, [2, 3], [4]])).toEqual([1, 2, 3, 4]);
    });
  });

  describe('flattenDeep', () => {
    it('should flatten deeply', () => {
      expect(collections.flattenDeep([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4]);
    });
  });

  describe('unique', () => {
    it('should return unique elements', () => {
      expect(collections.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('zip', () => {
    it('should zip two arrays', () => {
      expect(collections.zip([1, 2], ['a', 'b'])).toEqual([[1, 'a'], [2, 'b']]);
    });
  });

  describe('unzip', () => {
    it('should unzip array of pairs', () => {
      expect(collections.unzip([[1, 'a'], [2, 'b']])).toEqual([[1, 2], ['a', 'b']]);
    });
  });

  describe('partition', () => {
    it('should partition by predicate', () => {
      expect(collections.partition([1, 2, 3, 4], x => x % 2 === 0)).toEqual([[2, 4], [1, 3]]);
    });
  });

  describe('shuffle', () => {
    it('should shuffle array', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = collections.shuffle([...original]);
      expect(shuffled.sort()).toEqual(original.sort());
    });
  });

  describe('sample', () => {
    it('should return random element', () => {
      const result = collections.sample([1, 2, 3]);
      expect([1, 2, 3]).toContain(result!);
    });
    it('should return undefined for empty array', () => {
      expect(collections.sample([])).toBeUndefined();
    });
  });

  describe('sampleSize', () => {
    it('should sample n elements', () => {
      const result = collections.sampleSize([1, 2, 3, 4, 5], 3);
      expect(result.length).toBe(3);
    });
  });

  describe('countBy', () => {
    it('should count by key', () => {
      expect(collections.countBy(['a', 'b', 'a', 'c', 'a'], x => x)).toEqual({ a: 3, b: 1, c: 1 });
    });
  });

  describe('range', () => {
    it('should create range', () => {
      expect(collections.range(5)).toEqual([0, 1, 2, 3, 4]);
    });
    it('should create range with start and end', () => {
      expect(collections.range(2, 5)).toEqual([2, 3, 4]);
    });
    it('should handle step', () => {
      expect(collections.range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
    });
  });
});

describe('stdlib: math', () => {
  describe('add', () => {
    it('should add two numbers', () => {
      expect(math.add(1, 2)).toBe(3);
    });
  });

  describe('subtract', () => {
    it('should subtract', () => {
      expect(math.subtract(5, 3)).toBe(2);
    });
  });

  describe('multiply', () => {
    it('should multiply', () => {
      expect(math.multiply(3, 4)).toBe(12);
    });
  });

  describe('divide', () => {
    it('should divide', () => {
      expect(math.divide(10, 2)).toBe(5);
    });
  });

  describe('modulo', () => {
    it('should return modulo', () => {
      expect(math.modulo(10, 3)).toBe(1);
    });
  });

  describe('pow', () => {
    it('should return power', () => {
      expect(math.pow(2, 3)).toBe(8);
    });
  });

  describe('sqrt', () => {
    it('should return square root', () => {
      expect(math.sqrt(16)).toBe(4);
    });
  });

  describe('abs', () => {
    it('should return absolute value', () => {
      expect(math.abs(-5)).toBe(5);
    });
  });

  describe('round', () => {
    it('should round', () => {
      expect(math.round(4.5)).toBe(5);
    });
  });

  describe('floor', () => {
    it('should floor', () => {
      expect(math.floor(4.9)).toBe(4);
    });
  });

  describe('ceil', () => {
    it('should ceil', () => {
      expect(math.ceil(4.1)).toBe(5);
    });
  });

  describe('min/max', () => {
    it('should return min', () => {
      expect(math.min(1, 2, 3)).toBe(1);
    });
    it('should return max', () => {
      expect(math.max(1, 2, 3)).toBe(3);
    });
  });

  describe('sum', () => {
    it('should sum numbers', () => {
      expect(math.sum(1, 2, 3, 4, 5)).toBe(15);
    });
  });

  describe('product', () => {
    it('should multiply numbers', () => {
      expect(math.product(1, 2, 3, 4)).toBe(24);
    });
  });

  describe('mean', () => {
    it('should return mean', () => {
      expect(math.mean(1, 2, 3)).toBe(2);
    });
    it('should return NaN for empty', () => {
      expect(math.mean()).toBeNaN();
    });
  });

  describe('median', () => {
    it('should return median for odd', () => {
      expect(math.median(1, 2, 3)).toBe(2);
    });
    it('should return median for even', () => {
      expect(math.median(1, 2, 3, 4)).toBe(2.5);
    });
  });

  describe('mode', () => {
    it('should return mode', () => {
      expect(math.mode(1, 2, 2, 3)).toEqual([2]);
    });
    it('should handle multiple modes', () => {
      expect(math.mode(1, 1, 2, 2)).toContain(1);
    });
  });

  describe('stdDev', () => {
    it('should return standard deviation', () => {
      expect(math.stdDev(2, 4, 4, 4, 5, 5, 7, 9)).toBe(2);
    });
  });

  describe('random', () => {
    it('should return random number', () => {
      const result = math.random();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });
  });

  describe('randomInt', () => {
    it('should return random integer', () => {
      const result = math.randomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });
  });

  describe('clamp', () => {
    it('should clamp value', () => {
      expect(math.clamp(5, 0, 10)).toBe(5);
      expect(math.clamp(-5, 0, 10)).toBe(0);
      expect(math.clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('lerp', () => {
    it('should interpolate linearly', () => {
      expect(math.lerp(0, 10, 0.5)).toBe(5);
    });
  });

  describe('inRange', () => {
    it('should check if in range', () => {
      expect(math.inRange(5, 0, 10)).toBe(true);
      expect(math.inRange(0, 0, 10)).toBe(true);
      expect(math.inRange(10, 0, 10)).toBe(true);
    });
  });

  describe('factorial', () => {
    it('should return factorial', () => {
      expect(math.factorial(5)).toBe(120);
      expect(math.factorial(0)).toBe(1);
    });
  });

  describe('gcd', () => {
    it('should return GCD', () => {
      expect(math.gcd(48, 18)).toBe(6);
    });
  });

  describe('lcm', () => {
    it('should return LCM', () => {
      expect(math.lcm(4, 6)).toBe(12);
    });
  });
});

describe('stdlib: objects', () => {
  const obj = { a: 1, b: 2, c: 3 };

  describe('keys', () => {
    it('should return keys', () => {
      expect(objects.keys(obj)).toContain('a');
      expect(objects.keys(obj)).toContain('b');
      expect(objects.keys(obj)).toContain('c');
    });
  });

  describe('values', () => {
    it('should return values', () => {
      expect(objects.values(obj)).toContain(1);
      expect(objects.values(obj)).toContain(2);
      expect(objects.values(obj)).toContain(3);
    });
  });

  describe('entries', () => {
    it('should return entries', () => {
      expect(objects.entries(obj)).toContainEqual(['a', 1]);
    });
  });

  describe('fromEntries', () => {
    it('should create object from entries', () => {
      expect(objects.fromEntries([['a', 1], ['b', 2]])).toEqual({ a: 1, b: 2 });
    });
  });

  describe('merge', () => {
    it('should merge objects', () => {
      expect(objects.merge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    });
  });

  describe('deepMerge', () => {
    it('should deep merge objects', () => {
      expect(objects.deepMerge({ a: { b: 1 } }, { a: { c: 2 } })).toEqual({ a: { b: 1, c: 2 } });
    });
  });

  describe('pick', () => {
    it('should pick properties', () => {
      expect(objects.pick(obj, ['a', 'b'])).toEqual({ a: 1, b: 2 });
    });
  });

  describe('omit', () => {
    it('should omit properties', () => {
      expect(objects.omit(obj, ['c'])).toEqual({ a: 1, b: 2 });
    });
  });

  describe('get', () => {
    it('should get nested property', () => {
      expect(objects.get<number>({ a: { b: { c: 1 } } }, 'a.b.c')).toBe(1);
    });
    it('should return undefined for missing path', () => {
      expect(objects.get({ a: 1 }, 'b.c')).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set nested property', () => {
      const testObj: any = {};
      objects.set(testObj, 'a.b.c', 1);
      expect(testObj).toEqual({ a: { b: { c: 1 } } });
    });
  });

  describe('has', () => {
    it('should check nested property', () => {
      expect(objects.has({ a: { b: 1 } }, 'a.b')).toBe(true);
      expect(objects.has({ a: 1 }, 'b.c')).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('should deep clone object', () => {
      const original = { a: { b: 1 } };
      const cloned = objects.deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });

  describe('deepEqual', () => {
    it('should check deep equality', () => {
      expect(objects.deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
      expect(objects.deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });
  });

  describe('shallowEqual', () => {
    it('should check shallow equality', () => {
      const ref = { a: 1 };
      expect(objects.shallowEqual(ref, ref)).toBe(true);
      expect(objects.shallowEqual({ a: 1 }, { a: 1 })).toBe(false);
    });
  });

  describe('deepFreeze', () => {
    it('should deep freeze object', () => {
      const frozen = objects.deepFreeze({ a: { b: 1 } });
      expect(Object.isFrozen(frozen)).toBe(true);
    });
  });
});

describe('stdlib: compose', () => {
  const add1 = (x: number) => x + 1;
  const double = (x: number) => x * 2;
  const subtract5 = (x: number) => x - 5;

  describe('pipe', () => {
    it('should pipe functions left to right', () => {
      const result = compose.pipe(1, add1, double);
      expect(result).toBe(4); // (1 + 1) * 2
    });
  });

  describe('compose', () => {
    it('should compose functions right to left', () => {
      const add1ThenDouble = compose.compose(
        (x: number) => x * 2,
        (x: number) => x + 1
      );
      const result = add1ThenDouble(1);
      expect(result).toBe(4); // (1 + 1) * 2
    });
  });

  describe('curry', () => {
    it('should curry function', () => {
      const curried = compose.curry((a: number, b: number, c: number) => a + b + c);
      expect(curried(1)(2)(3)).toBe(6);
    });
  });

  describe('partial', () => {
    it('should partially apply function', () => {
      const add = (a: number, b: number) => a + b;
      const add5 = compose.partial(add, 5);
      expect(add5(10)).toBe(15);
    });
  });

  describe('memoize', () => {
    it('should memoize function', () => {
      let callCount = 0;
      const fn = compose.memoize((x: number) => {
        callCount++;
        return x * 2;
      });
      expect(fn(5)).toBe(10);
      expect(fn(5)).toBe(10);
      expect(callCount).toBe(1);
    });
  });
});
