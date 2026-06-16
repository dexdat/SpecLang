"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/template-registry.spec.md
 * Generated: 2026-03-03T05:17:30.000Z
 *
 * Edit the spec, not this file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumTemplate = void 0;
/**
 * Enum template for generating TypeScript enums from spec blocks.
 *
 * @param data - Block data containing enum details
 * @returns Generated TypeScript enum code
 */
const enumTemplate = (data) => {
    return `/**
 * ${data.description}
 */
export enum ${data.id} {
  // TODO: Define enum values
}`;
};
exports.enumTemplate = enumTemplate;
//# sourceMappingURL=enum.js.map