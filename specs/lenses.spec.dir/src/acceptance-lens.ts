/**
 * SPECLANG-GENERATED: Acceptance Lens
 * Source: @speclang/lenses/formats#acceptance
 * 
 * GIVEN/WHEN/THEN acceptance criteria handler.
 */

import { Lens, LensContext, Block, AcceptanceSection } from './types';

export const acceptanceLens: Lens = {
  name: 'acceptance',
  kind: 'acceptance',
  description: 'GIVEN/WHEN/THEN acceptance criteria',
  priority: 65,
  
  detect: (content: string): boolean => {
    const upper = content.toUpperCase();
    return /\bGIVEN\b/.test(upper) && /\bWHEN\b/.test(upper) && /\bTHEN\b/.test(upper);
  },
  
  parse: async (content: string, context: LensContext): Promise<Block> => {
    const sections: AcceptanceSection = {
      given: [] as string[],
      when: [] as string[],
      then: [] as string[]
    };
    
    let currentSection: keyof AcceptanceSection | null = null;
    
    for (const line of content.split('\n')) {
      const upperLine = line.trim().toUpperCase();
      
      if (upperLine.startsWith('GIVEN')) {
        currentSection = 'given';
        sections.given.push(line.trim().replace(/^GIVEN\s*/i, ''));
      } else if (upperLine.startsWith('WHEN')) {
        currentSection = 'when';
        sections.when.push(line.trim().replace(/^WHEN\s*/i, ''));
      } else if (upperLine.startsWith('THEN')) {
        currentSection = 'then';
        sections.then.push(line.trim().replace(/^THEN\s*/i, ''));
      } else if (currentSection && line.trim()) {
        sections[currentSection].push(line.trim());
      }
    }
    
    return {
      id: context.blockId,
      kind: 'acceptance',
      content: '',
      metadata: sections,
      source: {
        lens: 'acceptance',
        original: content,
        line: 0
      }
    };
  },
  
  render: async (block: Block, context: LensContext): Promise<string> => {
    const { given, when, then } = block.metadata as AcceptanceSection;
    const lines: string[] = [];
    
    given.forEach((g: string, i: number) => {
      lines.push(i === 0 ? `GIVEN ${g}` : `  AND ${g}`);
    });
    
    when.forEach((w: string, i: number) => {
      lines.push(i === 0 ? `WHEN ${w}` : `  AND ${w}`);
    });
    
    then.forEach((t: string, i: number) => {
      lines.push(i === 0 ? `THEN ${t}` : `  AND ${t}`);
    });
    
    return lines.join('\n');
  }
};
