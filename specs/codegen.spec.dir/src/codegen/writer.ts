/**
 * SPECLANG-GENERATED: File writer for codegen
 * Source: @speclang/codegen @block:writer
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GeneratedFile, WriteResult } from './types';

// ============================================================================
// CODE WRITER
// ============================================================================

export class CodeWriter {
  /** Write generated files to disk */
  write(files: GeneratedFile[], options?: { dryRun?: boolean; backup?: boolean }): WriteResult {
    const result: WriteResult = {
      written: [],
      skipped: [],
      errors: [],
    };
    
    const dryRun = options?.dryRun ?? false;
    const backup = options?.backup ?? true;
    
    for (const file of files) {
      try {
        // Ensure directory exists
        const dir = path.dirname(file.path);
        if (!dryRun && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Check if file exists and should be backed up
        if (!dryRun && backup && fs.existsSync(file.path)) {
          const backupPath = this.backup(file.path);
          if (backupPath) {
            console.log(`Backed up: ${file.path} -> ${backupPath}`);
          }
        }
        
        // Write file
        if (!dryRun) {
          fs.writeFileSync(file.path, file.content, 'utf-8');
        }
        
        result.written.push(file.path);
      } catch (error) {
        result.errors.push({
          file: file.path,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return result;
  }
  
  /** Update file with SPECLANG-ID markers for incremental updates */
  updateWithMarkers(filepath: string, blocks: Array<{ id: string; content: string }>): void {
    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    let updatedContent = content;
    
    for (const block of blocks) {
      const markerStart = `// SPECLANG-BLOCK:START:${block.id}`;
      const markerEnd = `// SPECLANG-BLOCK:END:${block.id}`;
      
      // Check if block exists in file
      if (updatedContent.includes(markerStart)) {
        // Replace existing block
        const startIdx = updatedContent.indexOf(markerStart);
        const endIdx = updatedContent.indexOf(markerEnd);
        
        if (startIdx !== -1 && endIdx !== -1) {
          const before = updatedContent.substring(0, startIdx);
          const after = updatedContent.substring(endIdx + markerEnd.length);
          updatedContent = before + markerStart + '\n' + block.content + '\n' + markerEnd + after;
        }
      } else {
        // Append new block
        updatedContent += `\n// SPECLANG-BLOCK:START:${block.id}\n${block.content}\n// SPECLANG-BLOCK:END:${block.id}\n`;
      }
    }
    
    fs.writeFileSync(filepath, updatedContent, 'utf-8');
  }
  
  /** Backup a file before overwriting */
  backup(filepath: string): string | null {
    if (!fs.existsSync(filepath)) {
      return null;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(filepath);
    const base = path.basename(filepath, ext);
    const dir = path.dirname(filepath);
    const backupPath = path.join(dir, `${base}.backup${timestamp}${ext}`);
    
    fs.copyFileSync(filepath, backupPath);
    return backupPath;
  }
  
  /** Check if file has changed since last write */
  hasChanged(filepath: string, newContent: string): boolean {
    if (!fs.existsSync(filepath)) {
      return true;
    }
    
    const existingContent = fs.readFileSync(filepath, 'utf-8');
    return existingContent !== newContent;
  }
  
  /** Read existing file content */
  readFile(filepath: string): string | null {
    if (!fs.existsSync(filepath)) {
      return null;
    }
    return fs.readFileSync(filepath, 'utf-8');
  }
  
  /** Delete a file */
  deleteFile(filepath: string): boolean {
    if (!fs.existsSync(filepath)) {
      return false;
    }
    
    fs.unlinkSync(filepath);
    return true;
  }
  
  /** List files in directory */
  listFiles(dir: string, extension?: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
      .filter(e => e.isFile())
      .filter(e => !extension || e.name.endsWith(extension))
      .map(e => path.join(dir, e.name));
  }
}

// Export singleton instance
export const codeWriter = new CodeWriter();
