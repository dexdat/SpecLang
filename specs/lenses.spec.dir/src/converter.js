"use strict";
/**
 * SPECLANG-GENERATED: Lens Converter
 * Source: @speclang/lenses
 *
 * Lens-to-lens transformation utilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LensConverter = void 0;
class LensConverter {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    async convert(content, fromLens, toLens, context) {
        // Get source lens
        const source = this.registry.getByName(fromLens);
        if (!source) {
            throw new Error(`Unknown source lens: ${fromLens}`);
        }
        // Parse with source lens
        const block = await source.parse(content, context);
        // Get target lens
        const target = this.registry.getByName(toLens);
        if (!target) {
            throw new Error(`Unknown target lens: ${toLens}`);
        }
        // Update block kind for target
        if (block.source) {
            block.source.lens = toLens;
        }
        // Render with target lens
        return target.render(block, context);
    }
    async autoConvert(content, targetKind, context) {
        const { lens: source } = this.registry.detect(content);
        const target = this.registry.getByKind(targetKind);
        if (!target) {
            throw new Error(`No lens for kind: ${targetKind}`);
        }
        return this.convert(content, source.name, target.name, context);
    }
    async detectAndParse(content, context) {
        const { lens } = this.registry.detect(content);
        const block = await lens.parse(content, context);
        return { block, lensName: lens.name };
    }
}
exports.LensConverter = LensConverter;
//# sourceMappingURL=converter.js.map