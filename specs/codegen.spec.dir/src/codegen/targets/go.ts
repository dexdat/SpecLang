/**
 * SPECLANG-GENERATED: Go target generator
 * Source: @speclang/codegen @block:go-generator
 */

import type { ITargetGenerator, CodeSpec, GeneratedFile, CodeBlock, TargetLanguage } from '../types';
import { mapType } from '../mapper';
import { createFileHeader, createFileFooter, renderTemplate, getTemplate } from '../templates';

// ============================================================================
// GO GENERATOR
// ============================================================================

export class GoGenerator implements ITargetGenerator {
  language: TargetLanguage = 'go';
  extension = '.go';
  
  /** Generate code from spec */
  generate(spec: CodeSpec): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    const codeBlocks = spec.blocks.filter(b => b.kind === 'code' || b.content);
    
    if (codeBlocks.length > 0) {
      const content = this.generateFromBlocks(spec, codeBlocks);
      const outputPath = this.getOutputPath(spec);
      
      files.push({
        path: outputPath,
        content,
        sourceBlock: codeBlocks.map(b => b.id).join(', '),
        language: 'go',
      });
    } else {
      for (const block of spec.blocks) {
        const file = this.generateBlock(spec, block);
        if (file) {
          files.push(file);
        }
      }
    }
    
    if (files.length === 0) {
      files.push(this.generatePlaceholder(spec));
    }
    
    return files;
  }
  
  /** Generate from code blocks */
  private generateFromBlocks(spec: CodeSpec, blocks: CodeBlock[]): string {
    const header = this.fileHeader(spec);
    const parts: string[] = [header, '', 'package main', ''];
    
    // Add imports
    if (spec.imports.length > 0) {
      parts.push('import (');
      for (const imp of spec.imports) {
        parts.push(`  "${imp}"`);
      }
      parts.push(')', '');
    }
    
    // Add each block's content
    for (const block of blocks) {
      parts.push(`// Block: ${block.id}`);
      parts.push(this.convertToGo(block.content));
      parts.push('');
    }
    
    parts.push(this.fileFooter(spec));
    
    return parts.join('\n');
  }
  
  /** Convert TypeScript-like content to Go */
  private convertToGo(content: string): string {
    let result = content;
    
    // Convert interface to struct
    result = result.replace(/interface\s+(\w+)/g, 'type $1 struct');
    result = result.replace(/(\w+)(\??):\s*(\w+)/g, this.goFieldMapper.bind(this));
    
    // Convert function to func
    result = result.replace(/function\s+(\w+)/g, 'func $1');
    result = result.replace(/async\s+/g, '');
    
    // Convert types
    result = result.replace(/\bstring\b/g, 'string');
    result = result.replace(/\bnumber\b/g, 'int');
    result = result.replace(/\bboolean\b/g, 'bool');
    result = result.replace(/\bany\b/g, 'interface{}');
    result = result.replace(/\bDate\b/g, 'time.Time');
    result = result.replace(/\bArray<(\w+)>/g, '[]$1');
    result = result.replace(/\bRecord<(\w+),\s*(\w+)>/g, 'map[$1]$2');
    
    return result;
  }
  
  /** Map field to Go format */
  private goFieldMapper(_match: string, _p1: string, _p2: string, _p3: string): string {
    // Simplified field mapping
    return 'Field string `json:"field"`';
  }
  
  /** Generate a single block */
  private generateBlock(spec: CodeSpec, block: CodeBlock): GeneratedFile | null {
    let content = '';
    const outputPath = this.getBlockOutputPath(spec, block);
    
    switch (block.kind) {
      case 'struct':
        content = this.generateStruct(spec, block);
        break;
      case 'function':
        content = this.generateFunc(spec, block);
        break;
      case 'interface':
        content = this.generateInterface(spec, block);
        break;
      case 'entity':
        content = this.generateStruct(spec, block);
        break;
      case 'operation':
        content = this.generateFunc(spec, block);
        break;
      default:
        content = this.convertToGo(block.content);
    }
    
    return {
      path: outputPath,
      content,
      sourceBlock: block.id,
      language: 'go',
    };
  }
  
  /** Generate struct from block */
  private generateStruct(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('go', 'struct');
    if (!template) return block.content;
    
    const nameMatch = block.content.match(/struct\s+(\w+)|type\s+(\w+)\s+struct/);
    const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : block.id.split('/').pop() || 'Unknown';
    
    return renderTemplate(template.content, {
      name,
      fields: '  // fields',
    });
  }
  
  /** Generate function from block */
  private generateFunc(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('go', 'func');
    if (!template) return block.content;
    
    const funcMatch = block.content.match(/func(?:tion)?\s+(\w+)/);
    const name = funcMatch ? funcMatch[1] : block.id.split('/').pop() || 'unknown';
    
    return renderTemplate(template.content, {
      name,
      params: '',
      return: '',
      body: '  // TODO: implement',
    });
  }
  
  /** Generate interface from block */
  private generateInterface(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('go', 'interface');
    if (!template) return block.content;
    
    const nameMatch = block.content.match(/interface\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    return renderTemplate(template.content, {
      name,
      methods: '  // methods',
    });
  }
  
  /** Generate placeholder file */
  private generatePlaceholder(spec: CodeSpec): GeneratedFile {
    return {
      path: this.getOutputPath(spec),
      content: `${this.fileHeader(spec)}\n\npackage main\n\n// No code blocks found in spec\n`,
      sourceBlock: 'placeholder',
      language: 'go',
    };
  }
  
  /** Get output file path */
  private getOutputPath(spec: CodeSpec): string {
    const basePath = spec.target.outputPath || 'src/generated';
    const specId = spec.header.id.replace(/[@/]/g, '-');
    return `${basePath}/${specId}.go`;
  }
  
  /** Get output path for a block */
  private getBlockOutputPath(spec: CodeSpec, block: CodeBlock): string {
    const basePath = spec.target.outputPath || 'src/generated';
    const blockName = block.id.replace(/[@/]/g, '-');
    return `${basePath}/${blockName}.go`;
  }
  
  /** Map stdlib type to Go */
  mapType(stdlibType: string): string {
    return mapType(stdlibType, 'go');
  }
  
  /** Format imports for Go */
  formatImports(imports: string[]): string {
    if (imports.length === 0) return '';
    if (imports.length === 1) {
      return `import "${imports[0]}"`;
    }
    
    const lines = ['import ('];
    for (const imp of imports) {
      lines.push(`  "${imp}"`);
    }
    lines.push(')');
    return lines.join('\n');
  }
  
  /** Generate file header */
  fileHeader(spec: CodeSpec): string {
    return createFileHeader(spec, 'speclang-go-generator');
  }
  
  /** Generate file footer */
  fileFooter(_spec: CodeSpec): string {
    return createFileFooter(_spec);
  }
}
