"use strict";
/**
 * SPECLANG-GENERATED: Policy Lens
 * Source: @speclang/lenses/formats#policy
 *
 * Policy/rule definitions handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyLens = void 0;
exports.policyLens = {
    name: 'policy',
    kind: 'policy',
    description: 'Policy/rule definitions',
    priority: 35,
    detect: (content) => {
        const trimmed = content.trim();
        // Check for policy keyword or rule patterns
        if (/^policy\s+\w+/im.test(trimmed))
            return true;
        // Check for bullet list of rules
        const lines = trimmed.split('\n');
        const rulePatterns = [
            /^\s*-\s+\w+\s+can\s+/i,
            /^\s*-\s+only\s+\w+/i,
            /^\s*-\s+require/i,
            /^\s*-\s+\w+\s+requires/i,
        ];
        const ruleCount = lines.filter(line => rulePatterns.some(pattern => pattern.test(line))).length;
        return ruleCount >= 2;
    },
    parse: async (content, context) => {
        const lines = content.trim().split('\n');
        const nameMatch = lines[0].match(/^policy\s+(\w+)/i);
        const name = nameMatch ? nameMatch[1] : 'UnnamedPolicy';
        const rules = [];
        let currentRule = '';
        for (const line of lines.slice(1)) {
            const trimmed = line.trim();
            if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                if (currentRule)
                    rules.push(currentRule.trim());
                currentRule = trimmed.replace(/^[-*]\s*/, '');
            }
            else if (trimmed && currentRule) {
                currentRule += ' ' + trimmed;
            }
        }
        if (currentRule)
            rules.push(currentRule.trim());
        return {
            id: context.blockId,
            kind: 'policy',
            content: name,
            metadata: {
                name,
                rules
            },
            source: {
                lens: 'policy',
                original: content,
                line: 0
            }
        };
    },
    render: async (block, context) => {
        const { name, rules } = block.metadata;
        const indent = ' '.repeat(context.options.indent || 0);
        const lines = [`${indent}policy ${name}:`];
        for (const rule of rules) {
            lines.push(`${indent}  - ${rule}`);
        }
        return lines.join('\n');
    }
};
//# sourceMappingURL=policy-lens.js.map