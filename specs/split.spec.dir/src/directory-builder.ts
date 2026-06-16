/**
 * SPECLANG-GENERATED: Directory builder for .spec.dir/ structure
 * Source: @speclang/dynamic-split/strategy @block:split/dir-structure
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SplitFile } from './types';

/**
 * Build and manage .spec.dir/ directory structure
 */
export class DirectoryBuilder {
  /**
   * Create the directory structure for split specs
   */
  public static createDirStructure(parentPath: string): string {
    const dirPath = this.getDirPath(parentPath);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    return dirPath;
  }

  /**
   * Get the .spec.dir/ path from a parent spec path
   */
  public static getDirPath(parentPath: string): string {
    return parentPath.replace(/\.spec\.(yaml|md|ts)$/, '.spec.dir');
  }

  /**
   * Check if a directory is a spec split directory
   */
  public static isSpecDir(dirPath: string): boolean {
    return dirPath.endsWith('.spec.dir');
  }

  /**
   * Get parent spec path from a directory or child file path
   */
  public static getParentPath(inputPath: string): string | null {
    // Check if it's already a directory path
    let dirPath = inputPath;
    
    // If it's a file inside .spec.dir/, get the directory
    if (inputPath.includes('.spec.dir/')) {
      const match = inputPath.match(/(.+)\.spec\.dir\//);
      if (match) {
        dirPath = match[1] + '.spec.dir';
      }
    } else if (!inputPath.endsWith('.spec.dir')) {
      return null;
    }

    if (!this.isSpecDir(dirPath)) {
      return null;
    }

    const parentPath = dirPath.replace(/\.spec\.dir$/, '.spec.yaml');
    
    // Check if parent exists
    if (fs.existsSync(parentPath)) {
      return parentPath;
    }

    // Try .spec.md
    const parentPathMd = dirPath.replace(/\.spec\.dir$/, '.spec.md');
    if (fs.existsSync(parentPathMd)) {
      return parentPathMd;
    }

    // Return expected path even if it doesn't exist
    return parentPath;
  }

  /**
   * List all child specs in a directory
   */
  public static listChildren(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    const files = fs.readdirSync(dirPath);
    const specFiles = files
      .filter(f => f.match(/\.spec\.(yaml|md|ts)$/))
      .map(f => path.join(dirPath, f))
      .sort();

    return specFiles;
  }

  /**
   * Get all spec paths in a split directory (parent + children)
   */
  public static getAllSpecPaths(parentPath: string): string[] {
    const paths: string[] = [parentPath];

    const dirPath = this.getDirPath(parentPath);
    if (fs.existsSync(dirPath)) {
      const children = this.listChildren(dirPath);
      paths.push(...children);
    }

    return paths;
  }

  /**
   * Write a split file to disk
   */
  public static writeSplitFile(file: SplitFile): void {
    const dir = path.dirname(file.path);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(file.path, file.content, 'utf-8');
  }

  /**
   * Write multiple split files
   */
  public static writeSplitFiles(files: SplitFile[]): void {
    for (const file of files) {
      this.writeSplitFile(file);
    }
  }

  /**
   * Delete a split directory (for merging)
   */
  public static deleteDir(parentPath: string): void {
    const dirPath = this.getDirPath(parentPath);
    
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  /**
   * Check if split directory exists
   */
  public static dirExists(parentPath: string): boolean {
    const dirPath = this.getDirPath(parentPath);
    return fs.existsSync(dirPath);
  }

  /**
   * Get directory info
   */
  public static getDirInfo(parentPath: string): {
    exists: boolean;
    path: string;
    childCount: number;
    children: string[];
  } {
    const dirPath = this.getDirPath(parentPath);
    const exists = fs.existsSync(dirPath);
    
    if (!exists) {
      return {
        exists: false,
        path: dirPath,
        childCount: 0,
        children: [],
      };
    }

    const children = this.listChildren(dirPath);

    return {
      exists: true,
      path: dirPath,
      childCount: children.length,
      children,
    };
  }
}
