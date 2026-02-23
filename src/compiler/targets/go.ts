/**
 * SPECLANG-GENERATED: Go target generator
 * Source: @speclang/compiler.spec.dir/go
 */

import type { CodeSpec, GeneratedFile, CodeBlock } from '../../codegen/types';
import { mapGoType } from '../go/types';
import { GO_TEMPLATES, renderGoTemplate } from '../go/templates';
import { isStdlibPackage, isBuiltinType } from '../go/builtins';

export interface GoField {
  name: string;
  type: string;
  jsonName?: string;
  optional?: boolean;
}

export interface GoGeneratorConfig {
  packageName?: string;
  addJsonTags?: boolean;
  addGormTags?: boolean;
}

export class GoGenerator {
  language = 'go';
  extension = '.go';

  private imports: Set<string> = new Set();
  private config: GoGeneratorConfig;

  constructor(config: GoGeneratorConfig = {}) {
    this.config = {
      addJsonTags: true,
      addGormTags: false,
      ...config,
    };
  }

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

  private generateFromBlocks(spec: CodeSpec, blocks: CodeBlock[]): string {
    const header = this.fileHeader(spec.header.id, spec.target.outputPath || 'main');
    const parts: string[] = [header];

    const imports = this.formatImports();
    if (imports) {
      parts.push(imports);
      parts.push('');
    }

    for (const block of blocks) {
      parts.push(`// Block: ${block.id}`);
      parts.push(block.content);
      parts.push('');
    }

    parts.push(this.fileFooter());

    return parts.join('\n');
  }

  private generateBlock(spec: CodeSpec, block: CodeBlock): GeneratedFile | null {
    let content = '';
    const outputPath = this.getBlockOutputPath(spec, block);

    switch (block.kind) {
      case 'struct':
      case 'entity':
        content = this.generateStructFromBlock(block);
        break;
      case 'interface':
        content = this.generateInterfaceFromBlock(block);
        break;
      case 'function':
      case 'operation':
        content = this.generateFunctionFromBlock(block);
        break;
      case 'enum':
        content = this.generateEnumFromBlock(block);
        break;
      default:
        content = block.content;
    }

    return {
      path: outputPath,
      content,
      sourceBlock: block.id,
      language: 'go',
    };
  }

  private generateStructFromBlock(block: CodeBlock): string {
    const nameMatch = block.content.match(/type\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    return `type ${name} struct {\n  // TODO: add fields\n}\n`;
  }

  private generateInterfaceFromBlock(block: CodeBlock): string {
    const nameMatch = block.content.match(/type\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    return `type ${name} interface {\n  // TODO: add methods\n}\n`;
  }

  private generateFunctionFromBlock(block: CodeBlock): string {
    const nameMatch = block.content.match(/func(?:tion)?\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    return `func ${name}() {\n  // TODO: implement\n}\n`;
  }

  private generateEnumFromBlock(block: CodeBlock): string {
    const nameMatch = block.content.match(/type\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    return `type ${name} int\n\nconst (\n  ${name}Unknown ${name} = iota\n)\n`;
  }

  private generatePlaceholder(spec: CodeSpec): GeneratedFile {
    return {
      path: this.getOutputPath(spec),
      content: `${this.fileHeader(spec.header.id, spec.target.outputPath || 'main')}\n\n// No code blocks found in spec\n`,
      sourceBlock: 'placeholder',
      language: 'go',
    };
  }

  private getOutputPath(spec: CodeSpec): string {
    const basePath = spec.target.outputPath || 'src/generated';
    const specId = spec.header.id.replace(/[@/]/g, '-');
    return `${basePath}/${specId}.go`;
  }

  private getBlockOutputPath(spec: CodeSpec, block: CodeBlock): string {
    const basePath = spec.target.outputPath || 'src/generated';
    const blockName = block.id.replace(/[@/]/g, '-');
    return `${basePath}/${blockName}.go`;
  }

  generateStruct(name: string, fields: GoField[]): string {
    this.imports.clear();

    const fieldLines = fields.map((f) => {
      const { type, imports } = mapGoType(f.type);
      imports.forEach((i) => this.imports.add(i));

      let tag = '';
      if (this.config.addJsonTags) {
        const jsonName = f.jsonName || this.toSnakeCase(f.name);
        tag = GO_TEMPLATES.jsonTag
          .replace('{{name}}', jsonName)
          .replace('{{omitempty}}', f.optional ? ',omitempty' : '');
      }

      const fieldName = this.toPascalCase(f.name);
      return renderGoTemplate(GO_TEMPLATES.field, {
        name: fieldName,
        type,
        tag,
      });
    });

    return renderGoTemplate(GO_TEMPLATES.struct, {
      name: this.toPascalCase(name),
      fields: fieldLines.join('\n'),
    });
  }

  generateInterface(
    name: string,
    methods: Array<{ name: string; params: string; returns: string }>
  ): string {
    this.imports.clear();

    const methodLines = methods.map((m) => {
      return renderGoTemplate(GO_TEMPLATES.interfaceMethod, {
        name: this.toPascalCase(m.name),
        params: m.params,
        returns: m.returns,
      });
    });

    return renderGoTemplate(GO_TEMPLATES.interface, {
      name: this.toPascalCase(name),
      methods: methodLines.join('\n'),
    });
  }

  generateFunction(
    name: string,
    params: string,
    returns: string,
    body: string,
    receiver?: string
  ): string {
    this.imports.clear();

    const funcName = this.toCamelCase(name);
    const receiverStr = receiver
      ? renderGoTemplate(GO_TEMPLATES.receiver, {
          type: receiver,
        })
      : '';

    return renderGoTemplate(GO_TEMPLATES.function, {
      receiver: receiverStr,
      name: funcName,
      params,
      returns,
      body,
    });
  }

  generateEnum(
    name: string,
    values: string[]
  ): string {
    this.imports.clear();

    const firstValue = this.toUpperSnakeCase(values[0]);
    const otherValues = values
      .slice(1)
      .map((v) => `    ${this.toUpperSnakeCase(v)}`)
      .join('\n');

    return renderGoTemplate(GO_TEMPLATES.enum, {
      name: this.toPascalCase(name),
      firstValue,
      otherValues,
    });
  }

  formatImports(): string {
    if (this.imports.size === 0) return '';

    const stdlib: string[] = [];
    const thirdParty: string[] = [];

    for (const imp of this.imports) {
      if (isBuiltinType(imp)) continue;
      if (isStdlibPackage(imp)) {
        stdlib.push(imp);
      } else {
        thirdParty.push(imp);
      }
    }

    const allImports = [...stdlib.sort(), ...thirdParty.sort()];

    if (allImports.length === 0) return '';
    if (allImports.length === 1) {
      return renderGoTemplate(GO_TEMPLATES.importSingle, {
        package: allImports[0],
      });
    }

    return renderGoTemplate(GO_TEMPLATES.importBlock, {
      imports: allImports.map((i) => `  "${i}"`).join('\n'),
    });
  }

  fileHeader(source: string, packageName: string): string {
    return renderGoTemplate(GO_TEMPLATES.fileHeader, {
      source,
      timestamp: new Date().toISOString(),
      package: packageName || 'main',
    });
  }

  fileFooter(): string {
    return '\n';
  }

  mapType(stdlibType: string): string {
    return mapGoType(stdlibType).type;
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^|[-_\s]+)(.)/g, (_, __, c) => c.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal[0].toLowerCase() + pascal.slice(1);
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }

  private toUpperSnakeCase(str: string): string {
    return this.toSnakeCase(str).toUpperCase();
  }
}

export function createGoGenerator(config?: GoGeneratorConfig): GoGenerator {
  return new GoGenerator(config);
}
