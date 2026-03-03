"use strict";
// SPECLANG-GENERATED
// Source: @speclang/stdlib
// DO NOT EDIT MANUALLY
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDateTime = exports.validateURL = exports.validateEmail = exports.validateUUID = exports.validateFunction = exports.validateUndefined = exports.validateNull = exports.validateObject = exports.validateArray = exports.validateBoolean = exports.validateNumber = exports.validateString = void 0;
exports.createValidator = createValidator;
exports.validate = validate;
exports.validateProperties = validateProperties;
exports.validateArrayItems = validateArrayItems;
exports.validateOneOf = validateOneOf;
exports.validateStringLength = validateStringLength;
exports.validateNumberRange = validateNumberRange;
exports.validatePattern = validatePattern;
/**
 * Validation helpers and utilities
 */
const primitives_1 = require("./primitives");
const primitives_2 = require("./primitives");
const results_1 = require("./results");
/**
 * Create a validator from a type predicate
 */
function createValidator(name, predicate, transform) {
    return {
        validate: (value) => {
            if (!predicate(value)) {
                return results_1.Results.failure({
                    message: `Invalid ${name}`,
                    code: `INVALID_${name.toUpperCase()}`
                });
            }
            const result = transform ? transform(value) : value;
            return results_1.Results.success(result);
        },
        parse: (value) => {
            const result = results_1.Results.fromTry(() => {
                if (!predicate(value)) {
                    throw new Error(`Invalid ${name}`);
                }
                return transform ? transform(value) : value;
            });
            return results_1.Results.unwrap(result);
        },
        isValid: (value) => predicate(value)
    };
}
/**
 * Validate string
 */
exports.validateString = createValidator('string', primitives_2.isString);
/**
 * Validate number
 */
exports.validateNumber = createValidator('number', primitives_2.isNumber);
/**
 * Validate boolean
 */
exports.validateBoolean = createValidator('boolean', primitives_2.isBoolean);
/**
 * Validate array
 */
exports.validateArray = createValidator('array', primitives_2.isArray);
/**
 * Validate object
 */
exports.validateObject = createValidator('object', primitives_2.isObject);
/**
 * Validate null
 */
exports.validateNull = createValidator('null', primitives_2.isNull);
/**
 * Validate undefined
 */
exports.validateUndefined = createValidator('undefined', primitives_2.isUndefined);
/**
 * Validate function
 */
exports.validateFunction = createValidator('function', primitives_2.isFunction);
/**
 * Validate UUID
 */
exports.validateUUID = createValidator('UUID', (value) => primitives_1.Primitives.UUID.validate(value));
/**
 * Validate Email
 */
exports.validateEmail = createValidator('Email', (value) => primitives_1.Primitives.Email.validate(value));
/**
 * Validate URL
 */
exports.validateURL = createValidator('URL', (value) => primitives_1.Primitives.URL.validate(value));
/**
 * Validate DateTime
 */
exports.validateDateTime = createValidator('DateTime', (value) => primitives_1.Primitives.DateTime.validate(value));
/**
 * Validate with custom rules
 */
function validate(value, rules) {
    for (const rule of rules) {
        if (!rule.validate(value)) {
            return results_1.Results.failure({
                message: rule.message,
                code: rule.code
            });
        }
    }
    return results_1.Results.success(value);
}
/**
 * Validate object properties
 */
function validateProperties(value, schema) {
    const errors = [];
    for (const key of Object.keys(schema)) {
        const validator = schema[key];
        const result = validator(value[key]);
        if (results_1.Results.isError(result)) {
            errors.push({
                field: key,
                message: result.error.message,
                code: result.error.code
            });
        }
    }
    if (errors.length > 0) {
        return results_1.Results.failure({
            message: `Validation failed: ${errors.map(e => e.message).join(', ')}`,
            code: 'VALIDATION_FAILED'
        });
    }
    return results_1.Results.success(value);
}
/**
 * Validate array items
 */
function validateArrayItems(value, itemValidator) {
    const errors = [];
    for (let i = 0; i < value.length; i++) {
        const result = itemValidator(value[i]);
        if (results_1.Results.isError(result)) {
            errors.push({
                field: `[${i}]`,
                message: result.error.message,
                code: result.error.code
            });
        }
    }
    if (errors.length > 0) {
        return results_1.Results.failure({
            message: `Array validation failed: ${errors.map(e => e.message).join(', ')}`,
            code: 'ARRAY_VALIDATION_FAILED'
        });
    }
    return results_1.Results.success(value);
}
/**
 * Validate one of options
 */
function validateOneOf(value, options) {
    if (!options.includes(value)) {
        return results_1.Results.failure({
            message: `Value must be one of: ${options.join(', ')}`,
            code: 'INVALID_OPTION'
        });
    }
    return results_1.Results.success(value);
}
/**
 * Validate string length
 */
function validateStringLength(min, max) {
    return (value) => {
        if (!(0, primitives_2.isString)(value)) {
            return results_1.Results.failure({ message: 'Value must be a string', code: 'NOT_STRING' });
        }
        if (min !== undefined && value.length < min) {
            return results_1.Results.failure({
                message: `String must be at least ${min} characters`,
                code: 'STRING_TOO_SHORT'
            });
        }
        if (max !== undefined && value.length > max) {
            return results_1.Results.failure({
                message: `String must be at most ${max} characters`,
                code: 'STRING_TOO_LONG'
            });
        }
        return results_1.Results.success(value);
    };
}
/**
 * Validate number range
 */
function validateNumberRange(min, max) {
    return (value) => {
        if (!(0, primitives_2.isNumber)(value)) {
            return results_1.Results.failure({ message: 'Value must be a number', code: 'NOT_NUMBER' });
        }
        if (min !== undefined && value < min) {
            return results_1.Results.failure({
                message: `Number must be at least ${min}`,
                code: 'NUMBER_TOO_SMALL'
            });
        }
        if (max !== undefined && value > max) {
            return results_1.Results.failure({
                message: `Number must be at most ${max}`,
                code: 'NUMBER_TOO_LARGE'
            });
        }
        return results_1.Results.success(value);
    };
}
/**
 * Validate pattern (regex)
 */
function validatePattern(pattern, message) {
    return (value) => {
        if (!(0, primitives_2.isString)(value)) {
            return results_1.Results.failure({ message: 'Value must be a string', code: 'NOT_STRING' });
        }
        if (!pattern.test(value)) {
            return results_1.Results.failure({
                message: message || `String does not match pattern ${pattern}`,
                code: 'PATTERN_MISMATCH'
            });
        }
        return results_1.Results.success(value);
    };
}
//# sourceMappingURL=validators.js.map