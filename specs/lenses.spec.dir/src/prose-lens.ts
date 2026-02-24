/**
 * SPECLANG-GENERATED: Prose Lens
 * Source: @speclang/lenses/formats#prose
 * 
 * Default prose/markdown content handler.
 */

import { Lens, LensContext, Block } from './types';

export const proseLens: Lens = {
  name: 'prose',
  kind: 'note',
  description: 'Default prose/markdown content',
  priority: 0, // Lowest priority - fallback
  
  detect: (content: string): boolean => {
    // Always matches as fallback - lowest priority means it's tried last
    return true;
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    return {
      id: context.blockId,
      kind: 'note',
      content: content.trim(),
      metadata: {},
      source: {
        lens: 'prose',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    return block.content;
  }
};
