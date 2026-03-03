"use strict";
/**
 * SPECLANG-GENERATED: ID format validation rule
 * Source: @speclang/validation/rules#@validation/id
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.idRule = void 0;
exports.validateId = validateId;
const types_1 = require("../types");
/**
 * ID Format Validation Rule
 *
 * Validates spec IDs according to the format:
 * - Must start with @
 * - Domain must be lowercase
 * - Path uses forward slashes
 * - No special characters except - and _
 */
exports.idRule = {
    id: '@validation/id',
    name: 'ID Format Validation',
    level: 'error',
    check(spec, _context) {
        const results = [];
        const id = spec.metadata.id;
        if (!id) {
            // Skip if no ID - header rule will catch this
            return results;
        }
        // Must start with @
        if (!id.startsWith('@')) {
            results.push((0, types_1.createError)('@validation/id', { file: spec.filepath, line: 'header' }, 'ID must start with @', 'Format: @domain/path'));
            // Can't validate further without @
            return results;
        }
        // Domain must be lowercase (part before first /)
        const parts = id.slice(1).split('/');
        const domain = parts[0];
        if (domain !== domain.toLowerCase()) {
            results.push((0, types_1.createError)('@validation/id', { file: spec.filepath, line: 'header' }, `Domain must be lowercase: "${domain}"`, `Use "${domain.toLowerCase()}" instead`));
        }
        // Path uses forward slashes (no backslashes)
        if (id.includes('\\')) {
            results.push((0, types_1.createError)('@validation/id', { file: spec.filepath, line: 'header' }, 'ID must use forward slashes, not backslashes', 'Use "/" instead of "\\"'));
        }
        // No special characters except - and _ (and / for path separator)
        const pathPart = parts.slice(1).join('/');
        const invalidChars = pathPart.match(/[^a-zA-Z0-9\/\-_]/g);
        if (invalidChars) {
            const uniqueInvalid = Array.from(new Set(invalidChars));
            results.push((0, types_1.createError)('@validation/id', { file: spec.filepath, line: 'header' }, `Invalid characters in ID: ${uniqueInvalid.join(', ')}`, 'Only letters, numbers, /, -, and _ are allowed'));
        }
        // Check for empty path parts (consecutive slashes)
        if (id.includes('//')) {
            results.push((0, types_1.createError)('@validation/id', { file: spec.filepath, line: 'header' }, 'ID contains empty path segment', 'Remove consecutive slashes'));
        }
        // ID should not end with /
        if (id.endsWith('/')) {
            results.push((0, types_1.createError)('@validation/id', { file: spec.filepath, line: 'header' }, 'ID must not end with /', 'Remove trailing slash'));
        }
        // Check for reasonable length
        if (id.length > 200) {
            results.push((0, types_1.createWarning)('@validation/id', { file: spec.filepath, line: 'header' }, `ID is very long (${id.length} characters)`, 'Consider a shorter, more readable ID'));
        }
        return results;
    },
};
/**
 * Validate a single ID string (utility function)
 */
function validateId(id) {
    const results = [];
    if (!id.startsWith('@')) {
        results.push((0, types_1.createError)('@validation/id', { file: '', line: 'header' }, 'ID must start with @', 'Format: @domain/path'));
        return results;
    }
    const parts = id.slice(1).split('/');
    const domain = parts[0];
    if (domain !== domain.toLowerCase()) {
        results.push((0, types_1.createError)('@validation/id', { file: '', line: 'header' }, `Domain must be lowercase: "${domain}"`));
    }
    if (id.includes('\\')) {
        results.push((0, types_1.createError)('@validation/id', { file: '', line: 'header' }, 'ID must use forward slashes'));
    }
    const pathPart = parts.slice(1).join('/');
    const invalidChars = pathPart.match(/[^a-zA-Z0-9@\/\-_]/g);
    if (invalidChars) {
        results.push((0, types_1.createError)('@validation/id', { file: '', line: 'header' }, `Invalid characters: ${invalidChars.join(', ')}`));
    }
    return results;
}
exports.default = exports.idRule;
//# sourceMappingURL=id.js.map