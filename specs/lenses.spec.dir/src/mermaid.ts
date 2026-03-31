/**
 * SPECLANG-GENERATED: Mermaid Diagram Generation Lenses
 * Source: @speclang/lenses/mermaid
 * 
 * Lenses that generate Mermaid diagrams from spec blocks.
 */

import { Lens, LensContext, Block } from './types';

// ==================== Flowchart Lens ====================

export const flowchartLens: Lens = {
  name: 'flowchart',
  kind: 'flowchart',
  description: 'Generates flowcharts from arrow-separated steps',
  priority: 60,

  detect: (content: string): boolean => {
    const trimmed = content.trim();
    // Detect arrow notation: Step 1 → Step 2 → Step 3
    return /→/.test(trimmed) && !/^```mermaid/.test(trimmed);
  },

  parse: async (content: string, context: LensContext): Promise<Block> => {
    const steps = content.split('→').map(s => s.trim()).filter(s => s.length > 0);
    const nodes = steps.map((step, i) => ({
      id: `step${i}`,
      label: step,
      type: 'process'
    }));
    const edges = steps.slice(0, -1).map((_, i) => ({
      from: `step${i}`,
      to: `step${i + 1}`,
      label: '',
      type: 'arrow'
    }));

    return {
      id: context.blockId,
      kind: 'flowchart',
      content: JSON.stringify({ nodes, edges }), // store structured data
      metadata: {
        format: 'mermaid',
        diagramType: 'flowchart',
        direction: 'TD'
      },
      source: {
        lens: 'flowchart',
        original: content,
        line: 0
      }
    };
  },

  render: async (block: Block, context: LensContext): Promise<string> => {
    if (context.options.preserveSource && block.source?.original) {
      return block.source.original;
    }

    let data: { nodes: Array<{ id: string, label: string }>, edges: Array<{ from: string, to: string }> };
    try {
      data = JSON.parse(block.content);
    } catch {
      // fallback: parse from original content
      const steps = block.source?.original?.split('→').map(s => s.trim()).filter(s => s.length > 0) || [];
      data = {
        nodes: steps.map((step, i) => ({ id: `step${i}`, label: step })),
        edges: steps.slice(0, -1).map((_, i) => ({ from: `step${i}`, to: `step${i + 1}` }))
      };
    }

    const nodes = data.nodes.map(n => `    ${n.id}[${n.label}]`);
    const edges = data.edges.map(e => `    ${e.from} --> ${e.to}`);
    return `flowchart TD\n${nodes.join('\n')}\n${edges.join('\n')}`;
  }
};

// ==================== Sequence Lens ====================

export const sequenceLens: Lens = {
  name: 'sequence',
  kind: 'sequence',
  description: 'Generates sequence diagrams from interaction lines',
  priority: 60,

  detect: (content: string): boolean => {
    const trimmed = content.trim();
    // Detect lines like "A -> B: message"
    return /^\w+\s*->\s*\w+/m.test(trimmed) && !/^```mermaid/.test(trimmed);
  },

  parse: async (content: string, context: LensContext): Promise<Block> => {
    const lines = content.split('\n').filter(l => l.trim());
    const participants = new Set<string>();
    const edges: Array<{ from: string, to: string, label: string, type: 'sync' | 'async' }> = [];

    for (const line of lines) {
      const match = line.match(/^(\w+)\s*(->|-->>)\s*(\w+)(?:\s*:\s*(.+))?$/);
      if (match) {
        const [, from, arrow, to, label] = match;
        participants.add(from);
        participants.add(to);
        edges.push({
          from,
          to,
          label: label || '',
          type: arrow === '->' ? 'sync' : 'async'
        });
      }
    }

    const nodes = Array.from(participants).map(p => ({
      id: p,
      label: p,
      type: 'participant'
    }));

    return {
      id: context.blockId,
      kind: 'sequence',
      content: JSON.stringify({ nodes, edges }),
      metadata: {
        format: 'mermaid',
        diagramType: 'sequence'
      },
      source: {
        lens: 'sequence',
        original: content,
        line: 0
      }
    };
  },

  render: async (block: Block, context: LensContext): Promise<string> => {
    if (context.options.preserveSource && block.source?.original) {
      return block.source.original;
    }

    let data: { nodes: Array<{ id: string }>, edges: Array<{ from: string, to: string, label: string, type: 'sync' | 'async' }> };
    try {
      data = JSON.parse(block.content);
    } catch {
      // fallback: parse from original content
      const lines = block.source?.original?.split('\n').filter(l => l.trim()) || [];
      const participants = new Set<string>();
      const edges: typeof data.edges = [];
      for (const line of lines) {
        const match = line.match(/^(\w+)\s*(->|-->>)\s*(\w+)(?:\s*:\s*(.+))?$/);
        if (match) {
          const [, from, arrow, to, label] = match;
          participants.add(from);
          participants.add(to);
          edges.push({
            from,
            to,
            label: label || '',
            type: arrow === '->' ? 'sync' : 'async'
          });
        }
      }
      data = {
        nodes: Array.from(participants).map(p => ({ id: p })),
        edges
      };
    }

    const participantLines = data.nodes.map(p => `    participant ${p.id}`);
    const messageLines = data.edges.map(e => {
      const arrow = e.type === 'sync' ? '->>' : '-->>';
      return `    ${e.from}${arrow}${e.to}: ${e.label}`;
    });
    return `sequenceDiagram\n${participantLines.join('\n')}\n${messageLines.join('\n')}`;
  }
};

// ==================== Class Lens ====================

export const classLens: Lens = {
  name: 'class',
  kind: 'class',
  description: 'Generates class diagrams from entity definitions',
  priority: 60,

  detect: (content: string): boolean => {
    const trimmed = content.trim();
    // Detect lines like "User: id, email" or "class User"
    return /^\w+\s*:/m.test(trimmed) && !/^```mermaid/.test(trimmed);
  },

  parse: async (content: string, context: LensContext): Promise<Block> => {
    const lines = content.split('\n').filter(l => l.trim());
    const nodes: Array<{ id: string, label: string, fields: string[] }> = [];
    const edges: Array<{ from: string, to: string, label: string }> = [];

    for (const line of lines) {
      if (line.includes(':')) {
        const [className, rest] = line.split(':');
        const classNameTrim = className.trim();
        const fields = rest.split(',').map(f => f.trim()).filter(f => f.length > 0);
        nodes.push({
          id: classNameTrim,
          label: classNameTrim,
          fields
        });
      }
    }

    return {
      id: context.blockId,
      kind: 'class',
      content: JSON.stringify({ nodes, edges }),
      metadata: {
        format: 'mermaid',
        diagramType: 'class'
      },
      source: {
        lens: 'class',
        original: content,
        line: 0
      }
    };
  },

  render: async (block: Block, context: LensContext): Promise<string> => {
    if (context.options.preserveSource && block.source?.original) {
      return block.source.original;
    }

    let data: { nodes: Array<{ id: string, fields: string[] }> };
    try {
      data = JSON.parse(block.content);
    } catch {
      // fallback: parse from original content
      const lines = block.source?.original?.split('\n').filter(l => l.trim()) || [];
      const nodes: Array<{ id: string, fields: string[] }> = [];
      for (const line of lines) {
        if (line.includes(':')) {
          const [className, rest] = line.split(':');
          const fields = rest.split(',').map(f => f.trim()).filter(f => f.length > 0);
          nodes.push({
            id: className.trim(),
            fields
          });
        }
      }
      data = { nodes };
    }

    const classLines = data.nodes.map(node => {
      if (node.fields.length === 0) {
        return `    class ${node.id}`;
      } else {
        const fields = node.fields.map(f => `+${f}`).join('\\n');
        return `    class ${node.id} {\n        ${fields}\n    }`;
      }
    });
    return `classDiagram\n${classLines.join('\n')}`;
  }
};

// ==================== Registration ====================

export function registerMermaidLenses(registry: { register(lens: Lens): void }): void {
  registry.register(flowchartLens);
  registry.register(sequenceLens);
  registry.register(classLens);
}