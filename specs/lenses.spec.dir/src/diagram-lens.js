"use strict";
/**
 * SPECLANG-GENERATED: Diagram Lens
 * Source: @speclang/lenses/mermaid
 *
 * Mermaid diagram blocks handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.diagramLens = void 0;
exports.detectDiagramType = detectDiagramType;
exports.diagramLens = {
    name: 'diagram',
    kind: 'diagram',
    description: 'Mermaid diagram blocks',
    priority: 70,
    detect: (content) => {
        const trimmed = content.trim();
        return /^```mermaid\n/.test(trimmed) ||
            /^(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|gantt|pie|gitGraph)/m.test(trimmed);
    },
    parse: async (content, context) => {
        let mermaidCode = content;
        // Extract from code fence if present
        const fenceMatch = content.match(/^```mermaid\n([\s\S]*?)\n?```$/);
        if (fenceMatch) {
            mermaidCode = fenceMatch[1];
        }
        // Detect diagram type
        const diagramType = detectDiagramType(mermaidCode);
        return {
            id: context.blockId,
            kind: 'diagram',
            content: mermaidCode.trim(),
            metadata: {
                format: 'mermaid',
                diagramType
            },
            source: {
                lens: 'diagram',
                original: content,
                line: 0
            }
        };
    },
    render: async (block, context) => {
        if (context.options.preserveSource && block.source?.original) {
            return block.source.original;
        }
        const code = block.content;
        return `\`\`\`mermaid\n${code}\n\`\`\``;
    }
};
function detectDiagramType(code) {
    if (/^(graph|flowchart)/m.test(code))
        return 'flowchart';
    if (/^sequenceDiagram/m.test(code))
        return 'sequence';
    if (/^classDiagram/m.test(code))
        return 'class';
    if (/^erDiagram/m.test(code))
        return 'er';
    if (/^gantt/m.test(code))
        return 'gantt';
    if (/^pie/m.test(code))
        return 'pie';
    if (/^gitGraph/m.test(code))
        return 'git';
    return 'unknown';
}
//# sourceMappingURL=diagram-lens.js.map