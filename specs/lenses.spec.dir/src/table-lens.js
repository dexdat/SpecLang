"use strict";
/**
 * SPECLANG-GENERATED: Table Lens
 * Source: @speclang/lenses/formats#table
 *
 * Markdown table handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableLens = void 0;
exports.tableLens = {
    name: 'table',
    kind: 'table',
    description: 'Markdown table format',
    priority: 40,
    detect: (content) => {
        const lines = content.trim().split('\n');
        if (lines.length < 2)
            return false;
        // Check for table header + separator pattern
        const headerLine = lines[0];
        const separatorLine = lines[1];
        if (!headerLine.includes('|') || !separatorLine.includes('|'))
            return false;
        // Separator must have dashes and optional colons for alignment
        return /^[\s|:\-]+$/.test(separatorLine.replace(/\|/g, ''));
    },
    parse: async (content, context) => {
        const lines = content.trim().split('\n');
        const headers = [];
        const rows = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const cells = line.split('|').map(c => c.trim()).filter(c => c);
            if (i === 0) {
                // Header row
                headers.push(...cells);
            }
            else if (line.includes('---')) {
                // Separator row - skip
                continue;
            }
            else {
                // Data row
                rows.push(cells);
            }
        }
        return {
            id: context.blockId,
            kind: 'table',
            content: '',
            metadata: {
                headers,
                rows
            },
            source: {
                lens: 'table',
                original: content,
                line: 0
            }
        };
    },
    render: async (block, context) => {
        const { headers, rows } = block.metadata;
        const indent = ' '.repeat(context.options.indent || 0);
        const lines = [];
        // Header
        lines.push(`${indent}| ${headers.join(' | ')} |`);
        // Separator
        const separator = headers.map(() => '---').join(' | ');
        lines.push(`${indent}| ${separator} |`);
        // Rows
        for (const row of rows) {
            lines.push(`${indent}| ${row.join(' | ')} |`);
        }
        return lines.join('\n');
    }
};
//# sourceMappingURL=table-lens.js.map