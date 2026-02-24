/**
 * Gitignore pattern matching for file watching
 * 
 * Generated from: @speclang/daemon/events
 * 
 * Supports:
 * - Standard .gitignore patterns
 * - Negation patterns (!prefix)
 * - Directory patterns (ending with /)
 * - Wildcard patterns (* and **)
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export class Gitignore {
  private patterns: Array<{ pattern: RegExp; negated: boolean; isDir: boolean }>;
  private negatedPatterns: Array<{ pattern: RegExp; isDir: boolean }>;

  constructor() {
    this.patterns = [];
    this.negatedPatterns = [];
  }

  /**
   * Create Gitignore from file path
   */
  static async fromFile(filePath: string): Promise<Gitignore> {
    const gitignore = new Gitignore();
    
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return gitignore;
      }
      
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          gitignore.add(trimmed);
        }
      }
    } catch (error) {
      // Ignore errors, return empty gitignore
    }
    
    return gitignore;
  }

  /**
   * Create Gitignore from string content
   */
  static fromContent(content: string): Gitignore {
    const gitignore = new Gitignore();
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        gitignore.add(trimmed);
      }
    }
    
    return gitignore;
  }

  /**
   * Add a pattern
   */
  add(pattern: string): Gitignore {
    const isNegated = pattern.startsWith('!');
    const cleanPattern = isNegated ? pattern.slice(1) : pattern;
    const isDir = cleanPattern.endsWith('/');
    const patternStr = isDir ? cleanPattern.slice(0, -1) : cleanPattern;
    
    const regex = this.patternToRegex(patternStr);
    
    if (isNegated) {
      this.negatedPatterns.push({ pattern: regex, isDir });
    } else {
      this.patterns.push({ pattern: regex, negated: false, isDir });
    }
    
    return this;
  }

  /**
   * Check if a path should be ignored
   */
  isIgnored(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    
    // Check each part of the path
    for (let i = 0; i < parts.length; i++) {
      const partialPath = parts.slice(0, i + 1).join('/');
      
      // Check positive patterns
      for (const { pattern, isDir } of this.patterns) {
        if (isDir) {
          // Directory pattern - check if any parent matches
          if (pattern.test(partialPath + '/') || pattern.test(partialPath)) {
            // Check if negated by a later pattern
            if (!this.isNegated(partialPath)) {
              return true;
            }
          }
        } else {
          if (pattern.test(partialPath)) {
            if (!this.isNegated(partialPath)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Check if path is explicitly negated
   */
  private isNegated(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    for (const { pattern, isDir } of this.negatedPatterns) {
      if (isDir) {
        if (pattern.test(normalizedPath + '/') || pattern.test(normalizedPath)) {
          return true;
        }
      } else {
        if (pattern.test(normalizedPath)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Convert gitignore pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    let regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/{{GLOBSTAR}}/g, '.*')
      .replace(/\?/g, '[^/]');
    
    // Handle **/ prefix (matches anything before)
    if (regexStr.startsWith('.*/')) {
      regexStr = '.*/' + regexStr.slice(3);
    }
    
    // Handle /** suffix (matches anything after)
    if (regexStr.endsWith('/.*')) {
      regexStr = regexStr.slice(0, -3) + '(/.*)?';
    }
    
    return new RegExp(`^${regexStr}$`);
  }
}
