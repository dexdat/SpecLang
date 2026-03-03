"use strict";
/**
 * SPECLANG-GENERATED: Operation Lens
 * Source: @speclang/lenses/formats#operation
 *
 * Function/operation signatures with steps handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationLens = void 0;
exports.operationLens = {
    name: 'operation',
    kind: 'operation',
    description: 'Function/operation signatures with steps',
    priority: 55,
    detect: (content) => {
        const lines = content.trim().split('\n');
        // Check for signature pattern: name(args) -> return
        const signaturePattern = /^\w+\([^)]*\)\s*(?:->|:)\s*\w+/;
        if (signaturePattern.test(lines[0]))
            return true;
        // Check for numbered steps
        return lines.some(line => /^\d+\.\s/.test(line.trim()));
    },
    parse: async (content, context) => {
        const lines = content.trim().split('\n');
        // Parse signature
        const sigMatch = lines[0].match(/^(\w+)\(([^)]*)\)\s*(?:->|:)\s*(.+)$/);
        if (!sigMatch) {
            throw new Error('Invalid operation format');
        }
        const [, name, paramsStr, returnType] = sigMatch;
        const params = paramsStr
            .split(',')
            .map(p => p.trim())
            .filter(p => p)
            .map(p => {
            const [paramName, paramType] = p.split(':').map(s => s.trim());
            return { name: paramName, type: paramType || 'any' };
        });
        // Parse steps (numbered or bulleted)
        const steps = [];
        for (const line of lines.slice(1)) {
            const stepMatch = line.match(/^\s*(?:\d+\.\s|[-*]\s)(.+)$/);
            if (stepMatch) {
                steps.push(stepMatch[1]);
            }
        }
        return {
            id: context.blockId,
            kind: 'operation',
            content: name,
            metadata: {
                name,
                params,
                returnType: returnType.trim(),
                steps
            },
            source: {
                lens: 'operation',
                original: content,
                line: 0
            }
        };
    },
    render: async (block, context) => {
        const { name, params, returnType, steps } = block.metadata;
        const paramsStr = params.map((p) => `${p.name}: ${p.type}`).join(', ');
        const lines = [`${name}(${paramsStr}) -> ${returnType}`];
        if (steps && steps.length > 0) {
            lines.push('');
            steps.forEach((step, i) => {
                lines.push(`${i + 1}. ${step}`);
            });
        }
        return lines.join('\n');
    }
};
//# sourceMappingURL=operation-lens.js.map