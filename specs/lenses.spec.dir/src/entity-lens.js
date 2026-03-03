"use strict";
/**
 * SPECLANG-GENERATED: Entity Lens
 * Source: @speclang/lenses/formats#entity
 *
 * Entity/struct definitions with typed fields handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.entityLens = void 0;
exports.entityLens = {
    name: 'entity',
    kind: 'entity',
    description: 'Entity/struct definitions with typed fields',
    priority: 60,
    detect: (content) => {
        const lines = content.trim().split('\n');
        const firstLine = lines[0] || '';
        // Check for EntityName: pattern followed by field:type
        if (!/^\w+:$/.test(firstLine))
            return false;
        // Check remaining lines have field: type pattern
        const fieldLines = lines.slice(1).filter(l => l.trim());
        return fieldLines.some(line => /^\s+\w+:\s*\w+/.test(line));
    },
    parse: async (content, context) => {
        const lines = content.trim().split('\n');
        const nameMatch = lines[0].match(/^(\w+):$/);
        if (!nameMatch) {
            throw new Error('Invalid entity format');
        }
        const name = nameMatch[1];
        const fields = [];
        for (const line of lines.slice(1)) {
            const fieldMatch = line.match(/^\s+(\w+):\s*(.+)$/);
            if (fieldMatch) {
                const [, fieldName, typeOrDesc] = fieldMatch;
                // Check if it's type: description or just type
                const typeMatch = typeOrDesc.match(/^(\w+)(?:\s+(.+))?$/);
                fields.push({
                    name: fieldName,
                    type: typeMatch ? typeMatch[1] : 'string',
                    description: typeMatch?.[2] || undefined
                });
            }
        }
        return {
            id: context.blockId,
            kind: 'entity',
            content: name,
            metadata: {
                name,
                fields
            },
            source: {
                lens: 'entity',
                original: content,
                line: 0
            }
        };
    },
    render: async (block, context) => {
        const { name, fields } = block.metadata;
        const lines = [`${name}:`];
        for (const field of fields) {
            if (field.description) {
                lines.push(`  ${field.name}: ${field.type} ${field.description}`);
            }
            else {
                lines.push(`  ${field.name}: ${field.type}`);
            }
        }
        return lines.join('\n');
    }
};
//# sourceMappingURL=entity-lens.js.map