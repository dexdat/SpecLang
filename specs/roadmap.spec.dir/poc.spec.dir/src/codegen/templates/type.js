"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/template-registry.spec.md
 * Generated: 2026-03-03T05:17:00.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeTemplate = void 0;
/**
 * Type alias template for generating TypeScript type aliases from spec blocks.
 *
 * @param data - Block data containing type details
 * @returns Generated TypeScript type alias code
 */
const typeTemplate = (data) => {
    return `/**
 * ${data.description}
 */
export type ${data.id} = {
  // TODO: Define type structure
};`;
};
exports.typeTemplate = typeTemplate;
//# sourceMappingURL=type.js.map