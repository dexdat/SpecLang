/**
 * SPECLANG-GENERATED: Splitting strategies implementation
 * Source: @speclang/dynamic-split/strategy @block:split/logic
 */

import * as path from 'path';
import type { SplitResult, SplitFile, SplitBlock, SplitStrategy, SplitConfig } from './types';
import { DEFAULT_SPLIT_CONFIG } from './types';
import { TokenCounter } from './token-counter';

/** Parsed spec content with blocks */
interface ParsedContent {
  header: string;
  blocks: SplitBlock[];
  otherContent: string;
}

/**
 * Base class for all splitting strategies
 */
export abstract class SplitStrategyBase {
  protected config: SplitConfig;
  protected counter: TokenCounter;

  constructor(config: Partial<SplitConfig> = {}) {
    this.config = { ...DEFAULT_SPLIT_CONFIG, ...config };
    this.counter = new TokenCounter();
  }

  /**
   * Execute the split strategy
   */
  public abstract split(
    specPath: string,
    content: string,
    metadata: Record<string, unknown>
  ): SplitResult;

  /**
   * Parse spec content into blocks
   */
  protected parseBlocks(content: string): ParsedContent {
    const lines = content.split('\n');
    const headerLines: string[] = [];
    const blocks: SplitBlock[] = [];
    const otherLines: string[] = [];

    let inHeader = false;
    let inBlock = false;
    let currentBlock: SplitBlock | null = null;
    let currentContent: string[] = [];

    // Block pattern: # @block:id @kind:kind
    const blockPattern = /^#+\s+@block:(\S+)\s+@kind:(\S+)/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Check for header section (before first block or after ---)
      if (line.startsWith('# ') && !line.includes('@block:')) {
        inHeader = true;
      }

      // Check for block start
      const blockMatch = line.match(blockPattern);
      if (blockMatch) {
        // Save previous block
        if (currentBlock) {
          currentBlock.content = currentContent.join('\n').trim();
          blocks.push(currentBlock);
        }

        // Start new block
        currentBlock = {
          id: blockMatch[1],
          kind: blockMatch[2],
          content: '',
          line: lineNum,
        };
        currentContent = [];
        inBlock = true;
        inHeader = false;
      } else if (inBlock && currentBlock) {
        currentContent.push(line);
      } else if (!inBlock && !inHeader) {
        otherLines.push(line);
      }
    }

    // Save last block
    if (currentBlock) {
      currentBlock.content = currentContent.join('\n').trim();
      blocks.push(currentBlock);
    }

    // Extract header (first occurrence)
    const headerMatch = content.match(/^(# [^\n]+\n(?:---\n[\s\S]*?\n---)?)/);
    const header = headerMatch ? headerMatch[1] : '';

    return {
      header,
      blocks,
      otherContent: otherLines.join('\n'),
    };
  }

  /**
   * Calculate how many parts are needed
   */
  protected calculatePartCount(tokens: number): number {
    const maxTokens = this.config.max_tokens - this.config.budget_overhead;
    const parts = Math.ceil(tokens / maxTokens);
    return Math.max(1, Math.min(parts, 10)); // Cap at 10 parts
  }

  /**
   * Generate parent index content
   */
  protected generateParentIndex(
    parentPath: string,
    children: SplitFile[],
    metadata: Record<string, unknown>
  ): string {
    const parentId = metadata.id as string || this.pathToId(parentPath);
    const version = metadata.version as string || '1.0.0';

    // Generate children references
    const childrenRefs = children.map(child => {
      const childId = this.pathToId(child.path);
      return `  - @ref:${childId}`;
    }).join('\n');

    const short = metadata.short as string || `${parentId.split('/').pop()} (${children.length} sub-specs)`;

    // Generate header
    const headerLines = 10;
    const header = `# speclang-header lines:${headerLines}
id: ${parentId}
version: ${version}
children:
${childrenRefs}
short: "${short}"
---

This spec has been split. See ${path.basename(parentPath)}.dir/ for details.
`;

    return header;
  }

  /**
   * Generate child spec content
   */
  protected generateChildSpec(
    parentPath: string,
    childPath: string,
    content: string,
    part: number,
    totalParts: number,
    metadata: Record<string, unknown>,
    siblings?: { prev?: string; next?: string }
  ): string {
    const parentId = metadata.id as string || this.pathToId(parentPath);
    const childId = this.pathToId(childPath);
    const version = metadata.version as string || '1.0.0';

    // Build siblings section
    let siblingsSection = '';
    if (siblings?.prev || siblings?.next) {
      siblingsSection = '\nsiblings:';
      if (siblings.prev) {
        siblingsSection += `\n  prev: @ref:${this.pathToId(siblings.prev)}`;
      }
      if (siblings.next) {
        siblingsSection += `\n  next: @ref:${this.pathToId(siblings.next)}`;
      }
    }

    const headerLines = 8 + (siblingsSection ? 3 : 0);
    const header = `# speclang-header lines:${headerLines}
id: ${childId}
parent: @ref:${parentId}
part: ${part}/${totalParts}${siblingsSection}
short: "${this.generateShortDescription(content, part)}"
---

${content}
`;

    return header;
  }

  /**
   * Convert path to spec ID
   */
  protected pathToId(filePath: string): string {
    // Convert path like "specs/auth/login.spec.yaml" to "@specs/auth/login"
    const normalized = filePath
      .replace(/^specs\//, '')
      .replace(/\.spec\.(yaml|md|ts)$/, '')
      .replace(/\.dir\//, '.dir/');
    
    return `@${normalized}`;
  }

  /**
   * Generate short description from content
   */
  protected generateShortDescription(content: string, part: number): string {
    const firstLine = content.split('\n').find(line => line.trim().length > 0) || '';
    const cleaned = firstLine.replace(/^#+\s*/, '').substring(0, 50);
    return cleaned || `Part ${part}`;
  }
}

/**
 * Smart splitting strategy - groups related blocks together
 */
export class SmartSplitStrategy extends SplitStrategyBase {
  public split(
    specPath: string,
    content: string,
    metadata: Record<string, unknown>
  ): SplitResult {
    const { header, blocks, otherContent } = this.parseBlocks(content);
    const totalTokens = this.counter.count(content);

    // If under limit, no split needed
    if (totalTokens <= this.config.max_tokens) {
      return {
        split: false,
        originalPath: specPath,
        parent: {
          path: specPath,
          content,
          part: 1,
          totalParts: 1,
        },
        children: [],
        strategy: 'smart',
      };
    }

    // Group blocks into parts
    const parts = this.groupBlocks(blocks, otherContent, totalTokens);
    const totalParts = parts.length;

    // Generate directory path
    const dirPath = specPath.replace(/\.spec\.(yaml|md|ts)$/, '.spec.dir');

    // Generate children
    const children: SplitFile[] = parts.map((partContent, index) => {
      const partNum = index + 1;
      const childPath = `${dirPath}/part-${partNum}.spec.yaml`;

      // Determine siblings
      const siblings: { prev?: string; next?: string } = {};
      if (index > 0) {
        siblings.prev = `${dirPath}/part-${index}.spec.yaml`;
      }
      if (index < parts.length - 1) {
        siblings.next = `${dirPath}/part-${index + 2}.spec.yaml`;
      }

      return {
        path: childPath,
        content: this.generateChildSpec(
          specPath,
          childPath,
          partContent,
          partNum,
          totalParts,
          metadata,
          siblings
        ),
        part: partNum,
        totalParts,
      };
    });

    // Generate parent index
    const parentContent = this.generateParentIndex(specPath, children, metadata);

    return {
      split: true,
      originalPath: specPath,
      parent: {
        path: specPath,
        content: parentContent,
        part: 1,
        totalParts: 1,
      },
      children,
      strategy: 'smart',
    };
  }

  /**
   * Group blocks into balanced parts
   */
  private groupBlocks(blocks: SplitBlock[], otherContent: string, totalTokens: number): string[] {
    const maxTokens = this.config.max_tokens - this.config.budget_overhead;
    const parts: string[] = [];
    let currentPart: string[] = [];
    let currentTokens = 0;

    // Add non-block content to first part initially
    let remainingOther = otherContent;

    for (const block of blocks) {
      const blockTokens = this.counter.count(block.content);

      // If single block exceeds limit, split it
      if (blockTokens > maxTokens) {
        // Save current part
        if (currentPart.length > 0) {
          parts.push(currentPart.join('\n\n'));
          currentPart = [];
          currentTokens = 0;
        }

        // Split oversized block
        const blockParts = this.splitBlockContent(block.content, maxTokens);
        parts.push(...blockParts);
        continue;
      }

      // Check if adding block would exceed limit
      if (currentTokens + blockTokens > maxTokens && currentPart.length > 0) {
        // Save current part
        parts.push(currentPart.join('\n\n'));
        currentPart = [];
        currentTokens = 0;
      }

      // Add block to current part
      const blockText = `## @block:${block.id} @kind:${block.kind}\n${block.content}`;
      currentPart.push(blockText);
      currentTokens += blockTokens;
    }

    // Add remaining content
    if (currentPart.length > 0) {
      parts.push(currentPart.join('\n\n'));
    }

    return parts.length > 0 ? parts : [remainingOther];
  }

  /**
   * Split block content that exceeds limit
   */
  private splitBlockContent(content: string, maxTokens: number): string[] {
    const lines = content.split('\n');
    const parts: string[] = [];
    let currentPart: string[] = [];
    let currentTokens = 0;

    for (const line of lines) {
      const lineTokens = this.counter.count(line);

      if (currentTokens + lineTokens > maxTokens && currentPart.length > 0) {
        parts.push(currentPart.join('\n'));
        currentPart = [];
        currentTokens = 0;
      }

      currentPart.push(line);
      currentTokens += lineTokens;
    }

    if (currentPart.length > 0) {
      parts.push(currentPart.join('\n'));
    }

    return parts;
  }
}

/**
 * By-section splitting strategy - splits at section boundaries
 */
export class BySectionSplitStrategy extends SplitStrategyBase {
  public split(
    specPath: string,
    content: string,
    metadata: Record<string, unknown>
  ): SplitResult {
    const totalTokens = this.counter.count(content);

    // If under limit, no split needed
    if (totalTokens <= this.config.max_tokens) {
      return {
        split: false,
        originalPath: specPath,
        parent: {
          path: specPath,
          content,
          part: 1,
          totalParts: 1,
        },
        children: [],
        strategy: 'by-section',
      };
    }

    // Split by h2 headers (##)
    const sections = this.splitBySections(content);
    const dirPath = specPath.replace(/\.spec\.(yaml|md|ts)$/, '.spec.dir');
    const totalParts = sections.length;

    const children: SplitFile[] = sections.map((section, index) => {
      const partNum = index + 1;
      const childPath = `${dirPath}/section-${partNum}.spec.yaml`;

      const siblings: { prev?: string; next?: string } = {};
      if (index > 0) {
        siblings.prev = `${dirPath}/section-${index}.spec.yaml`;
      }
      if (index < sections.length - 1) {
        siblings.next = `${dirPath}/section-${index + 2}.spec.yaml`;
      }

      return {
        path: childPath,
        content: this.generateChildSpec(
          specPath,
          childPath,
          section,
          partNum,
          totalParts,
          metadata,
          siblings
        ),
        part: partNum,
        totalParts,
      };
    });

    const parentContent = this.generateParentIndex(specPath, children, metadata);

    return {
      split: true,
      originalPath: specPath,
      parent: {
        path: specPath,
        content: parentContent,
        part: 1,
        totalParts: 1,
      },
      children,
      strategy: 'by-section',
    };
  }

  /**
   * Split content by h2 headers
   */
  private splitBySections(content: string): string[] {
    const lines = content.split('\n');
    const sections: string[] = [];
    let currentSection: string[] = [];

    for (const line of lines) {
      // Check for h2 header (##)
      if (line.match(/^##\s+/)) {
        if (currentSection.length > 0) {
          sections.push(currentSection.join('\n'));
          currentSection = [];
        }
      }
      currentSection.push(line);
    }

    if (currentSection.length > 0) {
      sections.push(currentSection.join('\n'));
    }

    return sections.length > 0 ? sections : [content];
  }
}

/**
 * By-token splitting strategy - evenly splits by token count
 */
export class ByTokenSplitStrategy extends SplitStrategyBase {
  public split(
    specPath: string,
    content: string,
    metadata: Record<string, unknown>
  ): SplitResult {
    const totalTokens = this.counter.count(content);

    // If under limit, no split needed
    if (totalTokens <= this.config.max_tokens) {
      return {
        split: false,
        originalPath: specPath,
        parent: {
          path: specPath,
          content,
          part: 1,
          totalParts: 1,
        },
        children: [],
        strategy: 'by-token',
      };
    }

    // Calculate parts needed
    const partCount = this.calculatePartCount(totalTokens);
    const maxTokens = Math.ceil(totalTokens / partCount);

    // Split by tokens
    const parts = this.splitByTokens(content, partCount);
    const dirPath = specPath.replace(/\.spec\.(yaml|md|ts)$/, '.spec.dir');
    const totalParts = parts.length;

    const children: SplitFile[] = parts.map((partContent, index) => {
      const partNum = index + 1;
      const childPath = `${dirPath}/part-${partNum}.spec.yaml`;

      const siblings: { prev?: string; next?: string } = {};
      if (index > 0) {
        siblings.prev = `${dirPath}/part-${index}.spec.yaml`;
      }
      if (index < parts.length - 1) {
        siblings.next = `${dirPath}/part-${index + 2}.spec.yaml`;
      }

      return {
        path: childPath,
        content: this.generateChildSpec(
          specPath,
          childPath,
          partContent,
          partNum,
          totalParts,
          metadata,
          siblings
        ),
        part: partNum,
        totalParts,
      };
    });

    const parentContent = this.generateParentIndex(specPath, children, metadata);

    return {
      split: true,
      originalPath: specPath,
      parent: {
        path: specPath,
        content: parentContent,
        part: 1,
        totalParts: 1,
      },
      children,
      strategy: 'by-token',
    };
  }

  /**
   * Split content evenly by token count
   */
  private splitByTokens(content: string, partCount: number): string[] {
    const lines = content.split('\n');
    const parts: string[] = [];
    let currentPart: string[] = [];
    let currentTokens = 0;
    const targetTokens = this.counter.count(content) / partCount;

    for (const line of lines) {
      const lineTokens = this.counter.count(line);

      if (currentTokens + lineTokens > targetTokens && currentPart.length > 0) {
        parts.push(currentPart.join('\n'));
        currentPart = [];
        currentTokens = 0;
      }

      currentPart.push(line);
      currentTokens += lineTokens;
    }

    if (currentPart.length > 0) {
      parts.push(currentPart.join('\n'));
    }

    return parts.length > 0 ? parts : [content];
  }
}

/**
 * Create a split strategy by name
 */
export function createStrategy(strategy: SplitStrategy, config?: Partial<SplitConfig>): SplitStrategyBase {
  switch (strategy) {
    case 'smart':
      return new SmartSplitStrategy(config);
    case 'by-section':
      return new BySectionSplitStrategy(config);
    case 'by-token':
      return new ByTokenSplitStrategy(config);
    default:
      return new SmartSplitStrategy(config);
  }
}
