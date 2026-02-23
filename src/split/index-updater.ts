/**
 * SPECLANG-GENERATED: Index updater for parent spec
 * Source: @speclang/dynamic-split/strategy @block:split/result
 */

import * as fs from 'fs';
import type { SplitFile, SplitResult } from './types';

/**
 * Update the parent index file after splitting
 */
export class IndexUpdater {
  /**
   * Update parent spec to be an index file
   */
  public static updateParent(result: SplitResult): void {
    // Write parent file
    fs.writeFileSync(result.parent.path, result.parent.content, 'utf-8');
  }

  /**
   * Create index content for parent
   */
  public static createIndexContent(
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

    const childCount = children.length;
    const short = metadata.short as string || 
      `${parentId.split('/').pop()} (${childCount} sub-specs)`;

    const headerLines = 10;
    return `# speclang-header lines:${headerLines}
id: ${parentId}
version: ${version}
children:
${childrenRefs}
short: "${short}"
---

This spec has been split. See ${this.getDirName(parentPath)}/ for details.
`;
  }

  /**
   * Convert path to spec ID
   */
  private static pathToId(filePath: string): string {
    const normalized = filePath
      .replace(/^specs\//, '')
      .replace(/\.spec\.(yaml|md|ts)$/, '')
      .replace(/\.dir\//, '.dir/');
    
    return `@${normalized}`;
  }

  /**
   * Get directory name from path
   */
  private static getDirName(filePath: string): string {
    return filePath.replace(/\.spec\.(yaml|md|ts)$/, '').split('/').pop() || '';
  }

  /**
   * Read current parent content
   */
  public static readParent(parentPath: string): string {
    if (!fs.existsSync(parentPath)) {
      throw new Error(`Parent file not found: ${parentPath}`);
    }
    return fs.readFileSync(parentPath, 'utf-8');
  }

  /**
   * Extract metadata from parent
   */
  public static extractParentMetadata(content: string): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    // Extract id
    const idMatch = content.match(/^id:\s*(.+)$/m);
    if (idMatch) {
      metadata.id = idMatch[1].trim();
    }

    // Extract version
    const versionMatch = content.match(/^version:\s*(.+)$/m);
    if (versionMatch) {
      metadata.version = versionMatch[1].trim();
    }

    // Extract short
    const shortMatch = content.match(/^short:\s*(.+)$/m);
    if (shortMatch) {
      metadata.short = shortMatch[1].trim();
    }

    // Extract children
    const childrenMatch = content.match(/children:\s*([\s\S]*?)(?:^---)/m);
    if (childrenMatch) {
      const children: string[] = [];
      const refMatches = Array.from(childrenMatch[1].matchAll(/@ref:([^\s]+)/g));
      for (const match of refMatches) {
        children.push(match[1]);
      }
      metadata.children = children;
    }

    return metadata;
  }

  /**
   * Check if parent is an index file
   */
  public static isIndexFile(parentPath: string): boolean {
    if (!fs.existsSync(parentPath)) {
      return false;
    }

    const content = fs.readFileSync(parentPath, 'utf-8');
    return content.includes('children:') && content.includes('This spec has been split');
  }

  /**
   * Get all index files in specs directory
   */
  public static findIndexFiles(specsDir: string): string[] {
    if (!fs.existsSync(specsDir)) {
      return [];
    }

    const indexFiles: string[] = [];
    const entries = fs.readdirSync(specsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.spec.yaml')) {
        const filePath = `${specsDir}/${entry.name}`;
        if (this.isIndexFile(filePath)) {
          indexFiles.push(filePath);
        }
      } else if (entry.isDirectory() && entry.name.endsWith('.spec.dir')) {
        // Check parent
        const parentPath = filePathToSpecPath(`${specsDir}/${entry.name}`);
        if (parentPath && this.isIndexFile(parentPath)) {
          indexFiles.push(parentPath);
        }
      }
    }

    return indexFiles;
  }
}

/**
 * Convert directory path to spec path
 */
function filePathToSpecPath(dirPath: string): string | null {
  return dirPath.replace(/\.spec\.dir$/, '.spec.yaml');
}
