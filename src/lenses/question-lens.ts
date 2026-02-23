/**
 * SPECLANG-GENERATED: Question Lens
 * Source: @speclang/lenses/formats#question
 * 
 * Open questions and unresolved decisions handler.
 */

import { Lens, LensContext, Block } from './types';

export const questionLens: Lens = {
  name: 'question',
  kind: 'question',
  description: 'Open questions and unresolved decisions',
  priority: 30,
  
  detect: (content: string): boolean => {
    const trimmed = content.trim();
    
    // Check for question mark or "should we" patterns
    if (/\?$/.test(trimmed)) return true;
    if (/^should\s+we/im.test(trimmed)) return true;
    if (/^(what|how|why|when|where|who)\s+/im.test(trimmed) && trimmed.split('\n').length < 10) {
      return true;
    }
    
    return false;
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    const lines = content.trim().split('\n');
    const question = lines[0].trim();
    
    const sections: Record<string, string[]> = {
      options: [],
      impact: [],
      notes: []
    };
    
    let currentSection: keyof typeof sections | null = null;
    
    for (const line of lines.slice(1)) {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.startsWith('options:') || trimmed.startsWith('- ') || /^[A-Z][a-z]+:$/.test(trimmed)) {
        if (trimmed.includes('option')) currentSection = 'options';
        else if (trimmed.includes('impact')) currentSection = 'impact';
        else if (trimmed.includes('note')) currentSection = 'notes';
      } else if (currentSection && line.trim()) {
        sections[currentSection].push(line.trim());
      }
    }
    
    return {
      id: context.blockId,
      kind: 'question',
      content: question,
      metadata: {
        question,
        options: sections.options,
        impact: sections.impact,
        notes: sections.notes
      },
      source: {
        lens: 'question',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    const { question, options, impact, notes } = block.metadata;
    const indent = ' '.repeat(context.options.indent || 0);
    const lines = [`${indent}${question}`];
    
    if (options.length > 0) {
      lines.push(`${indent}Options:`);
      for (const opt of options) {
        lines.push(`${indent}  - ${opt}`);
      }
    }
    
    if (impact.length > 0) {
      lines.push(`${indent}Impact:`);
      for (const imp of impact) {
        lines.push(`${indent}  - ${imp}`);
      }
    }
    
    if (notes.length > 0) {
      lines.push(`${indent}Notes:`);
      for (const note of notes) {
        lines.push(`${indent}  - ${note}`);
      }
    }
    
    return lines.join('\n');
  }
};
