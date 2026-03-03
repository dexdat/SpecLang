"use strict";
/**
 * SPECLANG-GENERATED: Prose Lens
 * Source: @speclang/lenses/formats#prose
 *
 * Default prose/markdown content handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.proseLens = void 0;
exports.proseLens = {
    name: 'prose',
    kind: 'note',
    description: 'Default prose/markdown content',
    priority: 0, // Lowest priority - fallback
    detect: (content) => {
        // Always matches as fallback - lowest priority means it's tried last
        return true;
    },
    parse: async (content, context) => {
        return {
            id: context.blockId,
            kind: 'note',
            content: content.trim(),
            metadata: {},
            source: {
                lens: 'prose',
                original: content,
                line: 0
            }
        };
    },
    render: async (block, context) => {
        return block.content;
    }
};
//# sourceMappingURL=prose-lens.js.map