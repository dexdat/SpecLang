import { describe, it, expect } from 'vitest';
import { ResultClass, OptionClass } from '../../src/stdlib/results';
import { ValidatorClass } from '../../src/stdlib/validators';
import { CollectionClass } from '../../src/stdlib/collections';

describe('ResultClass', () => {
  it('should create ok result', () => {
    const r = ResultClass.ok(42);
    expect(r.isOk()).toBe(true);
    expect(r.isErr()).toBe(false);
  });

  it('should create err result', () => {
    const r = ResultClass.err('fail');
    expect(r.isOk()).toBe(false);
    expect(r.isErr()).toBe(true);
  });

  it('should unwrap ok value', () => {
    const r = ResultClass.ok(10);
    expect(r.unwrap()).toBe(10);
  });

  it('should throw on unwrap of err', () => {
    const r = ResultClass.err('bad');
    expect(() => r.unwrap()).toThrow('bad');
  });

  it('should unwrapOr with default on err', () => {
    const r = ResultClass.err<number, string>('fail');
    expect(r.unwrapOr(0)).toBe(0);
  });

  it('should unwrapOr with value on ok', () => {
    const r = ResultClass.ok(5);
    expect(r.unwrapOr(0)).toBe(5);
  });

  it('should map ok value', () => {
    const r = ResultClass.ok(3).map(x => x * 2);
    expect(r.unwrap()).toBe(6);
  });

  it('should not map err value', () => {
    const r = ResultClass.err<number, string>('e').map(x => x * 2);
    expect(r.isErr()).toBe(true);
  });

  it('should andThen chain ok values', () => {
    const r = ResultClass.ok(5).andThen(x => ResultClass.ok(x + 1));
    expect(r.unwrap()).toBe(6);
  });

  it('should andThen short-circuit on err', () => {
    const r = ResultClass.err<number, string>('e').andThen(x => ResultClass.ok(x + 1));
    expect(r.isErr()).toBe(true);
  });

  it('should match on ok', () => {
    const val = ResultClass.ok(10).match({ ok: v => v * 2, err: e => -1 });
    expect(val).toBe(20);
  });

  it('should match on err', () => {
    const val = ResultClass.err<number, string>('bad').match({ ok: v => v, err: e => e });
    expect(val).toBe('bad');
  });

  it('should fromTry on success', () => {
    const r = ResultClass.fromTry(() => 42);
    expect(r.isOk()).toBe(true);
    expect(r.unwrap()).toBe(42);
  });

  it('should fromTry on exception', () => {
    const r = ResultClass.fromTry(() => { throw new Error('boom'); });
    expect(r.isErr()).toBe(true);
  });

  it('should mapError', () => {
    const r = ResultClass.err<number, string>('e').mapError(s => s.toUpperCase());
    expect(r.isErr()).toBe(true);
    expect(r.err()).toBe('E');
  });

  it('should unwrapOrElse on err', () => {
    const r = ResultClass.err<number, string>('e');
    expect(r.unwrapOrElse(e => e.length)).toBe(1);
  });
});

describe('OptionClass', () => {
  it('should create some', () => {
    const o = OptionClass.some(42);
    expect(o.isSome()).toBe(true);
    expect(o.isNone()).toBe(false);
  });

  it('should create none', () => {
    const o = OptionClass.none();
    expect(o.isSome()).toBe(false);
    expect(o.isNone()).toBe(true);
  });

  it('should unwrap some value', () => {
    expect(OptionClass.some(10).unwrap()).toBe(10);
  });

  it('should throw on unwrap of none', () => {
    expect(() => OptionClass.none().unwrap()).toThrow('Option is None');
  });

  it('should unwrapOr with default on none', () => {
    expect(OptionClass.none<number>().unwrapOr(0)).toBe(0);
  });

  it('should unwrapOr with value on some', () => {
    expect(OptionClass.some(5).unwrapOr(0)).toBe(5);
  });

  it('should map some value', () => {
    expect(OptionClass.some(3).map(x => x * 2).unwrap()).toBe(6);
  });

  it('should not map none', () => {
    expect(OptionClass.none<number>().map(x => x * 2).isNone()).toBe(true);
  });

  it('should andThen chain some values', () => {
    const o = OptionClass.some(5).andThen(x => OptionClass.some(x + 1));
    expect(o.unwrap()).toBe(6);
  });

  it('should andThen short-circuit on none', () => {
    const o = OptionClass.none<number>().andThen(x => OptionClass.some(x + 1));
    expect(o.isNone()).toBe(true);
  });

  it('should of create some for non-null', () => {
    expect(OptionClass.of(42).isSome()).toBe(true);
  });

  it('should of create none for null', () => {
    expect(OptionClass.of(null).isNone()).toBe(true);
  });

  it('should of create none for undefined', () => {
    expect(OptionClass.of(undefined).isNone()).toBe(true);
  });

  it('should filter matching some', () => {
    expect(OptionClass.some(5).filter(x => x > 0).isSome()).toBe(true);
  });

  it('should filter non-matching some to none', () => {
    expect(OptionClass.some(-1).filter(x => x > 0).isNone()).toBe(true);
  });

  it('should toResult on some', () => {
    const r = OptionClass.some(10).toResult('missing');
    expect(r.isOk()).toBe(true);
  });

  it('should toResult on none', () => {
    const r = OptionClass.none<number>().toResult('missing');
    expect(r.isErr()).toBe(true);
  });
});

describe('ValidatorClass', () => {
  it('should validate with no rules', () => {
    const v = ValidatorClass.create<string>();
    expect(v.validate('hello').ok).toBe(true);
  });

  it('should pass valid value', () => {
    const v = ValidatorClass.create<string>()
      .addRule(s => s.length > 0, 'Must not be empty', 'EMPTY')
      .addRule(s => s.length < 10, 'Too long', 'TOO_LONG');
    const result = v.validate('hi');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('hi');
  });

  it('should fail invalid value with errors', () => {
    const v = ValidatorClass.create<string>()
      .addRule(s => s.length > 0, 'Must not be empty', 'EMPTY')
      .addRule(s => s.length < 3, 'Too long', 'TOO_LONG');
    const result = v.validate('hello');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThanOrEqual(1);
  });

  it('should accumulate multiple errors', () => {
    const v = ValidatorClass.create<number>()
      .addRule(n => n > 0, 'Must be positive', 'NOT_POSITIVE')
      .addRule(n => n < 10, 'Must be less than 10', 'TOO_LARGE')
      .addRule(n => n % 2 === 0, 'Must be even', 'NOT_EVEN');
    const result = v.validate(-1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should chain addRule calls', () => {
    const v = ValidatorClass.create<string>()
      .addRule(s => s.length > 0, 'Required', 'REQUIRED')
      .addRule(s => s.includes('@'), 'Must have @', 'NO_AT');
    expect(v.getRuleCount()).toBe(2);
  });

  it('should isValid return boolean', () => {
    const v = ValidatorClass.create<number>()
      .addRule(n => n > 0, 'Positive', 'NOT_POS');
    expect(v.isValid(5)).toBe(true);
    expect(v.isValid(-1)).toBe(false);
  });
});

describe('CollectionClass', () => {
  it('should create from array', () => {
    const c = CollectionClass.from([1, 2, 3]);
    expect(c.length).toBe(3);
  });

  it('should create with of', () => {
    const c = CollectionClass.of(1, 2, 3);
    expect(c.toArray()).toEqual([1, 2, 3]);
  });

  it('should filter items', () => {
    const c = CollectionClass.of(1, 2, 3, 4).filter(x => x % 2 === 0);
    expect(c.toArray()).toEqual([2, 4]);
  });

  it('should map items', () => {
    const c = CollectionClass.of(1, 2, 3).map(x => x * 2);
    expect(c.toArray()).toEqual([2, 4, 6]);
  });

  it('should reduce items', () => {
    const sum = CollectionClass.of(1, 2, 3).reduce((acc, x) => acc + x, 0);
    expect(sum).toBe(6);
  });

  it('should find item', () => {
    const found = CollectionClass.of(1, 2, 3).find(x => x > 1);
    expect(found).toBe(2);
  });

  it('should return undefined when find misses', () => {
    expect(CollectionClass.of(1, 2, 3).find(x => x > 10)).toBeUndefined();
  });

  it('should every return true when all match', () => {
    expect(CollectionClass.of(2, 4, 6).every(x => x % 2 === 0)).toBe(true);
  });

  it('should every return false when some miss', () => {
    expect(CollectionClass.of(2, 3, 6).every(x => x % 2 === 0)).toBe(false);
  });

  it('should some return true when any match', () => {
    expect(CollectionClass.of(1, 2, 3).some(x => x > 2)).toBe(true);
  });

  it('should some return false when none match', () => {
    expect(CollectionClass.of(1, 2, 3).some(x => x > 10)).toBe(false);
  });

  it('should chain filter and map', () => {
    const result = CollectionClass.of(1, 2, 3, 4)
      .filter(x => x % 2 === 0)
      .map(x => x * 10);
    expect(result.toArray()).toEqual([20, 40]);
  });

  it('should reverse items', () => {
    expect(CollectionClass.of(1, 2, 3).reverse().toArray()).toEqual([3, 2, 1]);
  });

  it('should sort items', () => {
    expect(CollectionClass.of(3, 1, 2).sort().toArray()).toEqual([1, 2, 3]);
  });

  it('should check isEmpty', () => {
    expect(CollectionClass.of<number>().isEmpty()).toBe(true);
    expect(CollectionClass.of(1).isEmpty()).toBe(false);
  });

  it('should get first and last', () => {
    const c = CollectionClass.of(10, 20, 30);
    expect(c.first()).toBe(10);
    expect(c.last()).toBe(30);
  });

  it('should distinct items', () => {
    expect(CollectionClass.of(1, 2, 2, 3, 3).distinct().toArray()).toEqual([1, 2, 3]);
  });

  it('should take and skip', () => {
    const c = CollectionClass.of(1, 2, 3, 4, 5);
    expect(c.take(2).toArray()).toEqual([1, 2]);
    expect(c.skip(3).toArray()).toEqual([4, 5]);
  });

  it('should iterate with for-of', () => {
    const items: number[] = [];
    for (const item of CollectionClass.of(1, 2, 3)) {
      items.push(item);
    }
    expect(items).toEqual([1, 2, 3]);
  });

  it('should count matching items', () => {
    expect(CollectionClass.of(1, 2, 3, 4).count(x => x % 2 === 0)).toBe(2);
  });
});
