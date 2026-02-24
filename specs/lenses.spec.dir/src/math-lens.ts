/**
 * SPECLANG-GENERATED: Math Lens
 * Source: @speclang/lenses/formats#math
 * 
 * Math/equation LaTeX handler.
 */

import { Lens, LensContext, Block } from './types';

export const mathLens: Lens = {
  name: 'math',
  kind: 'math',
  description: 'Mathematical formulas in LaTeX format',
  priority: 45,
  
  detect: (content: string): boolean => {
    const trimmed = content.trim();
    
    // Check for LaTeX math delimiters
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) return true;
    if (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) return true;
    if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) return true;
    
    // Check for common math patterns
    const mathPatterns = [
      /\\[a-zA-Z]+\{/,           // LaTeX commands like \frac{}{}
      /[A-Z]\([a-zA-Z]\)/,       // Function notation like T(n)
      /∑|∏|∫|∞|√|±|≤|≥|≠|≈/,    // Math symbols
      /_\{[^}]+\}|\^[a-zA-Z]/,   // Subscripts/superscripts
    ];
    
    return mathPatterns.some(pattern => pattern.test(trimmed));
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    let mathContent = content.trim();
    let delimiter = 'inline';
    
    // Extract from delimiters
    if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
      mathContent = mathContent.slice(2, -2).trim();
      delimiter = 'block';
    } else if (mathContent.startsWith('\\(') && mathContent.endsWith('\\)')) {
      mathContent = mathContent.slice(2, -2).trim();
      delimiter = 'inline';
    } else if (mathContent.startsWith('\\[') && mathContent.endsWith('\\]')) {
      mathContent = mathContent.slice(2, -2).trim();
      delimiter = 'block';
    }
    
    return {
      id: context.blockId,
      kind: 'math',
      content: mathContent,
      metadata: {
        delimiter,
        format: 'latex'
      },
      source: {
        lens: 'math',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    const { delimiter = 'inline' } = block.metadata;
    const code = block.content;
    
    if (delimiter === 'block') {
      return `$$\n${code}\n$$`;
    }
    
    return `\\(${code}\\)`;
  }
};
