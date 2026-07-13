/**
 * SPECLANG-GENERATED: Header parsing implementation
 * Source: @speclang/headers @block:headers/parsing
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import type { SpecMetadata, Reference, Block, BlockKind } from './types';

// ============================================================================
// HEADER PARSING
// ============================================================================

/** Header line regex patterns */
const HEADER_LINE_PATTERN = /^# speclang-header(?:\s+lines:(\d+))?/i;
const FRONTMATTER_START = /^---$/;
const FRONTMATTER_END = /^---$/;
const BLOCK_PATTERN = /^#+\s+@block::(\S+)\s+@kind:(\S+)(.*)$/;
const REF_PATTERN = /@ref:([^\s\]]+)/g;

/**
 * Parse the header of a spec file
 * Supports both formats:
 * - Efficient: "# speclang-header lines:N" + N lines of YAML
 * - Flexible: "# speclang-header" + scan for "---" terminator
 */
export function parseHeader(content: string): {
  metadata: SpecMetadata;
  headerLines: number;
  headerRaw: string;
  content: string;
} {
  const lines = content.split('\n');
  
  // Skip frontmatter start if present
  let startIndex = 0;
  if (FRONTMATTER_START.test(lines[0]?.trim())) {
    startIndex = 1;
  }
  
  // Check for speclang-header declaration
  const headerLineMatch = lines[startIndex]?.match(HEADER_LINE_PATTERN);
  if (!headerLineMatch) {
    throw new Error('No speclang-header declaration found');
  }
  
  let headerLineCount: number;
  let yamlLines: string[];
  
  if (headerLineMatch[1]) {
    // Efficient format: lines:N specified
    headerLineCount = parseInt(headerLineMatch[1], 10);
    // Start from line after header declaration (startIndex + 1)
    // Read exactly headerLineCount - 1 more lines (we're already on line 1)
    // And exclude the trailing "---" from YAML by taking headerLineCount - 2
    yamlLines = lines.slice(startIndex + 1, startIndex + headerLineCount - 1);
    // But remove the trailing "---" if present
    const lastYamlLine = yamlLines[yamlLines.length - 1];
    if (lastYamlLine && FRONTMATTER_END.test(lastYamlLine.trim())) {
      yamlLines = yamlLines.slice(0, -1);
    }
  } else {
    // Flexible format: scan for terminator
    yamlLines = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (FRONTMATTER_END.test(lines[i].trim())) {
        headerLineCount = i + 1; // Include the terminator line
        break;
      }
      yamlLines.push(lines[i]);
    }
    
    if (!headerLineCount) {
      throw new Error('No header terminator "---" found');
    }
  }
  
  // Parse YAML from header lines
  // Remove trailing empty lines and the terminator "---" before parsing
  const yamlText = yamlLines.join('\n').trim();
  let metadata: SpecMetadata;
  
  try {
    const parsed = parseYaml(yamlText);
    metadata = (parsed || {}) as SpecMetadata;
  } catch (e) {
    throw new Error(`Failed to parse header YAML: ${e instanceof Error ? e.message : String(e)}`);
  }
  
  // Validate required fields
  if (!metadata.id) {
    throw new Error('Missing required field: id');
  }
  if (!metadata.version) {
    throw new Error('Missing required field: version');
  }
  
  // Get content after header
  const contentStartLine = startIndex + headerLineCount;
  const fileContent = lines.slice(contentStartLine).join('\n');
  
  return {
    metadata,
    headerLines: startIndex + headerLineCount,
    headerRaw: lines.slice(0, startIndex + headerLineCount).join('\n'),
    content: fileContent,
  };
}

// ============================================================================
// BLOCK EXTRACTION
// ============================================================================

/**
 * Extract blocks from spec content
 * Syntax: "# @block:{id} @kind:{kind} @{attr}:{value}*"
 */
export function extractBlocks(content: string, sourceFile: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let currentBlock: Block | null = null;
  let currentContent: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Check for block start
    const blockMatch = line.match(BLOCK_PATTERN);
    if (blockMatch) {
      // Save previous block
      if (currentBlock) {
        currentBlock.content = currentContent.join('\n').trim();
        blocks.push(currentBlock);
      }
      
      // Parse block attributes
      const attrs: Record<string, string> = {};
      const attrMatchArray = line.matchAll(/@(\w+):(\S+)/g);
      const attrMatches = Array.from(attrMatchArray);
      for (const match of attrMatches) {
        const [, key, value] = match;
        if (key !== 'block' && key !== 'kind') {
          attrs[key] = value;
        }
      }
      
      // Create new block
      currentBlock = {
        id: '@block::' + blockMatch[1],
        kind: blockMatch[2] as BlockKind,
        content: '',
        line: lineNumber,
        attrs: Object.keys(attrs).length > 0 ? attrs : undefined,
      };
      currentContent = [];
    } else if (currentBlock) {
      // Add to current block content
      currentContent.push(line);
    }
  }
  
  // Save last block
  if (currentBlock) {
    currentBlock.content = currentContent.join('\n').trim();
    blocks.push(currentBlock);
  }
  
  return blocks;
}

// ============================================================================
// REFERENCE EXTRACTION
// ============================================================================

/**
 * Extract all @ref: references from content
 */
export function extractReferences(content: string, sourceFile: string): Reference[] {
  const lines = content.split('\n');
  const references: Reference[] = [];
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Track fenced code blocks (``` or ~~~)
    if (/^\s*```/.test(line) || /^\s*~~~/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    // Skip lines inside code blocks
    if (inCodeBlock) {
      continue;
    }
    
    // Find all @ref: patterns in the line
    let match;
    const refPattern = new RegExp(REF_PATTERN);
    while ((match = refPattern.exec(line)) !== null) {
      const ref = match[1];
      
      // Parse reference
      const [specRef, blockRef] = ref.split('#');
      
      references.push({
        ref: `@ref:${ref}`,
        sourceFile,
        targetFile: specRef,
        targetBlock: blockRef,
        line: lineNumber,
      });
    }
  }
  
  return references;
}

/**
 * Extract references from metadata (depends_on, refs, children, parent)
 */
export function extractMetadataReferences(
  metadata: SpecMetadata,
  sourceFile: string,
  baseLine: number = 1
): Reference[] {
  const references: Reference[] = [];
  
  // Process depends_on
  if (metadata.depends_on) {
    for (const dep of metadata.depends_on) {
      if (typeof dep === 'string') {
        // Remove @ref: prefix if present
        let cleanRef = dep.replace('@ref:', '');
        // If still starts with @ (domain prefix), remove it
        if (cleanRef.startsWith('@')) {
          cleanRef = cleanRef.substring(1);
        }
        const [specRef = cleanRef, blockRef] = cleanRef.split('#');
        references.push({
          ref: dep.startsWith('@ref:') ? dep : `@ref:${cleanRef}`,
          sourceFile,
          targetFile: specRef,
          targetBlock: blockRef,
          line: baseLine,
        });
      } else if (dep && typeof dep === 'object' && 'ref' in dep) {
        const ref = dep as unknown as { ref: string };
        let cleanRef = ref.ref.replace('@ref:', '');
        if (cleanRef.startsWith('@')) {
          cleanRef = cleanRef.substring(1);
        }
        const [specRef = cleanRef, blockRef] = cleanRef.split('#');
        references.push({
          ref: ref.ref.startsWith('@ref:') ? ref.ref : `@ref:${cleanRef}`,
          sourceFile,
          targetFile: specRef,
          targetBlock: blockRef,
          line: baseLine,
        });
      }
    }
  }
  
  // Process refs
  if (metadata.refs) {
    for (const ref of metadata.refs) {
      if (typeof ref === 'string') {
        const cleanRef = ref.replace('@ref:', '');
        const [specRef = cleanRef, blockRef] = cleanRef.split('#');
        references.push({
          ref: ref.startsWith('@ref:') ? ref : `@ref:${cleanRef}`,
          sourceFile,
          targetFile: specRef,
          targetBlock: blockRef,
          line: baseLine,
        });
      }
    }
  }
  
  // Process children
  if (metadata.children) {
    for (const child of metadata.children) {
      if (typeof child === 'string') {
        // Remove @ref: prefix if present
        let cleanRef = child.replace('@ref:', '');
        // If still starts with @ (domain prefix), remove it
        if (cleanRef.startsWith('@')) {
          cleanRef = cleanRef.substring(1);
        }
        const [specRef = cleanRef, blockRef] = cleanRef.split('#');
        references.push({
          ref: child.startsWith('@ref:') ? child : `@ref:${cleanRef}`,
          sourceFile,
          targetFile: specRef,
          targetBlock: blockRef,
          line: baseLine,
        });
      }
    }
  }
  
  // Process parent
  if (metadata.parent) {
    if (typeof metadata.parent === 'string') {
      const cleanRef = metadata.parent.replace('@ref:', '');
      const [specRef = cleanRef, blockRef] = cleanRef.split('#');
      references.push({
        ref: metadata.parent.startsWith('@ref:') ? metadata.parent : `@ref:${cleanRef}`,
        sourceFile,
        targetFile: specRef,
        targetBlock: blockRef,
        line: baseLine,
      });
    } else if (typeof metadata.parent === 'object' && 'ref' in metadata.parent) {
      const parent = metadata.parent as unknown as { ref: string };
      const cleanRef = parent.ref.replace('@ref:', '');
      const [specRef = cleanRef, blockRef] = cleanRef.split('#');
      references.push({
        ref: parent.ref.startsWith('@ref:') ? parent.ref : `@ref:${cleanRef}`,
        sourceFile,
        targetFile: specRef,
        targetBlock: blockRef,
        line: baseLine,
      });
    }
  }
  
  return references;
}

// ============================================================================
// MAIN PARSE FUNCTION
// ============================================================================

/**
 * Parse a spec file
 */
export function parseSpec(filepath: string): {
  filepath: string;
  metadata: SpecMetadata;
  headerLines: number;
  content: string;
  blocks: Block[];
  references: Reference[];
  headerRaw: string;
} {
  // Read file
  const fullPath = path.resolve(filepath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Parse header
  const { metadata, headerLines, headerRaw, content: specContent } = parseHeader(content);
  
  // Extract blocks
  const blocks = extractBlocks(specContent, filepath);
  
  // Extract references from content
  const contentReferences = extractReferences(specContent, filepath);
  
  // Extract references from metadata
  const metadataReferences = extractMetadataReferences(metadata, filepath, 1);
  
  // Combine references
  const references = [...metadataReferences, ...contentReferences];
  
  return {
    filepath,
    metadata,
    headerLines,
    content: specContent,
    blocks,
    references,
    headerRaw,
  };
}

/**
 * Parse spec from string content
 */
export function parseSpecContent(
  content: string,
  filepath: string = 'unknown'
): {
  filepath: string;
  metadata: SpecMetadata;
  headerLines: number;
  content: string;
  blocks: Block[];
  references: Reference[];
  headerRaw: string;
} {
  // Parse header
  const { metadata, headerLines, headerRaw, content: specContent } = parseHeader(content);
  
  // Extract blocks
  const blocks = extractBlocks(specContent, filepath);
  
  // Extract references from content
  const contentReferences = extractReferences(specContent, filepath);
  
  // Extract references from metadata
  const metadataReferences = extractMetadataReferences(metadata, filepath, 1);
  
  // Combine references
  const references = [...metadataReferences, ...contentReferences];
  
  return {
    filepath,
    metadata,
    headerLines,
    content: specContent,
    blocks,
    references,
    headerRaw,
  };
}
