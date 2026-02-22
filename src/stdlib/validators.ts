// SPECLANG-GENERATED
// Source: @speclang/stdlib
// DO NOT EDIT MANUALLY

/**
 * Validation helpers and utilities
 */

import { Primitives } from './primitives';
import { isString, isNumber, isBoolean, isArray, isObject, isNull, isUndefined, isFunction } from './primitives';
import { Result, Results } from './results';

/**
 * Validation result type
 */
export type ValidationResult<T = void> = Result<T, ValidationError>;

/**
 * Validation error
 */
export type ValidationError = {
  field?: string;
  message: string;
  code: string;
};

/**
 * Validator function type
 */
export type Validator<T> = (value: unknown) => ValidationResult<T>;

/**
 * Schema validator interface
 */
export interface SchemaValidator<T> {
  validate: (value: unknown) => ValidationResult<T>;
  parse: (value: unknown) => T;
  isValid: (value: unknown) => boolean;
}

/**
 * Create a validator from a type predicate
 */
export function createValidator<T>(
  name: string,
  predicate: (value: unknown) => value is T,
  transform?: (value: unknown) => T
): SchemaValidator<T> {
  return {
    validate: (value: unknown): ValidationResult<T> => {
      if (!predicate(value)) {
        return Results.failure({
          message: `Invalid ${name}`,
          code: `INVALID_${name.toUpperCase()}`
        });
      }
      const result = transform ? transform(value) : value as T;
      return Results.success(result);
    },
    parse: (value: unknown): T => {
      const result = Results.fromTry(() => {
        if (!predicate(value)) {
          throw new Error(`Invalid ${name}`);
        }
        return transform ? transform(value) : value as T;
      });
      return Results.unwrap(result);
    },
    isValid: (value: unknown): boolean => predicate(value)
  };
}

/**
 * Validate string
 */
export const validateString = createValidator<string>('string', isString);

/**
 * Validate number
 */
export const validateNumber = createValidator<number>('number', isNumber);

/**
 * Validate boolean
 */
export const validateBoolean = createValidator<boolean>('boolean', isBoolean);

/**
 * Validate array
 */
export const validateArray = createValidator<unknown[]>('array', isArray);

/**
 * Validate object
 */
export const validateObject = createValidator<Record<string, unknown>>('object', isObject);

/**
 * Validate null
 */
export const validateNull = createValidator<null>('null', isNull);

/**
 * Validate undefined
 */
export const validateUndefined = createValidator<undefined>('undefined', isUndefined);

/**
 * Validate function
 */
export const validateFunction = createValidator<Function>('function', isFunction);

/**
 * Validate UUID
 */
export const validateUUID = createValidator<string>(
  'UUID',
  (value: unknown): value is string => Primitives.UUID.validate(value)
);

/**
 * Validate Email
 */
export const validateEmail = createValidator<string>(
  'Email',
  (value: unknown): value is string => Primitives.Email.validate(value)
);

/**
 * Validate URL
 */
export const validateURL = createValidator<string>(
  'URL',
  (value: unknown): value is string => Primitives.URL.validate(value)
);

/**
 * Validate DateTime
 */
export const validateDateTime = createValidator<string>(
  'DateTime',
  (value: unknown): value is string => Primitives.DateTime.validate(value)
);

/**
 * Validate with custom rules
 */
export function validate<T>(
  value: unknown,
  rules: Array<{ validate: (v: unknown) => boolean; message: string; code: string }>
): ValidationResult<T> {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return Results.failure({
        message: rule.message,
        code: rule.code
      });
    }
  }
  return Results.success(value as T);
}

/**
 * Validate object properties
 */
export function validateProperties<T extends Record<string, unknown>>(
  value: T,
  schema: Record<keyof T, Validator<unknown>>
): ValidationResult<T> {
  const errors: ValidationError[] = [];
  
  for (const key of Object.keys(schema) as (keyof T)[]) {
    const validator = schema[key];
    const result = validator(value[key]);
    
    if (Results.isError(result)) {
      errors.push({
        field: key as string,
        message: result.error.message,
        code: result.error.code
      });
    }
  }
  
  if (errors.length > 0) {
    return Results.failure({
      message: `Validation failed: ${errors.map(e => e.message).join(', ')}`,
      code: 'VALIDATION_FAILED'
    });
  }
  
  return Results.success(value);
}

/**
 * Validate array items
 */
export function validateArrayItems<T>(
  value: unknown[],
  itemValidator: Validator<T>
): ValidationResult<T[]> {
  const errors: ValidationError[] = [];
  
  for (let i = 0; i < value.length; i++) {
    const result = itemValidator(value[i]);
    
    if (Results.isError(result)) {
      errors.push({
        field: `[${i}]`,
        message: result.error.message,
        code: result.error.code
      });
    }
  }
  
  if (errors.length > 0) {
    return Results.failure({
      message: `Array validation failed: ${errors.map(e => e.message).join(', ')}`,
      code: 'ARRAY_VALIDATION_FAILED'
    });
  }
  
  return Results.success(value as T[]);
}

/**
 * Validate one of options
 */
export function validateOneOf<T>(value: unknown, options: T[]): ValidationResult<T> {
  if (!options.includes(value as T)) {
    return Results.failure({
      message: `Value must be one of: ${options.join(', ')}`,
      code: 'INVALID_OPTION'
    });
  }
  return Results.success(value as T);
}

/**
 * Validate string length
 */
export function validateStringLength(
  min?: number,
  max?: number
): Validator<string> {
  return (value: unknown): ValidationResult<string> => {
    if (!isString(value)) {
      return Results.failure({ message: 'Value must be a string', code: 'NOT_STRING' });
    }
    
    if (min !== undefined && value.length < min) {
      return Results.failure({
        message: `String must be at least ${min} characters`,
        code: 'STRING_TOO_SHORT'
      });
    }
    
    if (max !== undefined && value.length > max) {
      return Results.failure({
        message: `String must be at most ${max} characters`,
        code: 'STRING_TOO_LONG'
      });
    }
    
    return Results.success(value);
  };
}

/**
 * Validate number range
 */
export function validateNumberRange(
  min?: number,
  max?: number
): Validator<number> {
  return (value: unknown): ValidationResult<number> => {
    if (!isNumber(value)) {
      return Results.failure({ message: 'Value must be a number', code: 'NOT_NUMBER' });
    }
    
    if (min !== undefined && value < min) {
      return Results.failure({
        message: `Number must be at least ${min}`,
        code: 'NUMBER_TOO_SMALL'
      });
    }
    
    if (max !== undefined && value > max) {
      return Results.failure({
        message: `Number must be at most ${max}`,
        code: 'NUMBER_TOO_LARGE'
      });
    }
    
    return Results.success(value);
  };
}

/**
 * Validate pattern (regex)
 */
export function validatePattern(pattern: RegExp, message?: string): Validator<string> {
  return (value: unknown): ValidationResult<string> => {
    if (!isString(value)) {
      return Results.failure({ message: 'Value must be a string', code: 'NOT_STRING' });
    }
    
    if (!pattern.test(value)) {
      return Results.failure({
        message: message || `String does not match pattern ${pattern}`,
        code: 'PATTERN_MISMATCH'
      });
    }
    
    return Results.success(value);
  };
}
