/**
 * SPECLANG-GENERATED: TypeScript target generator
 * Source: @speclang/codegen @block:typescript-generator
 */

import type { ITargetGenerator, CodeSpec, GeneratedFile, CodeBlock, TargetLanguage } from '../types';
import { mapType } from '../mapper';
import { createFileHeader, createFileFooter, renderTemplate, getTemplate } from '../templates';

// ============================================================================
// TYPESCRIPT GENERATOR
// ============================================================================

export class TypeScriptGenerator implements ITargetGenerator {
  language: TargetLanguage = 'typescript';
  extension = '.ts';
  
  /** Generate code from spec */
  generate(spec: CodeSpec): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    // If there's code content in blocks, generate from them
    const codeBlocks = spec.blocks.filter(b => b.kind === 'code' || b.content);
    
    if (codeBlocks.length > 0) {
      // Generate single file with all blocks
      const content = this.generateFromBlocks(spec, codeBlocks);
      const outputPath = this.getOutputPath(spec);
      
      files.push({
        path: outputPath,
        content,
        sourceBlock: codeBlocks.map(b => b.id).join(', '),
        language: 'typescript',
      });
    } else {
      // Generate from entity/operation blocks
      for (const block of spec.blocks) {
        const file = this.generateBlock(spec, block);
        if (file) {
          files.push(file);
        }
      }
    }
    
    // If no files generated, create empty placeholder
    if (files.length === 0) {
      files.push(this.generatePlaceholder(spec));
    }
    
    return files;
  }
  
  /** Generate from code blocks */
  private generateFromBlocks(spec: CodeSpec, blocks: CodeBlock[]): string {
    const header = this.fileHeader(spec);
    const parts: string[] = [header];
    
    // Add imports
    if (spec.imports.length > 0) {
      parts.push(this.formatImports(spec.imports));
      parts.push('');
    }
    
    // Add each block's content
    for (const block of blocks) {
      parts.push(`// Block: ${block.id}`);
      parts.push(block.content);
      parts.push('');
    }
    
    parts.push(this.fileFooter(spec));
    
    return parts.join('\n');
  }
  
  /** Generate a single block */
  private generateBlock(spec: CodeSpec, block: CodeBlock): GeneratedFile | null {
    let content = '';
    const outputPath = this.getBlockOutputPath(spec, block);
    
    switch (block.kind) {
      case 'interface':
        content = this.generateInterface(spec, block);
        break;
      case 'function':
        content = this.generateFunction(spec, block);
        break;
      case 'class':
        content = this.generateClass(spec, block);
        break;
      case 'type':
        content = this.generateType(spec, block);
        break;
      case 'entity':
        content = this.generateEntity(spec, block);
        break;
      case 'operation':
        content = this.generateOperation(spec, block);
        break;
      default:
        content = block.content;
    }
    
    return {
      path: outputPath,
      content,
      sourceBlock: block.id,
      language: 'typescript',
    };
  }
  
  /** Generate interface from block */
  private generateInterface(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('typescript', 'interface');
    if (!template) return block.content;
    
    // Parse interface content
    const nameMatch = block.content.match(/interface\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    // Extract fields from content
    const fieldsMatch = block.content.match(/\{([^}]+)\}/s);
    const fields = fieldsMatch ? this.parseInterfaceFields(fieldsMatch[1]) : [];
    
    return renderTemplate(template.content, {
      name,
      fields: fields.join('\n'),
    });
  }
  
  /** Parse interface fields from content */
  private parseInterfaceFields(content: string): string[] {
    const lines = content.split('\n').filter(l => l.trim());
    return lines.map(line => {
      const match = line.trim().match(/(\w+)(\??):\s*(.+)/);
      if (match) {
        return `  ${match[1]}${match[2]}: ${this.mapType(match[3].trim())};`;
      }
      return `  ${line.trim()}`;
    });
  }
  
  /** Generate function from block */
  private generateFunction(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('typescript', 'function');
    if (!template) return block.content;
    
    // Parse function signature
    const funcMatch = block.content.match(/(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\w+))?/);
    if (!funcMatch) return block.content;
    
    const [, name, paramsStr, returnType] = funcMatch;
    const params = this.parseParams(paramsStr);
    const returnT = returnType || 'void';
    
    return renderTemplate(template.content, {
      name,
      params: params.join(', '),
      return: this.mapType(returnT),
      body: '  // TODO: implement',
    });
  }
  
  /** Generate class from block */
  private generateClass(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('typescript', 'class');
    if (!template) return block.content;
    
    const classMatch = block.content.match(/class\s+(\w+)/);
    const name = classMatch ? classMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    return renderTemplate(template.content, {
      name,
      fields: '  // properties',
      methods: '  // methods',
    });
  }
  
  /** Generate type from block */
  private generateType(_spec: CodeSpec, block: CodeBlock): string {
    const template = getTemplate('typescript', 'type');
    if (!template) return block.content;
    
    const typeMatch = block.content.match(/type\s+(\w+)\s*=\s*(.+)/);
    if (!typeMatch) return block.content;
    
    return renderTemplate(template.content, {
      name: typeMatch[1],
      type: this.mapType(typeMatch[2].trim()),
    });
  }
  
  /** Generate entity as interface */
  private generateEntity(_spec: CodeSpec, block: CodeBlock): string {
    return this.generateInterface(_spec, { ...block, kind: 'interface' });
  }
  
  /** Generate operation as function */
  private generateOperation(_spec: CodeSpec, block: CodeBlock): string {
    return this.generateFunction(_spec, { ...block, kind: 'function' });
  }
  
  /** Generate placeholder file */
  private generatePlaceholder(spec: CodeSpec): GeneratedFile {
    return {
      path: this.getOutputPath(spec),
      content: `${this.fileHeader(spec)}\n\n// No code blocks found in spec\n`,
      sourceBlock: 'placeholder',
      language: 'typescript',
    };
  }
  
  /** Get output file path */
  private getOutputPath(spec: CodeSpec): string {
    const basePath = spec.target.outputPath || 'src/generated';
    const specId = spec.header.id.replace(/[@/]/g, '-');
    return `${basePath}/${specId}.ts`;
  }
  
  /** Get output path for a block */
  private getBlockOutputPath(spec: CodeSpec, block: CodeBlock): string {
    const basePath = spec.target.outputPath || 'src/generated';
    const blockName = block.id.replace(/[@/]/g, '-');
    return `${basePath}/${blockName}.ts`;
  }
  
  /** Parse parameters string */
  private parseParams(paramsStr: string): Array<{ name: string; type: string }> {
    if (!paramsStr.trim()) return [];
    
    return paramsStr.split(',').map(p => {
      const [name, type] = p.trim().split(':').map(s => s.trim());
      return { name, type: type || 'any' };
    });
  }
  
  /** Map stdlib type to TypeScript */
  mapType(stdlibType: string): string {
    return mapType(stdlibType, 'typescript');
  }
  
  /** Format imports for TypeScript */
  formatImports(imports: string[]): string {
    return imports
      .map(i => {
        const name = i.split('/').pop() || i;
        return `import { ${name} } from '${i}';`;
      })
      .join('\n');
  }
  
  /** Generate file header */
  fileHeader(spec: CodeSpec): string {
    return createFileHeader(spec, 'speclang-typescript-generator');
  }
  
  /** Generate file footer */
  fileFooter(_spec: CodeSpec): string {
    return createFileFooter(_spec);
  }
}
