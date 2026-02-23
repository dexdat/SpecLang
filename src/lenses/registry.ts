/**
 * SPECLANG-GENERATED: Lens Registry
 * Source: @speclang/lenses
 * 
 * Registry for managing and detecting lenses.
 */

import { Lens, LensMatch, LensContext, LensOptions, Block } from './types';

export class LensRegistry {
  private lenses: Map<string, Lens> = new Map();
  private sortedLenses: Lens[] = [];
  
  get lensesMap(): Map<string, Lens> {
    return this.lenses;
  }

  register(lens: Lens): void {
    this.lenses.set(lens.name, lens);
    this.sortedLenses = Array.from(this.lenses.values())
      .sort((a, b) => b.priority - a.priority);
  }
  
  detect(content: string): LensMatch {
    for (const lens of this.sortedLenses) {
      const matches = lens.detect(content);
      if (matches) {
        return { lens, confidence: 1.0 };
      }
    }
    
    // Default to prose as fallback
    const proseLens = this.lenses.get('prose');
    if (proseLens) {
      return { lens: proseLens, confidence: 0.5 };
    }
    
    throw new Error('No fallback lens available');
  }
  
  async parse(content: string, context: LensContext): Promise<Block> {
    const { lens } = this.detect(content);
    return lens.parse(content, context);
  }
  
  async render(block: Block, context: LensContext): Promise<string> {
    const lensName = block.source?.lens || this.detect(block.content).lens.name;
    const lens = this.lenses.get(lensName);
    
    if (!lens) {
      throw new Error(`Unknown lens: ${lensName}`);
    }
    
    return lens.render(block, context);
  }
  
  getByKind(kind: string): Lens | undefined {
    return this.sortedLenses.find(l => l.kind === kind);
  }
  
  getByName(name: string): Lens | undefined {
    return this.lenses.get(name);
  }
  
  list(): Lens[] {
    return [...this.sortedLenses];
  }
}

export function createDefaultContext(
  blockId: string = 'default',
  filePath: string = 'memory://',
  options: Partial<LensOptions> = {}
): LensContext {
  return {
    filePath,
    blockId,
    options: {
      preserveSource: false,
      prettyPrint: true,
      indent: 2,
      ...options
    }
  };
}
