// SPECLANG-GENERATED
// Source: @speclang/stdlib/types
// DO NOT EDIT MANUALLY

/**
 * Standard Library Types Tests
 */

import { describe, it, expect } from 'vitest';
import {
  SpecRef,
  Layer,
  MaturityLevel,
  AgentRole,
  Version,
  isType,
  assertTypeMatch,
  typeOf,
  TypeName,
  Primitives,
  ListOps,
  Map,
  SetOps,
  Results,
  Options
} from '../../src/stdlib';

describe('Standard Library Types', () => {
  describe('SpecRef', () => {
    it('should be a branded string', () => {
      const ref: SpecRef = '@specs/auth#login' as SpecRef;
      expect(typeof ref).toBe('string');
    });
  });

  describe('Layer', () => {
    it('should accept values 0-10', () => {
      const layer: Layer = 5;
      expect(layer).toBe(5);
    });
  });

  describe('MaturityLevel', () => {
    it('should accept valid maturity levels', () => {
      const level: MaturityLevel = 'Alpha';
      expect(level).toBe('Alpha');
    });
  });

  describe('AgentRole', () => {
    it('should accept valid agent roles', () => {
      const role: AgentRole = 'SpecWriter';
      expect(role).toBe('SpecWriter');
    });
  });

  describe('Version', () => {
    it('should parse semantic versions', () => {
      const version = Version.parse('1.2.3');
      expect(version).toBe('1.2.3');
    });
  });

  describe('Type utilities', () => {
    it('isType should validate primitives', () => {
      expect(isType('hello', Primitives.String)).toBe(true);
      expect(isType(42, Primitives.Number)).toBe(true);
    });

    it('assertTypeMatch should throw on invalid', () => {
      expect(() => assertTypeMatch('hello', Primitives.String)).not.toThrow();
      expect(() => assertTypeMatch(42, Primitives.String)).toThrow();
    });

    it('typeOf should return type names', () => {
      expect(typeOf('hello')).toBe('string');
      expect(typeOf(null)).toBe('null');
      expect(typeOf([])).toBe('array');
    });
  });

  describe('Composite types', () => {
    it('ListOps should work', () => {
      const listValidator = ListOps.of(Primitives.Number);
      expect(listValidator.validate([1, 2, 3])).toBe(true);
    });

    it('Map should work', () => {
      const mapValidator = Map.of(Primitives.String);
      expect(mapValidator.validate({ key: 'value' })).toBe(true);
    });

    it('SetOps should work', () => {
      const set = [1, 2, 3];
      expect(SetOps.has(set, 2)).toBe(true);
    });
  });

  describe('Result types', () => {
    it('Results.success should create success', () => {
      const result = Results.success(42);
      expect(Results.isOk(result)).toBe(true);
    });

    it('Options.some should create some', () => {
      const option = Options.some(42);
      expect(Options.isSome(option)).toBe(true);
    });
  });
});