/**
 * SPECLANG-GENERATED: Rust target generator
 * Source: @speclang/codegen @block:rust-generator
 */

import type { ITargetGenerator, CodeSpec, GeneratedFile, CodeBlock, TargetLanguage } from '../types';
import { mapType } from '../mapper';
import { createFileHeader, createFileFooter, renderTemplate, getTemplate } from '../templates';

// ============================================================================
// RUST GENERATOR
// ============================================================================

export class RustGenerator implements ITargetGenerator {
  language: TargetLanguage = 'rust';
  extension = '.rs';
  
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
        language: 'rust',
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
    const parts: string[] = [header, ''];
    
    // Add imports
    if (spec.imports.length > 0) {
      for (const imp of spec.imports) {
        parts.push(`use ${imp};`);
      }
      parts.push('');
    }
    
    // Add each block's content
    for (const block of blocks) {
      parts.push(`// Block: ${block.id}`);
      parts.push(this.convertToRust(block.content));
      parts.push('');
    }
    
    parts.push(this.fileFooter(spec));
    
    return parts.join('\n');
  }
  
  /** Convert TypeScript-like content to Rust */
  private convertToRust(content: string): string {
    let result = content;
    
    // Convert interface to struct
    result = result.replace(/interface\s+(\w+)/g, 'pub struct $1');
    
    // Convert class to struct with impl
    result = result.replace(/class\s+(\w+)/g, 'pub struct $1');
    
    // Convert function
    result = result.replace(/(?:async\s+)?function\s+(\w+)/g, 'pub fn $1');
    result = result.replace(/async\s+fn/g, 'pub async fn');
    
    // Convert types
    result = result.replace(/\bstring\b/g, 'String');
    result = result.replace(/\bnumber\b/g, 'i32');
    result = result.replace(/\bboolean\b/g, 'bool');
    result = result.replace(/\bany\b/g, 'serde_json::Value');
    result = result.replace(/\bDate\b/g, 'chrono::NaiveDate');
    result = result.replace(/\bArray<(\w+)>/g, 'Vec<$1>');
    result = result.replace(/\bRecord<(\w+),\s*(\w+)>/g, 'HashMap<$1, $2>');
    
    // Convert arrow return type
    result = result.replace(/\)\s*:\s*(\w+)/g, ') -> $1');
    
    // Convert export
    result = result.replace(/export\s+/g, '');
    
    return result;
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
        content = this.generateFunction(spec, block);
        break;
      default:
        if (block.kind === 'impl') {
          content = this.generateImpl(spec, block);
        } else if (block.kind === 'enum') {
          content = this.generateEnum(spec, block);
        } else if (block.kind === 'entity') {
          content = this.generateStruct(spec, block);
        } else if (block.kind === 'operation') {
          content = this.generateFunction(spec, block);
        } else {
          content = this.convertToRust(block.content);
        }
    }
    
    return {
      path: outputPath,
      content,
      sourceBlock: block.id,
      language: 'rust',
    };
  }
  
  /** Generate struct from block */
  private generateStruct(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('rust', 'struct');
    if (!template) return block.content;
    
    const nameMatch = block.content.match(/(?:pub\s+)?struct\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    return renderTemplate(template.content, {
      name,
      fields: '    // fields',
    });
  }
  
  /** Generate function from block */
  private generateFunction(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('rust', 'function');
    if (!template) return block.content;
    
    const funcMatch = block.content.match(/(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/);
    const name = funcMatch ? funcMatch[1] : block.id.split('/').pop() || 'unknown';
    
    return renderTemplate(template.content, {
      name,
      params: '',
      return: '()',
      body: '    todo!()',
    });
  }
  
  /** Generate impl block */
  private generateImpl(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('rust', 'impl');
    if (!template) return block.content;
    
    const implMatch = block.content.match(/impl\s+(\w+)/);
    const name = implMatch ? implMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    return renderTemplate(template.content, {
      name,
      methods: '    // methods',
    });
  }
  
  /** Generate enum from block */
  private generateEnum(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('rust', 'enum');
    if (!template) return block.content;
    
    const enumMatch = block.content.match(/enum\s+(\w+)/);
    const name = enumMatch ? enumMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    return renderTemplate(template.content, {
      name,
      variants: '    // variants',
    });
  }
  
  /** Generate placeholder file */
  private generatePlaceholder(spec: CodeSpec): GeneratedFile {
    return {
      path: this.getOutputPath(spec),
      content: `${this.fileHeader(spec)}\n\n// No code blocks found in spec\n`,
      sourceBlock: 'placeholder',
      language: 'rust',
    };
  }
  
  /** Get output file path */
  private getOutputPath(spec: CodeSpec): string {
    const basePath = spec.target.outputPath || 'src/generated';
    const specId = spec.header.id.replace(/[@/]/g, '-');
    return `${basePath}/${specId}.rs`;
  }
  
  /** Get output path for a block */
  private getBlockOutputPath(spec: CodeSpec, block: CodeBlock): string {
    const basePath = spec.target.outputPath || 'src/generated';
    const blockName = block.id.replace(/[@/]/g, '-');
    return `${basePath}/${blockName}.rs`;
  }
  
  /** Map stdlib type to Rust */
  mapType(stdlibType: string): string {
    return mapType(stdlibType, 'rust');
  }
  
  /** Format imports for Rust */
  formatImports(imports: string[]): string {
    return imports.map(i => `use ${i};`).join('\n');
  }
  
  /** Generate file header */
  fileHeader(spec: CodeSpec): string {
    return createFileHeader(spec, 'speclang-rust-generator');
  }
  
  /** Generate file footer */
  fileFooter(_spec: CodeSpec): string {
    return createFileFooter(_spec);
  }
}
