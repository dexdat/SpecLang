"use strict";
/**
 * SPECLANG-GENERATED: Code Lens
 * Source: @speclang/lenses/formats#code
 *
 * Code blocks with language annotation handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeLens = void 0;
exports.codeLens = {
    name: 'code',
    kind: 'code',
    description: 'Code blocks with language annotation',
    priority: 50,
    detect: (content) => {
        return /^```[\w]+\n/.test(content.trim());
    },
    parse: async (content, context) => {
        const match = content.match(/^```(\w+)?\n([\s\S]*?)\n?```$/);
        if (!match) {
            throw new Error('Invalid code block format');
        }
        const [, language = 'text', code] = match;
        return {
            id: context.blockId,
            kind: 'code',
            content: code,
            metadata: {
                language
            },
            source: {
                lens: 'code',
                original: content,
                line: 0
            }
        };
    },
    render: async (block, context) => {
        const lang = block.metadata.language || 'text';
        const indent = ' '.repeat(context.options.indent || 0);
        const code = block.content.split('\n').join(`\n${indent}`);
        return `${indent}\`\`\`${lang}\n${indent}${code}\n${indent}\`\`\``;
    }
};
//# sourceMappingURL=code-lens.js.map