// speclang-header lines:20
// id: @generated/codegen-tools
// target: typescript
// produces: codegen.ts
// layer: 10
// refs: [@ref:specs/compiler]
// ---
// @block:codegen/main @kind:code
/**
 * Code Generation Tools
 * 
 * Generate code from spec files (.go.spec, .ts.spec, etc.)
 * 
 * Location: codegen.ts
 * Version: 0.1.0
 * 
 * Generated from @ref:specs/compiler
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

// ============================================================================
// Types
// ============================================================================

export interface CodeGenSpec {
  id: string;
  target: 'go' | 'typescript' | 'python' | 'rust' | 'java' | 'javascript';
  produces: string; // output file path
  layer: number;
  refs: string[];
  blocks: CodeBlock[];
}

export interface CodeBlock {
  id: string;
  kind: 'code' | 'entity' | 'operation';
  language?: string;
  content: string;
}

export interface CodeGenResult {
  success: boolean;
  outputPath: string;
  generatedCode: string;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Spec Parser
// ============================================================================

export class SpecParser {
  static async parseSpec(filePath: string): Promise<CodeGenSpec> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Parse header
    if (lines.length < 2 || !lines[1].includes('speclang-header')) {
      throw new Error('Invalid spec header');
    }
    
    const headerMatch = lines[1].match(/speclang-header lines:(\d+)/);
    if (!headerMatch) {
      throw new Error('Missing line count in header');
    }
    
    const headerLines = parseInt(headerMatch[1], 10);
    const headerContent = lines.slice(1, headerLines).join('\n');
    const yamlEnd = headerContent.indexOf('---');
    if (yamlEnd === -1) {
      throw new Error('Missing YAML separator');
    }
    
    const yamlText = headerContent.substring(0, yamlEnd);
    const metadata = yaml.parse(yamlText);
    
    // Parse blocks
    const blocks: CodeBlock[] = [];
    let currentBlock: Partial<CodeBlock> | null = null;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    
    for (let i = headerLines; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for block start
      const blockMatch = line.match(/^# @block:([^\s]+) @kind:([^\s]+)/);
      if (blockMatch) {
        // Save previous block
        if (currentBlock) {
          blocks.push({
            id: currentBlock.id!,
            kind: currentBlock.kind!,
            language: currentBlock.language,
            content: codeBlockContent.join('\n'),
          });
        }
        
        currentBlock = {
          id: blockMatch[1],
          kind: blockMatch[2] as any,
        };
        codeBlockContent = [];
        inCodeBlock = false;
        continue;
      }
      
      // Look for code block start ```
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          const language = line.trim().slice(3).trim() || undefined;
          currentBlock!.language = language;
          inCodeBlock = true;
        } else {
          inCodeBlock = false;
        }
        continue;
      }
      
      // Collect content
      if (currentBlock && inCodeBlock) {
        codeBlockContent.push(line);
      }
    }
    
    // Add last block
    if (currentBlock && codeBlockContent.length > 0) {
      blocks.push({
        id: currentBlock.id!,
        kind: currentBlock.kind!,
        language: currentBlock.language,
        content: codeBlockContent.join('\n'),
      });
    }
    
    return {
      id: metadata.id,
      target: metadata.target,
      produces: metadata.produces,
      layer: metadata.layer,
      refs: metadata.refs || [],
      blocks,
    };
  }
}

// ============================================================================
// Code Generators
// ============================================================================

export class GoCodeGenerator {
  static generate(block: CodeBlock): string {
    if (block.kind !== 'code') {
      return `// ${block.id} - ${block.kind}\n`;
    }
    
    // Add SPECLANG-ID comment if reference exists
    const specLangId = block.id.startsWith('@') ? block.id : `@ref:${block.id}`;
    return `// SPECLANG-ID: ${specLangId}\n${block.content}\n`;
  }
}

export class TypeScriptCodeGenerator {
  static generate(block: CodeBlock): string {
    if (block.kind !== 'code') {
      return `// ${block.id} - ${block.kind}\n`;
    }
    
    const specLangId = block.id.startsWith('@') ? block.id : `@ref:${block.id}`;
    return `// SPECLANG-ID: ${specLangId}\n${block.content}\n`;
  }
}

export class PythonCodeGenerator {
  static generate(block: CodeBlock): string {
    if (block.kind !== 'code') {
      return `# ${block.id} - ${block.kind}\n`;
    }
    
    const specLangId = block.id.startsWith('@') ? block.id : `@ref:${block.id}`;
    return `# SPECLANG-ID: ${specLangId}\n${block.content}\n`;
  }
}

// ============================================================================
// Main Code Generator
// ============================================================================

export class CodeGenerator {
  static async generateFromSpec(specFilePath: string): Promise<CodeGenResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const spec = await SpecParser.parseSpec(specFilePath);
      
      // Select generator based on target
      let generator: (block: CodeBlock) => string;
      switch (spec.target) {
        case 'go':
          generator = GoCodeGenerator.generate;
          break;
        case 'typescript':
        case 'javascript':
          generator = TypeScriptCodeGenerator.generate;
          break;
        case 'python':
          generator = PythonCodeGenerator.generate;
          break;
        default:
          throw new Error(`Unsupported target language: ${spec.target}`);
      }
      
      // Generate code from blocks
      const generatedCode = spec.blocks
        .map(block => generator(block))
        .join('\n');
      
      // Ensure output directory exists
      const outputDir = path.dirname(spec.produces);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write generated code
      await fs.writeFile(spec.produces, generatedCode, 'utf-8');
      
      return {
        success: true,
        outputPath: spec.produces,
        generatedCode,
        errors,
        warnings,
      };
      
    } catch (error: any) {
      errors.push(error.message);
      return {
        success: false,
        outputPath: '',
        generatedCode: '',
        errors,
        warnings,
      };
    }
  }
  
  static async generateAll(specDir: string = 'specs'): Promise<CodeGenResult[]> {
    const results: CodeGenResult[] = [];
    
    // Find all .spec files with target extensions
    const specFiles = await this.findSpecFiles(specDir);
    
    for (const file of specFiles) {
      const result = await this.generateFromSpec(file);
      results.push(result);
    }
    
    return results;
  }
  
  private static async findSpecFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function walk(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.name.match(/\.(go|ts|py|rs|js)\.spec$/)) {
          files.push(fullPath);
        }
      }
    }
    
    await walk(dir);
    return files;
  }
}

// ============================================================================
// CLI Interface (optional)
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  async function main() {
    if (args.length === 0) {
      console.log('Usage: ts-node codegen.ts <spec-file>');
      console.log('       ts-node codegen.ts --all');
      process.exit(1);
    }
    
    if (args[0] === '--all') {
      const results = await CodeGenerator.generateAll();
      let success = 0;
      let failure = 0;
      
      for (const result of results) {
        if (result.success) {
          success++;
          console.log(`✓ Generated: ${result.outputPath}`);
        } else {
          failure++;
          console.log(`✗ Failed: ${result.errors.join(', ')}`);
        }
      }
      
      console.log(`\nSummary: ${success} succeeded, ${failure} failed`);
      process.exit(failure > 0 ? 1 : 0);
    } else {
      const result = await CodeGenerator.generateFromSpec(args[0]);
      if (result.success) {
        console.log(`✓ Generated: ${result.outputPath}`);
        process.exit(0);
      } else {
        console.log(`✗ Failed: ${result.errors.join(', ')}`);
        process.exit(1);
      }
    }
  }
  
  main().catch(console.error);
}