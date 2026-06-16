"use strict";
/**
 * SPECLANG-GENERATED: Acceptance Lens
 * Source: @speclang/lenses/formats#acceptance
 *
 * GIVEN/WHEN/THEN acceptance criteria handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptanceLens = void 0;
exports.acceptanceLens = {
    name: 'acceptance',
    kind: 'acceptance',
    description: 'GIVEN/WHEN/THEN acceptance criteria',
    priority: 65,
    detect: (content) => {
        const upper = content.toUpperCase();
        return /\bGIVEN\b/.test(upper) && /\bWHEN\b/.test(upper) && /\bTHEN\b/.test(upper);
    },
    parse: async (content, context) => {
        const sections = {
            given: [],
            when: [],
            then: []
        };
        let currentSection = null;
        for (const line of content.split('\n')) {
            const upperLine = line.trim().toUpperCase();
            if (upperLine.startsWith('GIVEN')) {
                currentSection = 'given';
                sections.given.push(line.trim().replace(/^GIVEN\s*/i, ''));
            }
            else if (upperLine.startsWith('WHEN')) {
                currentSection = 'when';
                sections.when.push(line.trim().replace(/^WHEN\s*/i, ''));
            }
            else if (upperLine.startsWith('THEN')) {
                currentSection = 'then';
                sections.then.push(line.trim().replace(/^THEN\s*/i, ''));
            }
            else if (currentSection && line.trim()) {
                sections[currentSection].push(line.trim());
            }
        }
        return {
            id: context.blockId,
            kind: 'acceptance',
            content: '',
            metadata: sections,
            source: {
                lens: 'acceptance',
                original: content,
                line: 0
            }
        };
    },
    render: async (block, context) => {
        const { given, when, then } = block.metadata;
        const lines = [];
        given.forEach((g, i) => {
            lines.push(i === 0 ? `GIVEN ${g}` : `  AND ${g}`);
        });
        when.forEach((w, i) => {
            lines.push(i === 0 ? `WHEN ${w}` : `  AND ${w}`);
        });
        then.forEach((t, i) => {
            lines.push(i === 0 ? `THEN ${t}` : `  AND ${t}`);
        });
        return lines.join('\n');
    }
};
//# sourceMappingURL=acceptance-lens.js.map