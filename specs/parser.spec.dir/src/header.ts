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

/**
 * Reference pattern. Matches `@ref:` followed by:
 * - path: one or more valid identifier chars (`[a-zA-Z0-9_\-\/.]+`)
 * - optional block: `#` followed by valid identifier chars (`[a-zA-Z0-9_\-/]+`)
 *
 * The capture class deliberately excludes markdown punctuation (`\`, `` ` ``, `"`,
 * `'`, `.`, `,`, `;`, `:`, `)`, `]`, `*`, etc.) and YAML artifacts so trailing junk
 * in prose like `@ref:specs/auth#login".` or `@ref:specs/hooks):` is never captured.
 *
 * NOTE: this is the parser-side extractor. The strict validator regex lives in
 * `src/validation/rules/refs.ts` and is the source of truth for the canonical
 * reference grammar — they must stay in sync.
 */
const REF_PATTERN = /@ref:([a-zA-Z0-9_\-\/.]+)(?:#([a-zA-Z0-9_\-/]+))?/g;

/**
 * Fenced code block opening/closing pattern. Captures the fence character
 * and length so we can implement CommonMark-style nested fence tracking.
 *   group 1: `` ` `` or `~`
 *   group 2: same char repeated (3+)
 */
const FENCE_PATTERN = /^(\s*)(`{3,}|~{3,})\s*([^`]*)$/;

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
 * Extract all @ref: references from content.
 *
 * Fenced code blocks (``` and ~~~) are tracked using a stack so that nested
 * fences are handled correctly per CommonMark semantics: a closing fence must
 * match the most recently opened fence (same character, length ≥ opening).
 * Mismatched characters / longer fences are treated as nested openers, so an
 * inner ```` ```yaml ```` inside an outer ```` ```speclang ```` no longer
 * terminates the outer block early (the previous behaviour produced spurious
 * `@ref:auth%';` style extracts from SQL/code inside code blocks).
 */
export function extractReferences(content: string, sourceFile: string): Reference[] {
  const lines = content.split('\n');
  const references: Reference[] = [];
  // Stack of open fence descriptors `{ char, len }`. Empty == not in a code block.
  const fenceStack: { char: string; len: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Detect a fence line: optional leading whitespace, then 3+ ` or ~ chars,
    // followed by an optional info-string. Anything after the info-string is
    // ignored — we only need to know that this *is* a fence.
    const fenceMatch = line.match(FENCE_PATTERN);
    if (fenceMatch) {
      const fenceChar = fenceMatch[2][0];          // '`' or '~'
      const fenceLen = fenceMatch[2].length;
      const infoString = (fenceMatch[3] || '').trim();

      const top = fenceStack[fenceStack.length - 1];
      if (!top) {
        // Opening fence (we are currently outside any code block).
        fenceStack.push({ char: fenceChar, len: fenceLen });
      } else if (top.char === fenceChar && fenceLen >= top.len && infoString === '') {
        // Closing fence for the most recently opened block. Per CommonMark,
        // the closing fence must use the same character AND be at least as
        // long AND have no info string.
        fenceStack.pop();
      } else {
        // Different character or longer fence = a *nested* opener (CommonMark
        // allows fences to nest if they differ in char or length).
        fenceStack.push({ char: fenceChar, len: fenceLen });
      }
      continue;
    }

    // Skip lines inside any open fence.
    if (fenceStack.length > 0) {
      continue;
    }

    // Find all @ref: patterns in the line. The regex now has TWO capture
    // groups (path + optional block) so we read them positionally.
    let match;
    REF_PATTERN.lastIndex = 0;
    while ((match = REF_PATTERN.exec(line)) !== null) {
      const specRef = match[1];
      const blockRef = match[2]; // already extracted; no .split('#') needed

      references.push({
        ref: blockRef ? `@ref:${specRef}#${blockRef}` : `@ref:${specRef}`,
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
 * Normalize a raw metadata reference string into a clean `@ref:path[#block]`
 * suitable for the strict validator in `src/validation/rules/refs.ts`.
 *
 * The metadata extractor pulls values out of YAML, where several historical
 * generators produced malformed entries such as:
 *   - `"@ref:specs/ralph-loop.spec.dir/statestatus: draft"`  (next field merged)
 *   - `"@ref:speclang/implementationimports:"`              (next field merged)
 *   - `"\"@ref:specs/roadmap.spec.dir/.../security"`        (escaped quote)
 *   - `"@ref:speclang/implementation.meta-circular  - "`     (list marker suffix)
 *
 * Strategy:
 *   1. Strip a single pair of surrounding matching quotes (`"..."` / `'...'`).
 *   2. Pull out the first `@ref:` token from the string (if any), so merged
 *      YAML fields after it are discarded.
 *   3. Match the strict grammar and return either the cleaned full ref
 *      (`@ref:path[#block]`) or `null` when nothing valid remains. We never
 *      return a partially-cleaned string that the validator would reject.
 */
const STRICT_REF_GRAMMAR = /^@ref:([a-zA-Z0-9_\-\/.]+)(?:#([a-zA-Z0-9_\-\/]+))?$/;

export function normalizeMetadataRef(raw: string | unknown): string | null {
  if (typeof raw !== 'string') return null;
  let value = raw.trim();

  // Strip a single pair of surrounding matching quotes.
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' || first === "'") && last === first) {
      value = value.slice(1, -1).trim();
    }
  }

  // Drop a leading `@` (domain-prefix shorthand like `@speclang/foo`).
  if (value.startsWith('@') && !value.startsWith('@ref:')) {
    value = value.slice(1);
  }

  // If it already begins with `@ref:`, keep only that token — anything after
  // a YAML field separator (`: `) or list marker (`  - `) was a leak from a
  // sibling field.
  if (value.startsWith('@ref:')) {
    // Take everything up to the first whitespace OR a `:` followed by a space
    // (the YAML key separator pattern that marks a merged-in next field).
    const cut = value.search(/\s|: (?:[a-zA-Z]|$)/);
    if (cut > 0) value = value.slice(0, cut);
  } else {
    // Bare path (no `@ref:` prefix) — wrap it.
    const cut = value.search(/\s|: (?:[a-zA-Z]|$)/);
    const path = cut > 0 ? value.slice(0, cut) : value;
    if (!path) return null;
    value = `@ref:${path}`;
  }

  // Final sanity check against the strict grammar.
  if (!STRICT_REF_GRAMMAR.test(value)) return null;
  return value;
}

/**
 * Build a `Reference` record from a normalized `@ref:` string. Returns `null`
 * if normalization fails (caller should skip it).
 */
function refFromNormalized(
  normalized: string,
  sourceFile: string,
  line: number
): Reference | null {
  const m = normalized.match(STRICT_REF_GRAMMAR);
  if (!m) return null;
  return {
    ref: normalized,
    sourceFile,
    targetFile: m[1],
    targetBlock: m[2],
    line,
  };
}

/**
 * Extract references from metadata (depends_on, refs, children, parent).
 *
 * Each raw metadata entry is run through `normalizeMetadataRef` so the
 * resulting reference list contains only entries that will pass the strict
 * format validator in `src/validation/rules/refs.ts`.
 */
export function extractMetadataReferences(
  metadata: SpecMetadata,
  sourceFile: string,
  baseLine: number = 1
): Reference[] {
  const references: Reference[] = [];

  const collect = (entries: unknown): void => {
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
      // Plain string entry: `@ref:foo` or `@ref:foo#bar` (possibly mangled).
      if (typeof entry === 'string') {
        const normalized = normalizeMetadataRef(entry);
        if (!normalized) continue;
        const ref = refFromNormalized(normalized, sourceFile, baseLine);
        if (ref) references.push(ref);
        continue;
      }
      // Object entry with `{ ref: "..." }`.
      if (entry && typeof entry === 'object' && 'ref' in (entry as object)) {
        const refObj = entry as { ref: unknown };
        if (typeof refObj.ref !== 'string') continue;
        const normalized = normalizeMetadataRef(refObj.ref);
        if (!normalized) continue;
        const ref = refFromNormalized(normalized, sourceFile, baseLine);
        if (ref) references.push(ref);
      }
    }
  };

  // Process depends_on
  if (metadata.depends_on) collect(metadata.depends_on);

  // Process refs
  if (metadata.refs) collect(metadata.refs);

  // Process children
  if (metadata.children) collect(metadata.children);

  // Process parent (string OR {ref: string})
  if (metadata.parent) {
    if (typeof metadata.parent === 'string') {
      const normalized = normalizeMetadataRef(metadata.parent);
      if (normalized) {
        const ref = refFromNormalized(normalized, sourceFile, baseLine);
        if (ref) references.push(ref);
      }
    } else if (typeof metadata.parent === 'object' && 'ref' in (metadata.parent as object)) {
      const parentObj = metadata.parent as { ref: unknown };
      if (typeof parentObj.ref === 'string') {
        const normalized = normalizeMetadataRef(parentObj.ref);
        if (normalized) {
          const ref = refFromNormalized(normalized, sourceFile, baseLine);
          if (ref) references.push(ref);
        }
      }
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
