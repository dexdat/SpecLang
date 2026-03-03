"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/template-registry.spec.md
 * Generated: 2026-03-03T05:18:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.constantTemplate = void 0;
/**
 * Constant template for generating TypeScript constants from spec blocks.
 *
 * @param data - Block data containing constant details
 * @returns Generated TypeScript constant code
 */
const constantTemplate = (data) => {
    const type = data.properties?.[0]?.type || 'any';
    return `/**
 * ${data.description}
 */
export const ${data.id}: ${type} = {
  // TODO: Define constant value
};`;
};
exports.constantTemplate = constantTemplate;
//# sourceMappingURL=constant.js.map