"use strict";
/**
 * SPECLANG-GENERATED: Decision Lens
 * Source: @speclang/lenses/formats#decision
 *
 * ADR (Architecture Decision Record) handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decisionLens = void 0;
exports.decisionLens = {
    name: 'decision',
    kind: 'decision',
    description: 'Architecture Decision Records (ADR)',
    priority: 32,
    detect: (content) => {
        const trimmed = content.trim().toLowerCase();
        // Check for ADR patterns
        if (/^decision:/im.test(trimmed))
            return true;
        if (/^adr-\d+/im.test(trimmed))
            return true;
        if (/^status:(accepted|proposed|deprecated|superseded)/im.test(trimmed))
            return true;
        // Check for context/options/decision structure
        const hasContext = /^context:/im.test(trimmed);
        const hasOptions = /^options:/im.test(trimmed);
        const hasDecision = /^decision:/im.test(trimmed);
        return [hasContext, hasOptions, hasDecision].filter(Boolean).length >= 2;
    },
    parse: async (content, context) => {
        const lines = content.trim().split('\n');
        const sections = {
            context: [],
            options: [],
            decision: [],
            consequences: []
        };
        let currentSection = null;
        for (const line of lines) {
            const trimmed = line.trim();
            const lowerLine = trimmed.toLowerCase();
            // Detect section headers
            if (/^(context|options|decision|consequences|status):/i.test(trimmed)) {
                const match = trimmed.match(/^(\w+):/i);
                if (match) {
                    currentSection = match[1].toLowerCase();
                }
            }
            else if (currentSection && trimmed) {
                sections[currentSection].push(trimmed);
            }
        }
        const title = sections.decision[0] || 'Untitled Decision';
        return {
            id: context.blockId,
            kind: 'decision',
            content: title,
            metadata: {
                title,
                context: sections.context,
                options: sections.options,
                decision: sections.decision,
                consequences: sections.consequences
            },
            source: {
                lens: 'decision',
                original: content,
                line: 0
            }
        };
    },
    render: async (block, context) => {
        const { context: ctx, options, decision, consequences } = block.metadata;
        const indent = ' '.repeat(context.options.indent || 0);
        const lines = [];
        if (ctx.length > 0) {
            lines.push(`${indent}Context:`);
            for (const c of ctx)
                lines.push(`${indent}  ${c}`);
        }
        if (options.length > 0) {
            lines.push(`${indent}Options:`);
            for (const opt of options)
                lines.push(`${indent}  - ${opt}`);
        }
        if (decision.length > 0) {
            lines.push(`${indent}Decision:`);
            for (const d of decision)
                lines.push(`${indent}  ${d}`);
        }
        if (consequences.length > 0) {
            lines.push(`${indent}Consequences:`);
            for (const cons of consequences)
                lines.push(`${indent}  ${cons}`);
        }
        return lines.join('\n');
    }
};
//# sourceMappingURL=decision-lens.js.map