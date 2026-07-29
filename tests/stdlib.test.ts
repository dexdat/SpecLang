// SPECLANG-GENERATED
// Source: @speclang/stdlib
// DO NOT EDIT MANUALLY

/**
 * Standard Library Tests
 */

import { describe, it, expect } from "vitest";

// Import all stdlib modules
import {
  Primitives,
  UUID,
  DateTime,
  Email,
  URL,
  Path,
  isString,
  isNumber,
  isBoolean,
  isNull,
  isUndefined,
  isFunction,
  isObject,
  isArray,
  ListOps,
  Map,
  SetOps,
  OptionalOps,
  Results,
  Options,
  identity,
  compose,
  pipe,
  curry,
  assert,
  assertEquals,
  assertTrue,
  assertFalse,
  assertNull,
  assertNotNull,
  assertUndefined,
  assertDefined,
  validateString,
  validateNumber,
  validateUUID,
  validateEmail,
  validateURL,
  validateDateTime,
  validateOneOf,
  validateStringLength,
  validateNumberRange,
  TypeMappings,
  mapType,
} from "../src/stdlib";

describe("Primitives", () => {
  describe("String", () => {
    it("should validate strings", () => {
      expect(Primitives.String.validate("hello")).toBe(true);
      expect(Primitives.String.validate(123)).toBe(false);
      expect(Primitives.String.validate("")).toBe(true);
    });

    it("should have correct default", () => {
      expect(Primitives.String.default).toBe("");
    });
  });

  describe("Number", () => {
    it("should validate numbers", () => {
      expect(Primitives.Number.validate(42)).toBe(true);
      expect(Primitives.Number.validate(3.14)).toBe(true);
      expect(Primitives.Number.validate(NaN)).toBe(false);
      expect(Primitives.Number.validate("42")).toBe(false);
    });

    it("should have correct default", () => {
      expect(Primitives.Number.default).toBe(0);
    });
  });

  describe("Boolean", () => {
    it("should validate booleans", () => {
      expect(Primitives.Boolean.validate(true)).toBe(true);
      expect(Primitives.Boolean.validate(false)).toBe(true);
      expect(Primitives.Boolean.validate(1)).toBe(false);
    });

    it("should have correct default", () => {
      expect(Primitives.Boolean.default).toBe(false);
    });
  });

  describe("UUID", () => {
    it("should validate UUIDs", () => {
      expect(
        Primitives.UUID.validate("550e8400-e29b-41d4-a716-446655440000"),
      ).toBe(true);
      expect(Primitives.UUID.validate("not-a-uuid")).toBe(false);
    });

    it("should generate valid UUIDs", () => {
      const uuid = Primitives.UUID.generate();
      expect(Primitives.UUID.validate(uuid)).toBe(true);
    });
  });

  describe("DateTime", () => {
    it("should validate DateTime strings", () => {
      expect(Primitives.DateTime.validate("2024-01-15T10:30:00.000Z")).toBe(
        true,
      );
      expect(Primitives.DateTime.validate("2024-01-15")).toBe(true);
      expect(Primitives.DateTime.validate("not-a-date")).toBe(false);
    });

    it("should generate current DateTime", () => {
      const now = Primitives.DateTime.now();
      expect(Primitives.DateTime.validate(now)).toBe(true);
    });

    it("should parse DateTime strings", () => {
      expect(Primitives.DateTime.parse("2024-01-15T10:30:00.000Z")).toBe(
        "2024-01-15T10:30:00.000Z",
      );
      expect(Primitives.DateTime.parse("invalid")).toBeNull();
    });
  });

  describe("Email", () => {
    it("should validate emails", () => {
      expect(Primitives.Email.validate("user@example.com")).toBe(true);
      expect(Primitives.Email.validate("test@domain.org")).toBe(true);
      expect(Primitives.Email.validate("not-an-email")).toBe(false);
      expect(Primitives.Email.validate("missing@domain")).toBe(false);
    });
  });

  describe("URL", () => {
    it("should validate URLs", () => {
      expect(Primitives.URL.validate("https://example.com")).toBe(true);
      expect(Primitives.URL.validate("http://localhost:3000")).toBe(true);
      expect(Primitives.URL.validate("not-a-url")).toBe(false);
    });
  });
});

describe("Type Predicates", () => {
  it("should detect strings", () => {
    expect(isString("hello")).toBe(true);
    expect(isString(123)).toBe(false);
  });

  it("should detect numbers", () => {
    expect(isNumber(42)).toBe(true);
    expect(isNumber("42")).toBe(false);
  });

  it("should detect booleans", () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(1)).toBe(false);
  });

  it("should detect null", () => {
    expect(isNull(null)).toBe(true);
    expect(isNull(undefined)).toBe(false);
  });

  it("should detect undefined", () => {
    expect(isUndefined(undefined)).toBe(true);
    expect(isUndefined(null)).toBe(false);
  });

  it("should detect functions", () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction("function")).toBe(false);
  });

  it("should detect objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
  });

  it("should detect arrays", () => {
    expect(isArray([])).toBe(true);
    expect(isArray({})).toBe(false);
  });
});

describe("ListOps", () => {
  const numbers = [1, 2, 3, 4, 5];

  it("should map values", () => {
    const doubled = ListOps.map(numbers, (n) => n * 2);
    expect(doubled).toEqual([2, 4, 6, 8, 10]);
  });

  it("should filter values", () => {
    const evens = ListOps.filter(numbers, (n) => n % 2 === 0);
    expect(evens).toEqual([2, 4]);
  });

  it("should reduce values", () => {
    const sum = ListOps.reduce(numbers, (acc, n) => acc + n, 0);
    expect(sum).toBe(15);
  });

  it("should find values", () => {
    const found = ListOps.find(numbers, (n) => n > 3);
    expect(found).toBe(4);
  });

  it("should check some values", () => {
    expect(ListOps.some(numbers, (n) => n > 4)).toBe(true);
    expect(ListOps.some(numbers, (n) => n > 10)).toBe(false);
  });

  it("should check every value", () => {
    expect(ListOps.every(numbers, (n) => n > 0)).toBe(true);
    expect(ListOps.every(numbers, (n) => n > 3)).toBe(false);
  });

  it("should get first/last", () => {
    expect(ListOps.first(numbers)).toBe(1);
    expect(ListOps.last(numbers)).toBe(5);
  });

  it("should check length/isEmpty", () => {
    expect(ListOps.length(numbers)).toBe(5);
    expect(ListOps.isEmpty(numbers)).toBe(false);
    expect(ListOps.isEmpty([])).toBe(true);
  });

  it("should push items", () => {
    const result = ListOps.push(numbers, 6);
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    expect(numbers).toEqual([1, 2, 3, 4, 5]); // Original unchanged
  });
});

describe("Map", () => {
  const obj = { a: 1, b: 2, c: 3 };

  it("should get values", () => {
    expect(Map.get(obj, "a")).toBe(1);
    expect(Map.get(obj, "z")).toBeUndefined();
  });

  it("should set values", () => {
    const result = Map.set(obj, "d", 4);
    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    expect(obj).toEqual({ a: 1, b: 2, c: 3 }); // Original unchanged
  });

  it("should check key existence", () => {
    expect(Map.has(obj, "a")).toBe(true);
    expect(Map.has(obj, "z")).toBe(false);
  });

  it("should get keys/values/entries", () => {
    expect(Map.keys(obj)).toEqual(["a", "b", "c"]);
    expect(Map.values(obj)).toEqual([1, 2, 3]);
    expect(Map.entries(obj)).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });

  it("should get size", () => {
    expect(Map.size(obj)).toBe(3);
  });

  it("should delete keys", () => {
    const result = Map.delete(obj, "b");
    expect(result).toEqual({ a: 1, c: 3 });
  });
});

describe("SetOps", () => {
  const set = [1, 2, 3];

  it("should add items", () => {
    expect(SetOps.add(set, 4)).toEqual([1, 2, 3, 4]);
    expect(SetOps.add(set, 2)).toEqual([1, 2, 3]); // No duplicates
  });

  it("should check has", () => {
    expect(SetOps.has(set, 2)).toBe(true);
    expect(SetOps.has(set, 5)).toBe(false);
  });

  it("should delete items", () => {
    expect(SetOps.delete(set, 2)).toEqual([1, 3]);
  });

  it("should union sets", () => {
    expect(SetOps.union([1, 2], [2, 3])).toEqual([1, 2, 3]);
  });

  it("should intersect sets", () => {
    expect(SetOps.intersect([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
  });

  it("should diff sets", () => {
    expect(SetOps.diff([1, 2, 3], [2])).toEqual([1, 3]);
  });
});

describe("OptionalOps", () => {
  it("should wrap values", () => {
    expect(OptionalOps.of(42)).toBe(42);
    expect(OptionalOps.of(null)).toBeNull();
    expect(OptionalOps.of(undefined)).toBeNull();
  });

  it("should check isSome/isNone", () => {
    expect(OptionalOps.isSome(42)).toBe(true);
    expect(OptionalOps.isNone(42)).toBe(false);
    expect(OptionalOps.isSome(null)).toBe(false);
    expect(OptionalOps.isNone(null)).toBe(true);
  });

  it("should map values", () => {
    const value: number | null = 42;
    const result = OptionalOps.map(value, (n) => n * 2);
    expect(result).toBe(84);
    expect(OptionalOps.map(null, (n: number) => n * 2)).toBeNull();
  });

  it("should provide orElse", () => {
    expect(OptionalOps.orElse(42, 0)).toBe(42);
    expect(OptionalOps.orElse(null, 0)).toBe(0);
  });

  it("should provide orElseGet", () => {
    expect(OptionalOps.orElseGet(42, () => 0)).toBe(42);
    expect(OptionalOps.orElseGet(null, () => 0)).toBe(0);
  });
});

describe("Results", () => {
  it("should create success", () => {
    const result = Results.success(42);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(42);
  });

  it("should create failure", () => {
    const error = new Error("test error");
    const result = Results.failure(error);
    expect(result.ok).toBe(false);
    expect(result.error).toBe(error);
  });

  it("should check isOk/isError", () => {
    const ok = Results.success(42);
    const err = Results.failure(new Error("test"));

    expect(Results.isOk(ok)).toBe(true);
    expect(Results.isError(ok)).toBe(false);
    expect(Results.isOk(err)).toBe(false);
    expect(Results.isError(err)).toBe(true);
  });

  it("should map values", () => {
    const successResult = Results.success(2);
    const result = Results.map(successResult, (n) => n * 3);
    if (Results.isOk(result)) {
      expect(result.value).toBe(6);
    }
  });

  it("should map errors", () => {
    const original = Results.failure<string>("error1");
    const result = Results.mapError(original, (e) => `new: ${e}`);
    if (Results.isError(result)) {
      expect(result.error).toBe("new: error1");
    }
  });

  it("should unwrap or return default", () => {
    expect(Results.unwrapOr(Results.success(42), 0)).toBe(42);
    expect(Results.unwrapOr(Results.failure(new Error("err")), 0)).toBe(0);
  });

  it("should handle fromTry", () => {
    const ok = Results.fromTry(() => 42);
    expect(Results.isOk(ok)).toBe(true);

    const err = Results.fromTry(() => {
      throw new Error("fail");
    });
    expect(Results.isError(err)).toBe(true);
  });
});

describe("Options", () => {
  it("should create some/none", () => {
    const some = Options.some(42);
    const none = Options.none();

    expect(Options.isSome(some)).toBe(true);
    expect(Options.isNone(none)).toBe(true);
  });

  it("should wrap values", () => {
    expect(Options.isSome(Options.of(42))).toBe(true);
    expect(Options.isNone(Options.of(null))).toBe(true);
    expect(Options.isNone(Options.of(undefined))).toBe(true);
  });

  it("should unwrap or return default", () => {
    expect(Options.unwrapOr(Options.some(42), 0)).toBe(42);
    expect(Options.unwrapOr(Options.none(), 0)).toBe(0);
  });
});

describe("Functional Utilities", () => {
  describe("identity", () => {
    it("should return input unchanged", () => {
      expect(identity(42)).toBe(42);
      expect(identity("hello")).toBe("hello");
    });
  });

  describe("compose", () => {
    it("should compose functions", () => {
      const add1 = (n: number) => n + 1;
      const double = (n: number) => n * 2;

      const fn = compose(double, add1);
      expect(fn(5)).toBe(12); // (5 + 1) * 2 = 12
    });
  });

  describe("pipe", () => {
    it("should pipe operations left to right", () => {
      const result = pipe(
        5,
        (n: number) => n + 1,
        (n: number) => n * 2,
        (n: number) => n - 1,
      );
      expect(result).toBe(11); // ((5 + 1) * 2) - 1 = 11
    });
  });

  describe("curry", () => {
    it("should curry functions", () => {
      const add = (a: number, b: number, c: number) => a + b + c;
      const curried = curry(add);

      expect(curried(1)(2)(3)).toBe(6);
    });
  });
});

describe("Assertions", () => {
  describe("assert", () => {
    it("should not throw for true", () => {
      expect(() => assert(true)).not.toThrow();
    });

    it("should throw for false", () => {
      expect(() => assert(false)).toThrow();
      expect(() => assert(false, "custom message")).toThrow("custom message");
    });
  });

  describe("assertEquals", () => {
    it("should not throw for equal values", () => {
      expect(() => assertEquals(42, 42)).not.toThrow();
      expect(() => assertEquals("hello", "hello")).not.toThrow();
    });

    it("should throw for unequal values", () => {
      expect(() => assertEquals(1, 2)).toThrow();
    });
  });

  describe("assertTrue/assertFalse", () => {
    it("should validate truthy/falsy", () => {
      expect(() => assertTrue(1)).not.toThrow();
      expect(() => assertTrue(0)).toThrow();
      expect(() => assertFalse(0)).not.toThrow();
      expect(() => assertFalse(1)).toThrow();
    });
  });

  describe("assertNull/assertNotNull", () => {
    it("should check null values", () => {
      expect(() => assertNull(null)).not.toThrow();
      expect(() => assertNull(42)).toThrow();

      expect(() => assertNotNull(42)).not.toThrow();
      expect(() => assertNotNull(null)).toThrow();
    });
  });

  describe("assertUndefined/assertDefined", () => {
    it("should check undefined values", () => {
      expect(() => assertUndefined(undefined)).not.toThrow();
      expect(() => assertUndefined(42)).toThrow();

      expect(() => assertDefined(42)).not.toThrow();
      expect(() => assertDefined(undefined)).toThrow();
    });
  });
});

describe("Validators", () => {
  describe("validateString", () => {
    it("should validate strings", () => {
      expect(validateString.isValid("hello")).toBe(true);
      expect(validateString.isValid(123)).toBe(false);
    });

    it("should parse strings", () => {
      expect(validateString.parse("hello")).toBe("hello");
    });
  });

  describe("validateNumber", () => {
    it("should validate numbers", () => {
      expect(validateNumber.isValid(42)).toBe(true);
      expect(validateNumber.isValid("42")).toBe(false);
    });
  });

  describe("validateUUID", () => {
    it("should validate UUIDs", () => {
      expect(validateUUID.isValid("550e8400-e29b-41d4-a716-446655440000")).toBe(
        true,
      );
      expect(validateUUID.isValid("invalid")).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("should validate emails", () => {
      expect(validateEmail.isValid("user@example.com")).toBe(true);
      expect(validateEmail.isValid("invalid")).toBe(false);
    });
  });

  describe("validateURL", () => {
    it("should validate URLs", () => {
      expect(validateURL.isValid("https://example.com")).toBe(true);
      expect(validateURL.isValid("invalid")).toBe(false);
    });
  });

  describe("validateDateTime", () => {
    it("should validate DateTime", () => {
      expect(validateDateTime.isValid("2024-01-15T10:30:00.000Z")).toBe(true);
      expect(validateDateTime.isValid("invalid")).toBe(false);
    });
  });

  describe("validateOneOf", () => {
    it("should validate options", () => {
      expect(Results.isOk(validateOneOf("a", ["a", "b", "c"]))).toBe(true);
      expect(Results.isOk(validateOneOf("d", ["a", "b", "c"]))).toBe(false);
    });
  });

  describe("validateStringLength", () => {
    it("should validate string length", () => {
      const validator = validateStringLength(3, 10);

      expect(Results.isOk(validator("abc"))).toBe(true);
      expect(Results.isOk(validator("ab"))).toBe(false);
      expect(Results.isOk(validator("abcdefghijk"))).toBe(false);
    });
  });

  describe("validateNumberRange", () => {
    it("should validate number range", () => {
      const validator = validateNumberRange(0, 100);

      expect(Results.isOk(validator(50))).toBe(true);
      expect(Results.isOk(validator(-1))).toBe(false);
      expect(Results.isOk(validator(101))).toBe(false);
    });
  });
});

describe("Type Mappings", () => {
  it("should map string to all languages", () => {
    expect(mapType("string", "typescript")).toBe("string");
    expect(mapType("string", "python")).toBe("str");
    expect(mapType("string", "go")).toBe("string");
    expect(mapType("string", "rust")).toBe("String");
    expect(mapType("string", "java")).toBe("String");
  });

  it("should map number to all languages", () => {
    expect(mapType("number", "typescript")).toBe("number");
    expect(mapType("number", "python")).toBe("int | float");
  });

  it("should map boolean to all languages", () => {
    expect(mapType("boolean", "typescript")).toBe("boolean");
    expect(mapType("boolean", "python")).toBe("bool");
    expect(mapType("boolean", "go")).toBe("bool");
  });

  it("should map List to all languages", () => {
    expect(mapType("List", "typescript")).toBe("T[]");
    expect(mapType("List", "python")).toBe("List[T]");
    expect(mapType("List", "go")).toBe("[]T");
    expect(mapType("List", "rust")).toBe("Vec<T>");
  });

  it("should map Result to all languages", () => {
    expect(mapType("Result", "typescript")).toBe("Result<T, E>");
    expect(mapType("Result", "python")).toBe("Result[T, E]");
  });

  it("should have all primitive types", () => {
    expect(TypeMappings.string).toBeDefined();
    expect(TypeMappings.number).toBeDefined();
    expect(TypeMappings.boolean).toBeDefined();
    expect(TypeMappings.null).toBeDefined();
  });
});
