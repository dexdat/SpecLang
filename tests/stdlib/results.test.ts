import { describe, it, expect } from 'vitest';
import { ResultClass, OptionClass } from '../../src/stdlib/results';

describe('ResultClass', () => {
  describe('construction', () => {
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

    it('should create ok result with complex type', () => {
      const r = ResultClass.ok({ a: 1, b: [2, 3] });
      expect(r.isOk()).toBe(true);
      expect(r.unwrap()).toEqual({ a: 1, b: [2, 3] });
    });

    it('should create err result with error object', () => {
      const r = ResultClass.err(new Error('something went wrong'));
      expect(r.isErr()).toBe(true);
    });
  });

  describe('isOk / isErr', () => {
    it('isOk returns true for ok', () => {
      expect(ResultClass.ok(1).isOk()).toBe(true);
    });

    it('isOk returns false for err', () => {
      expect(ResultClass.err('e').isOk()).toBe(false);
    });

    it('isErr returns true for err', () => {
      expect(ResultClass.err('e').isErr()).toBe(true);
    });

    it('isErr returns false for ok', () => {
      expect(ResultClass.ok(1).isErr()).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('should unwrap ok value', () => {
      expect(ResultClass.ok(10).unwrap()).toBe(10);
    });

    it('should throw on unwrap of err with string', () => {
      const r = ResultClass.err('bad');
      expect(() => r.unwrap()).toThrow('bad');
    });

    it('should throw on unwrap of err with Error', () => {
      const r = ResultClass.err(new Error('detailed error'));
      expect(() => r.unwrap()).toThrow('detailed error');
    });

    it('should unwrap nested ok values', () => {
      const r = ResultClass.ok(ResultClass.ok('nested'));
      expect(r.isOk()).toBe(true);
    });
  });

  describe('unwrapOr', () => {
    it('should return value on ok', () => {
      expect(ResultClass.ok(5).unwrapOr(0)).toBe(5);
    });

    it('should return default on err', () => {
      const r = ResultClass.err<number, string>('fail');
      expect(r.unwrapOr(0)).toBe(0);
    });

    it('should return correct type with objects', () => {
      const r = ResultClass.err<{ id: number }, string>('missing');
      expect(r.unwrapOr({ id: -1 })).toEqual({ id: -1 });
    });
  });

  describe('unwrapOrElse', () => {
    it('should return value on ok', () => {
      expect(ResultClass.ok(5).unwrapOrElse(e => e.length)).toBe(5);
    });

    it('should compute from error on err', () => {
      const r = ResultClass.err<number, string>('error_msg');
      expect(r.unwrapOrElse(e => e.length)).toBe(9);
    });

    it('should handle error transformation', () => {
      const r = ResultClass.err<number, Error>(new Error('BOOM'));
      expect(r.unwrapOrElse(e => e.message.length)).toBe(4);
    });
  });

  describe('map', () => {
    it('should map ok value', () => {
      const r = ResultClass.ok(3).map(x => x * 2);
      expect(r.unwrap()).toBe(6);
    });

    it('should not map err value', () => {
      const r = ResultClass.err<number, string>('e').map(x => x * 2);
      expect(r.isErr()).toBe(true);
    });

    it('should chain map calls', () => {
      const r = ResultClass.ok(2)
        .map(x => x * 3)
        .map(x => x + 1);
      expect(r.unwrap()).toBe(7);
    });

    it('should map to different type', () => {
      const r = ResultClass.ok(42).map(x => `value=${x}`);
      expect(r.unwrap()).toBe('value=42');
    });
  });

  describe('mapError', () => {
    it('should map error on err', () => {
      const r = ResultClass.err<number, string>('small').mapError(s => s.toUpperCase());
      expect(r.isErr()).toBe(true);
      expect(r.err()).toBe('SMALL');
    });

    it('should not map error on ok', () => {
      const r = ResultClass.ok(42).mapError(s => s.toUpperCase());
      expect(r.isOk()).toBe(true);
      expect(r.unwrap()).toBe(42);
    });

    it('should chain mapError', () => {
      const r = ResultClass.err<number, string>('e')
        .mapError(s => s.repeat(2))
        .mapError(s => s.length);
      expect(r.err()).toBe(2);
    });
  });

  describe('andThen', () => {
    it('should chain ok values', () => {
      const r = ResultClass.ok(5).andThen(x => ResultClass.ok(x + 1));
      expect(r.unwrap()).toBe(6);
    });

    it('should short-circuit on err', () => {
      const r = ResultClass.err<number, string>('e').andThen(x => ResultClass.ok(x + 1));
      expect(r.isErr()).toBe(true);
    });

    it('should propagate error from inner result', () => {
      const r = ResultClass.ok(5).andThen(() => ResultClass.err('inner error'));
      expect(r.isErr()).toBe(true);
      expect(r.err()).toBe('inner error');
    });

    it('should chain multiple andThen calls', () => {
      const r = ResultClass.ok(1)
        .andThen(x => ResultClass.ok(x + 2))
        .andThen(x => ResultClass.ok(x * 3));
      expect(r.unwrap()).toBe(9);
    });
  });

  describe('match', () => {
    it('should call ok handler on ok', () => {
      const val = ResultClass.ok(10).match({ ok: v => v * 2, err: () => -1 });
      expect(val).toBe(20);
    });

    it('should call err handler on err', () => {
      const val = ResultClass.err<number, string>('bad').match({ ok: v => v, err: e => e });
      expect(val).toBe('bad');
    });

    it('should return different types from match', () => {
      const okMsg = ResultClass.ok(42).match({
        ok: v => `Got ${v}`,
        err: e => `Error: ${e}`
      });
      expect(okMsg).toBe('Got 42');

      const errMsg = ResultClass.err<number, string>('fail').match({
        ok: v => `Got ${v}`,
        err: e => `Error: ${e}`
      });
      expect(errMsg).toBe('Error: fail');
    });

    it('should support side effects in match', () => {
      let sideEffect = 0;
      ResultClass.ok(5).match({
        ok: v => { sideEffect = v * 2; },
        err: () => { sideEffect = -1; }
      });
      expect(sideEffect).toBe(10);
    });
  });

  describe('fromTry', () => {
    it('should return ok when function succeeds', () => {
      const r = ResultClass.fromTry(() => 42);
      expect(r.isOk()).toBe(true);
      expect(r.unwrap()).toBe(42);
    });

    it('should return err when function throws', () => {
      const r = ResultClass.fromTry(() => { throw new Error('boom'); });
      expect(r.isErr()).toBe(true);
    });

    it('should wrap non-Error throws as Error', () => {
      const r = ResultClass.fromTry(() => { throw 'string error'; });
      expect(r.isErr()).toBe(true);
    });

    it('should capture error message from thrown Error', () => {
      const r = ResultClass.fromTry(() => { throw new Error('custom error'); });
      expect(r.err().message).toBe('custom error');
    });
  });

  describe('err getter', () => {
    it('should return error value on err', () => {
      const r = ResultClass.err('error value');
      expect(r.err()).toBe('error value');
    });

    it('should return undefined on ok', () => {
      const r = ResultClass.ok(42);
      expect(r.err()).toBeUndefined();
    });
  });
});

describe('OptionClass', () => {
  describe('construction', () => {
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

    it('should create typed none', () => {
      const o = OptionClass.none<number>();
      expect(o.isNone()).toBe(true);
    });
  });

  describe('of', () => {
    it('should create some for non-null value', () => {
      expect(OptionClass.of(42).isSome()).toBe(true);
    });

    it('should create none for null', () => {
      expect(OptionClass.of(null).isNone()).toBe(true);
    });

    it('should create none for undefined', () => {
      expect(OptionClass.of(undefined).isNone()).toBe(true);
    });

    it('should create some for 0', () => {
      expect(OptionClass.of(0).isSome()).toBe(true);
    });

    it('should create some for empty string', () => {
      expect(OptionClass.of('').isSome()).toBe(true);
    });

    it('should create some for false', () => {
      expect(OptionClass.of(false).isSome()).toBe(true);
    });

    it('should create some for empty object', () => {
      expect(OptionClass.of({}).isSome()).toBe(true);
    });
  });

  describe('isSome / isNone', () => {
    it('isSome returns true for some', () => {
      expect(OptionClass.some(1).isSome()).toBe(true);
    });

    it('isSome returns false for none', () => {
      expect(OptionClass.none().isSome()).toBe(false);
    });

    it('isNone returns true for none', () => {
      expect(OptionClass.none().isNone()).toBe(true);
    });

    it('isNone returns false for some', () => {
      expect(OptionClass.some(1).isNone()).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('should unwrap some value', () => {
      expect(OptionClass.some(10).unwrap()).toBe(10);
    });

    it('should throw on unwrap of none', () => {
      expect(() => OptionClass.none().unwrap()).toThrow('Option is None');
    });

    it('should unwrap string value', () => {
      expect(OptionClass.some('hello').unwrap()).toBe('hello');
    });

    it('should unwrap object value', () => {
      const obj = { x: 1 };
      expect(OptionClass.some(obj).unwrap()).toBe(obj);
    });
  });

  describe('unwrapOr', () => {
    it('should return value on some', () => {
      expect(OptionClass.some(5).unwrapOr(0)).toBe(5);
    });

    it('should return default on none', () => {
      expect(OptionClass.none<number>().unwrapOr(0)).toBe(0);
    });

    it('should return default on none with object', () => {
      const result = OptionClass.none<{ id: number }>().unwrapOr({ id: -1 });
      expect(result).toEqual({ id: -1 });
    });
  });

  describe('map', () => {
    it('should map some value', () => {
      expect(OptionClass.some(3).map(x => x * 2).unwrap()).toBe(6);
    });

    it('should not map none', () => {
      expect(OptionClass.none<number>().map(x => x * 2).isNone()).toBe(true);
    });

    it('should chain map calls', () => {
      const o = OptionClass.some(2)
        .map(x => x * 3)
        .map(x => x + 1);
      expect(o.unwrap()).toBe(7);
    });

    it('should map to different type', () => {
      const o = OptionClass.some(42).map(x => `num=${x}`);
      expect(o.unwrap()).toBe('num=42');
    });
  });

  describe('andThen', () => {
    it('should chain some values', () => {
      const o = OptionClass.some(5).andThen(x => OptionClass.some(x + 1));
      expect(o.unwrap()).toBe(6);
    });

    it('should short-circuit on none', () => {
      const o = OptionClass.none<number>().andThen(x => OptionClass.some(x + 1));
      expect(o.isNone()).toBe(true);
    });

    it('should return none from inner function', () => {
      const o = OptionClass.some(5).andThen(() => OptionClass.none());
      expect(o.isNone()).toBe(true);
    });

    it('should chain multiple andThen calls', () => {
      const o = OptionClass.some('hello')
        .andThen(s => OptionClass.some(s.toUpperCase()))
        .andThen(s => OptionClass.some(s + '!'));
      expect(o.unwrap()).toBe('HELLO!');
    });
  });

  describe('filter', () => {
    it('should keep some when predicate matches', () => {
      expect(OptionClass.some(5).filter(x => x > 0).isSome()).toBe(true);
    });

    it('should return none when predicate fails', () => {
      expect(OptionClass.some(-1).filter(x => x > 0).isNone()).toBe(true);
    });

    it('should return none for none', () => {
      expect(OptionClass.none<number>().filter(x => x > 0).isNone()).toBe(true);
    });

    it('should preserve value when filter passes', () => {
      const o = OptionClass.some(42).filter(x => x > 10);
      expect(o.unwrap()).toBe(42);
    });

    it('should chain filter after map', () => {
      const o = OptionClass.some(10)
        .map(x => x / 2)
        .filter(x => x > 3);
      expect(o.unwrap()).toBe(5);
    });

    it('should chain filter to none', () => {
      const o = OptionClass.some(10)
        .map(x => x / 2)
        .filter(x => x > 10);
      expect(o.isNone()).toBe(true);
    });
  });

  describe('toResult', () => {
    it('should return ok for some', () => {
      const r = OptionClass.some(10).toResult('missing');
      expect(r.isOk()).toBe(true);
      expect(r.unwrap()).toBe(10);
    });

    it('should return err for none', () => {
      const r = OptionClass.none<number>().toResult('missing');
      expect(r.isErr()).toBe(true);
      expect(r.err()).toBe('missing');
    });

    it('should support different error types', () => {
      const errorObj = { code: 404, msg: 'Not found' };
      const r = OptionClass.none<number>().toResult(errorObj);
      expect(r.err()).toEqual(errorObj);
    });
  });
});
