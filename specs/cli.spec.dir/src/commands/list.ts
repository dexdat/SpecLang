/**
speclang-header lines:5
id: @specs/cli
version: 1.0.0
layer: 5
 */

/**
 * SPECLANG-GENERATED: List command
 * Source: @speclang/mcp.cli
 */

import { loadIndex } from '../utils.js';

export interface ListOptions {
  tags?: string[];
  layer?: number;
  prefix?: string;
  json?: boolean;
  quiet?: boolean;
}

/**
 * List command implementation
 */
export async function listCommand(options: ListOptions): Promise<void> {
  const index = loadIndex();
  
  let specs = Object.values(index.specs);
  
  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    specs = specs.filter(spec => 
      options.tags!.some(tag => spec.tags?.includes(tag))
    );
  }
  
  // Filter by layer
  if (options.layer !== undefined) {
    specs = specs.filter(spec => spec.layer === options.layer);
  }
  
  // Filter by prefix
  if (options.prefix) {
    specs = specs.filter(spec => spec.id.startsWith(options.prefix!));
  }
  
  // Sort by layer then id
  specs.sort((a, b) => {
    if (a.layer !== b.layer) return a.layer - b.layer;
    return a.id.localeCompare(b.id);
  });
  
  if (options.json) {
    console.log(JSON.stringify(specs.map(s => ({
      id: s.id,
      layer: s.layer,
      version: s.version,
      short: s.short,
      file: s.file,
      tags: s.tags
    })), null, 2));
  } else if (options.quiet) {
    specs.forEach(s => console.log(s.id));
  } else {
    console.log(`Total specs: ${specs.length}\n`);
    
    // Group by layer
    const byLayer: Record<number, typeof specs> = {};
    specs.forEach(s => {
      if (!byLayer[s.layer]) byLayer[s.layer] = [];
      byLayer[s.layer].push(s);
    });
    
    for (const layer of Object.keys(byLayer).sort((a, b) => Number(a) - Number(b))) {
      console.log(`Layer ${layer}:`);
      byLayer[Number(layer)].forEach(s => {
        console.log(`  ${s.id} - ${s.short || ''}`);
      });
      console.log('');
    }
  }
}

export default listCommand;
