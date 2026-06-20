import { describe, it, expect } from 'vitest';
import { ValidatorClass } from '../../src/stdlib/validators';

describe('ValidatorClass', () => {
  describe('create', () => {
    it('should create a validator with no rules', () => {
      const v = ValidatorClass.create<string>();
      expect(v.getRuleCount()).toBe(0);
    });

    it('should create a typed validator', () => {
      const v = ValidatorClass.create<number>();
      expect(v).toBeDefined();
    });

    it('should validate any value with no rules', () => {
      const v = ValidatorClass.create();
      expect(v.validate('hello').ok).toBe(true);
      expect(v.validate(42).ok).toBe(true);
      expect(v.validate(null).ok).toBe(true);
      expect(v.validate(undefined).ok).toBe(true);
    });
  });

  describe('addRule', () => {
    it('should add a single rule', () => {
      const v = ValidatorClass.create<string>()
        .addRule(s => s.length > 0, 'Must not be empty', 'EMPTY');
      expect(v.getRuleCount()).toBe(1);
    });

    it('should chain addRule calls', () => {
      const v = ValidatorClass.create<string>()
        .addRule(s => s.length > 0, 'Required', 'REQUIRED')
        .addRule(s => s.includes('@'), 'Must have @', 'NO_AT');
      expect(v.getRuleCount()).toBe(2);
    });

    it('should chain many rules', () => {
      const v = ValidatorClass.create<number>()
        .addRule(n => n > 0, 'Positive', 'POS')
        .addRule(n => n < 100, 'Less than 100', 'MAX')
        .addRule(n => n % 2 === 0, 'Even', 'EVEN')
        .addRule(n => n !== 50, 'Not 50', 'NO_50')
        .addRule(n => Number.isInteger(n), 'Integer', 'INT');
      expect(v.getRuleCount()).toBe(5);
    });

    it('should return the same instance for chaining', () => {
      const v = ValidatorClass.create<string>();
      const result = v.addRule(s => s.length > 0, '', '');
      expect(result).toBe(v);
    });
  });

  describe('validate', () => {
    it('should pass valid value', () => {
      const v = ValidatorClass.create<string>()
        .addRule(s => s.length > 0, 'Must not be empty', 'EMPTY')
        .addRule(s => s.length < 10, 'Too long', 'TOO_LONG');
      const result = v.validate('hi');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('hi');
      }
    });

    it('should fail invalid value', () => {
      const v = ValidatorClass.create<string>()
        .addRule(s => s.length > 0, 'Must not be empty', 'EMPTY')
        .addRule(s => s.length < 3, 'Too long', 'TOO_LONG');
      const result = v.validate('hello');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.length).toBeGreaterThanOrEqual(1);
      }
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

    it('should return all failing rules', () => {
      const v = ValidatorClass.create<number>()
        .addRule(n => n > 0, 'Must be positive', 'NOT_POSITIVE')
        .addRule(n => n < 10, 'Must be less than 10', 'TOO_LARGE')
        .addRule(n => n % 2 === 0, 'Must be even', 'NOT_EVEN');
      const result = v.validate(15);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.length).toBe(2);
        expect(result.error[0].code).toBe('TOO_LARGE');
        expect(result.error[1].code).toBe('NOT_EVEN');
      }
    });

    it('should pass when all rules pass', () => {
      const v = ValidatorClass.create<number>()
        .addRule(n => n > 0, 'Positive', 'POS')
        .addRule(n => n < 100, 'Max', 'MAX')
        .addRule(n => n % 2 === 0, 'Even', 'EVEN');
      const result = v.validate(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('should provide correct error messages', () => {
      const v = ValidatorClass.create<string>()
        .addRule(s => s.length >= 3, 'Minimum 3 chars', 'MIN_LENGTH');
      const result = v.validate('ab');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error[0].message).toBe('Minimum 3 chars');
        expect(result.error[0].code).toBe('MIN_LENGTH');
      }
    });
  });

  describe('isValid', () => {
    it('should return true for valid value', () => {
      const v = ValidatorClass.create<number>()
        .addRule(n => n > 0, 'Positive', 'NOT_POS');
      expect(v.isValid(5)).toBe(true);
    });

    it('should return false for invalid value', () => {
      const v = ValidatorClass.create<number>()
        .addRule(n => n > 0, 'Positive', 'NOT_POS');
      expect(v.isValid(-1)).toBe(false);
    });

    it('should return true with no rules', () => {
      const v = ValidatorClass.create<number>();
      expect(v.isValid(42)).toBe(true);
    });

    it('should return false when any rule fails', () => {
      const v = ValidatorClass.create<string>()
        .addRule(s => s.length > 0, 'Required', 'REQ')
        .addRule(s => s.length < 5, 'Max 4', 'MAX');
      expect(v.isValid('hello')).toBe(false);
    });
  });

  describe('getRuleCount', () => {
    it('should return 0 for new validator', () => {
      const v = ValidatorClass.create();
      expect(v.getRuleCount()).toBe(0);
    });

    it('should return correct count after adding rules', () => {
      const v = ValidatorClass.create<number>()
        .addRule(n => n > 0, '', '')
        .addRule(n => n < 100, '', '');
      expect(v.getRuleCount()).toBe(2);
    });

    it('should not change after validation', () => {
      const v = ValidatorClass.create<number>()
        .addRule(n => n > 0, 'Positive', 'POS');
      v.validate(5);
      expect(v.getRuleCount()).toBe(1);
      v.validate(-1);
      expect(v.getRuleCount()).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should validate complex objects', () => {
      type User = { name: string; age: number };
      const v = ValidatorClass.create<User>()
        .addRule(u => u.name.length > 0, 'Name required', 'NAME_REQ')
        .addRule(u => u.age >= 0, 'Age must be non-negative', 'AGE_NEG')
        .addRule(u => u.age < 150, 'Age must be realistic', 'AGE_MAX');

      const validUser = { name: 'Alice', age: 30 };
      expect(v.isValid(validUser)).toBe(true);

      const invalidUser = { name: '', age: -5 };
      expect(v.isValid(invalidUser)).toBe(false);

      const result = v.validate(invalidUser);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.length).toBe(2);
      }
    });

    it('should work with boolean values', () => {
      const v = ValidatorClass.create<boolean>()
        .addRule(b => b === true, 'Must be true', 'NOT_TRUE');
      expect(v.isValid(true)).toBe(true);
      expect(v.isValid(false)).toBe(false);
    });

    it('should work with array values', () => {
      const v = ValidatorClass.create<number[]>()
        .addRule(arr => arr.length > 0, 'Array not empty', 'EMPTY')
        .addRule(arr => arr.every(n => n > 0), 'All positive', 'NEGATIVE');
      expect(v.isValid([1, 2, 3])).toBe(true);
      expect(v.isValid([])).toBe(false);
      expect(v.isValid([1, -1])).toBe(false);
    });

    it('should work with null values', () => {
      const v = ValidatorClass.create<null>()
        .addRule(n => n === null, 'Must be null', 'NOT_NULL');
      expect(v.isValid(null)).toBe(true);
    });

    it('should handle many rules without performance issue', () => {
      let v = ValidatorClass.create<number>();
      for (let i = 0; i < 100; i++) {
        const j = i;
        v = v.addRule(n => n !== j, `Not ${j}`, `NO_${j}`);
      }
      expect(v.getRuleCount()).toBe(100);
      expect(v.isValid(100)).toBe(true);
      expect(v.isValid(50)).toBe(false);
    });
  });
});
