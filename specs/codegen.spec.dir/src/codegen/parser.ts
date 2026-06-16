/**
 * SPECLANG-GENERATED: Spec parser for codegen
 * Source: @speclang/codegen @block:parser
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseSpec, parseSpecContent } from '../../../parser.spec.dir/src/header.js';
import type { CodeSpec, CodeBlock, TargetConfig, TargetLanguage, CodeParserOptions } from './types';
import { DEFAULT_CODE_PARSER_OPTIONS } from './types';

// ============================================================================
// PARSING
// ============================================================================

/** Parse a spec file for code generation */
export function parseCodeSpec(filepath: string, options?: CodeParserOptions): CodeSpec {
  const opts = { ...DEFAULT_CODE_PARSER_OPTIONS, ...options };
  
  // Parse using existing parser
  const parsed = parseSpec(filepath);
  
  // Extract target config
  const target = parseTargetConfig(parsed.metadata, filepath);
  
  // Extract code blocks
  const blocks = extractCodeBlocks(parsed.blocks, parsed.content);
  
  // Extract imports
  const imports = extractImports(parsed.content);
  
  return {
    header: parsed.metadata,
    target,
    blocks,
    imports,
    sourceFile: filepath,
  };
}

/** Parse spec content string for code generation */
export function parseCodeSpecContent(content: string, filepath: string = 'unknown'): CodeSpec {
  const parsed = parseSpecContent(content, filepath);
  
  const target = parseTargetConfig(parsed.metadata, filepath);
  const blocks = extractCodeBlocks(parsed.blocks, parsed.content);
  const imports = extractImports(parsed.content);
  
  return {
    header: parsed.metadata,
    target,
    blocks,
    imports,
    sourceFile: filepath,
  };
}

/** Parse target configuration from metadata */
function parseTargetConfig(metadata: { target?: string; depends_on?: unknown[] }, sourceFile: string): TargetConfig {
  const targetLang = (metadata.target as TargetLanguage) || 'typescript';
  
  // Default output path based on spec ID
  let outputPath = 'src/generated';
  
  // Try to determine from depends_on or default
  if (metadata.depends_on && metadata.depends_on.length > 0) {
    const firstDep = metadata.depends_on[0];
    if (typeof firstDep === 'string') {
      outputPath = `src/${firstDep.replace(/[@/]/g, '-')}`;
    }
  }
  
  return {
    language: targetLang,
    outputPath,
  };
}

// ============================================================================
// BLOCK EXTRACTION
// ============================================================================

/** Extract code blocks from parsed blocks */
function extractCodeBlocks(blocks: Array<{ id: string; kind: string; content: string; line: number }>, content: string): CodeBlock[] {
  return blocks
    .filter(block => isCodeBlockKind(block.kind))
    .map(block => ({
      id: block.id,
      kind: mapKind(block.kind),
      language: detectLanguage(block.content, block.kind),
      content: extractCodeContent(block.content),
      refs: extractRefsFromBlock(content, block.id),
      line: block.line,
    }));
}

/** Check if block kind is a code type */
function isCodeBlockKind(kind: string): boolean {
  const codeKinds = ['code', 'interface', 'function', 'class', 'type', 'struct', 'entity', 'operation', 'implementation'];
  return codeKinds.includes(kind.toLowerCase());
}

/** Map block kind to codegen kind */
function mapKind(kind: string): CodeBlock['kind'] {
  const kindMap: Record<string, CodeBlock['kind']> = {
    code: 'code',
    interface: 'interface',
    function: 'function',
    class: 'class',
    type: 'type',
    struct: 'struct',
    entity: 'entity',
    operation: 'operation',
    impl: 'impl',
    enum: 'enum',
    implementation: 'code',
  };
  return kindMap[kind.toLowerCase()] || 'code';
}

/** Detect language from code content */
function detectLanguage(content: string, kind: string): string {
  // Check for language hints in content
  if (content.includes('function ') || content.includes('export ') || content.includes('interface ')) {
    return 'typescript';
  }
  if (content.includes('func ') && content.includes('package ')) {
    return 'go';
  }
  if (content.includes('def ') && content.includes(':')) {
    return 'python';
  }
  if (content.includes('fn ') && content.includes('->')) {
    return 'rust';
  }
  
  // Default based on kind
  if (kind === 'struct') return 'go';
  return 'typescript';
}

/** Extract code content from block (remove code fence markers) */
function extractCodeContent(content: string): string {
  // Remove markdown code fence markers
  const lines = content.split('\n');
  const codeLines: string[] = [];
  let inCodeFence = false;
  
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence || line.trim()) {
      codeLines.push(line);
    }
  }
  
  return codeLines.join('\n').trim();
}

/** Extract @ref: references from block content */
function extractRefsFromBlock(content: string, blockId: string): string[] {
  const refs: string[] = [];
  const refPattern = /@ref:([^\s\]]+)/g;
  let match;
  
  while ((match = refPattern.exec(content)) !== null) {
    refs.push(match[1]);
  }
  
  return refs;
}

// ============================================================================
// IMPORT EXTRACTION
// ============================================================================

/** Extract import statements from content */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importPatterns = [
    /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
  ];
  
  for (const pattern of importPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      imports.push(match[1]);
    }
  }
  
  return [...new Set(imports)];
}

// ============================================================================
// SPEC FILE FINDING
// ============================================================================

/** Find all spec files with code blocks in a directory */
export function findCodeSpecFiles(dir: string, recursive: boolean = true): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && recursive) {
      files.push(...findCodeSpecFiles(fullPath, recursive));
    } else if (entry.isFile() && (entry.name.endsWith('.spec') || entry.name.endsWith('.md'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/** Check if a spec file has code blocks */
export function specHasCodeBlocks(filepath: string): boolean {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return content.includes('@block:') && content.includes('```');
  } catch {
    return false;
  }
}
