/**
 * SPECLANG-GENERATED: Code Lens
 * Source: @speclang/lenses/formats#code
 * 
 * Code blocks with language annotation handler.
 */

import { Lens, LensContext, Block } from './types';

export const codeLens: Lens = {
  name: 'code',
  kind: 'code',
  description: 'Code blocks with language annotation',
  priority: 50,
  
  detect: (content: string): boolean => {
    return /^```[\w]+\n/.test(content.trim());
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    const match = content.match(/^```(\w+)?\n([\s\S]*?)\n?```$/);
    
    if (!match) {
      throw new Error('Invalid code block format');
    }
    
    const [, language = 'text', code] = match;
    
    return {
      id: context.blockId,
      kind: 'code',
      content: code,
      metadata: {
        language
      },
      source: {
        lens: 'code',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    const lang = block.metadata.language || 'text';
    const indent = ' '.repeat(context.options.indent || 0);
    const code = block.content.split('\n').join(`\n${indent}`);
    
    return `${indent}\`\`\`${lang}\n${indent}${code}\n${indent}\`\`\``;
  }
};
