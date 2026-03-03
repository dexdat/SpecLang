import { Result } from './results';
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
export declare function createValidator<T>(name: string, predicate: (value: unknown) => value is T, transform?: (value: unknown) => T): SchemaValidator<T>;
/**
 * Validate string
 */
export declare const validateString: SchemaValidator<string>;
/**
 * Validate number
 */
export declare const validateNumber: SchemaValidator<number>;
/**
 * Validate boolean
 */
export declare const validateBoolean: SchemaValidator<boolean>;
/**
 * Validate array
 */
export declare const validateArray: SchemaValidator<unknown[]>;
/**
 * Validate object
 */
export declare const validateObject: SchemaValidator<Record<string, unknown>>;
/**
 * Validate null
 */
export declare const validateNull: SchemaValidator<null>;
/**
 * Validate undefined
 */
export declare const validateUndefined: SchemaValidator<undefined>;
/**
 * Validate function
 */
export declare const validateFunction: SchemaValidator<Function>;
/**
 * Validate UUID
 */
export declare const validateUUID: SchemaValidator<string>;
/**
 * Validate Email
 */
export declare const validateEmail: SchemaValidator<string>;
/**
 * Validate URL
 */
export declare const validateURL: SchemaValidator<string>;
/**
 * Validate DateTime
 */
export declare const validateDateTime: SchemaValidator<string>;
/**
 * Validate with custom rules
 */
export declare function validate<T>(value: unknown, rules: Array<{
    validate: (v: unknown) => boolean;
    message: string;
    code: string;
}>): ValidationResult<T>;
/**
 * Validate object properties
 */
export declare function validateProperties<T extends Record<string, unknown>>(value: T, schema: Record<keyof T, Validator<unknown>>): ValidationResult<T>;
/**
 * Validate array items
 */
export declare function validateArrayItems<T>(value: unknown[], itemValidator: Validator<T>): ValidationResult<T[]>;
/**
 * Validate one of options
 */
export declare function validateOneOf<T>(value: unknown, options: T[]): ValidationResult<T>;
/**
 * Validate string length
 */
export declare function validateStringLength(min?: number, max?: number): Validator<string>;
/**
 * Validate number range
 */
export declare function validateNumberRange(min?: number, max?: number): Validator<number>;
/**
 * Validate pattern (regex)
 */
export declare function validatePattern(pattern: RegExp, message?: string): Validator<string>;
//# sourceMappingURL=validators.d.ts.map