/**
 * SPECLANG-GENERATED: Parse Phase
 * Source: @speclang/compiler.spec.dir/phases @compiler/parse
 */

import * as fs from 'fs';
import type { Block, Reference, SpecMetadata } from '../../parser/types';
import type { SpecGraph } from './types';
import { createError } from './errors';

export interface ParseOptions {
  sources: string[];
  encoding?: BufferEncoding;
}

export async function parsePhase(sources: string[]): Promise<SpecGraph> {
  const graph: SpecGraph = {
    nodes: [],
    edges: [],
    headers: {},
    errors: [],
    sources: [],
  };

  for (const source of sources) {
    try {
      const content = await fs.promises.readFile(source, 'utf-8');
      const parsed = parseSpecContent(content, source);
      
      graph.nodes.push(...parsed.blocks);
      graph.edges.push(...parsed.references);
      graph.headers[parsed.metadata.id] = parsed.metadata;
      graph.sources.push(source);
    } catch (err) {
      const error = createError(
        'E005',
        `Failed to parse ${source}: ${(err as Error).message}`,
        { file: source, line: 1, column: 1 }
      );
      graph.errors.push(error);
    }
  }

  return graph;
}

interface ParsedContent {
  metadata: SpecMetadata;
  blocks: Block[];
  references: Reference[];
}

function parseSpecContent(content: string, filepath: string): ParsedContent {
  const lines = content.split('\n');
  let headerLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '---') {
      headerLines = i + 1;
      break;
    }
  }

  if (headerLines === 0) {
    throw new Error('Missing header separator ---');
  }

  const metadata = parseHeader(lines.slice(1, headerLines - 1).join('\n'));
  const contentBody = lines.slice(headerLines).join('\n');
  const blocks = extractBlocks(contentBody, headerLines);
  const references = extractReferences(contentBody, filepath);

  return { metadata, blocks, references };
}

function parseHeader(headerText: string): SpecMetadata {
  const lines = headerText.split('\n');
  const metadata: Partial<SpecMetadata> = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    
    const key = trimmed.slice(0, colonIdx).trim();
    const rawValue = trimmed.slice(colonIdx + 1).trim();
    let value: string | string[] = rawValue;
    
    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      value = rawValue.slice(1, -1).split(',').map((v) => v.trim());
    }
    
    (metadata as Record<string, unknown>)[key] = value;
  }

  return metadata as SpecMetadata;
}

function extractBlocks(content: string, offset: number): Block[] {
  const blocks: Block[] = [];
  const lines = content.split('\n');
  let currentBlock: Partial<Block> | null = null;
  let contentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const blockMatch = line.match(/#\s*@block:(\S+)\s*@kind:(\S+)/);

    if (blockMatch) {
      if (currentBlock) {
        blocks.push({
          id: currentBlock.id!,
          kind: currentBlock.kind as Block['kind'],
          content: contentLines.join('\n').trim(),
          line: currentBlock.line!,
        });
      }
      currentBlock = {
        id: blockMatch[1],
        kind: blockMatch[2] as Block['kind'],
        line: offset + i + 1,
      };
      contentLines = [];
    } else if (currentBlock) {
      contentLines.push(line);
    }
  }

  if (currentBlock) {
    blocks.push({
      id: currentBlock.id!,
      kind: currentBlock.kind as Block['kind'],
      content: contentLines.join('\n').trim(),
      line: currentBlock.line!,
    });
  }

  return blocks;
}

function extractReferences(content: string, filepath: string): Reference[] {
  const references: Reference[] = [];
  const refRegex = /@ref:(\S+)/g;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let match;
    while ((match = refRegex.exec(lines[i])) !== null) {
      references.push({
        ref: match[1],
        sourceFile: filepath,
        line: i + 1,
      });
    }
  }

  return references;
}

export function parse(sources: string[]): SpecGraph {
  return parsePhase(sources) as unknown as SpecGraph;
}
