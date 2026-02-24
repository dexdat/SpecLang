/**
 * SPECLANG-GENERATED: Python target generator
 * Source: @speclang/compiler.spec.dir/python
 */

import type { CodeSpec, GeneratedFile, CodeBlock } from '../../codegen/types';
import { mapPythonType, getPythonZeroValue } from '../python/types';
import { PYTHON_TEMPLATES, renderPythonTemplate } from '../python/templates';
import { isStdlibModule, isBuiltinType, isThirdPartyModule } from '../python/builtins';

export interface PythonField {
  name: string;
  type: string;
  optional?: boolean;
  default?: string;
}

export interface PythonGeneratorConfig {
  useDataclass?: boolean;
  usePydantic?: boolean;
  addTypeHints?: boolean;
}

export class PythonGenerator {
  language = 'python';
  extension = '.py';

  private imports: Set<string> = new Set();
  private fromImports: Map<string, string[]> = new Map();
  private config: PythonGeneratorConfig;

  constructor(config: PythonGeneratorConfig = {}) {
    this.config = {
      useDataclass: true,
      usePydantic: false,
      addTypeHints: true,
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
        language: 'python',
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
    const header = this.fileHeader(spec.header.id);
    const parts: string[] = [header];

    const imports = this.formatImports();
    if (imports) {
      parts.push(imports);
      parts.push('');
    }

    for (const block of blocks) {
      parts.push(`# Block: ${block.id}`);
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
        content = this.generateDataclassFromBlock(block);
        break;
      case 'interface':
        content = this.generateProtocolFromBlock(block);
        break;
      case 'function':
      case 'operation':
        content = this.generateFunctionFromBlock(block);
        break;
      case 'class':
        content = this.generateClassFromBlock(block);
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
      language: 'python',
    };
  }

  private generateDataclassFromBlock(block: CodeBlock): string {
    this.imports.clear();
    this.fromImports.clear();
    this.fromImports.set('dataclasses', ['dataclass']);

    const nameMatch = block.content.match(/type\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    return `@dataclass
class ${name}:
    pass
`;
  }

  private generateProtocolFromBlock(block: CodeBlock): string {
    this.imports.clear();
    this.fromImports.set('typing', ['Protocol']);

    const nameMatch = block.content.match(/interface\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    return `class ${name}(Protocol):
    pass
`;
  }

  private generateFunctionFromBlock(block: CodeBlock): string {
    this.imports.clear();

    const nameMatch = block.content.match(/(?:async\s+)?function\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    return `def ${name}():
    pass
`;
  }

  private generateClassFromBlock(block: CodeBlock): string {
    this.imports.clear();

    const nameMatch = block.content.match(/class\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    return `class ${name}:
    pass
`;
  }

  private generateEnumFromBlock(block: CodeBlock): string {
    this.imports.clear();
    this.fromImports.set('enum', ['Enum']);

    const nameMatch = block.content.match(/enum\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : block.id.split('/').pop() || 'Unknown';
    
    return `class ${name}(Enum):
    UNKNOWN = "unknown"
`;
  }

  private generatePlaceholder(spec: CodeSpec): GeneratedFile {
    return {
      path: this.getOutputPath(spec),
      content: `${this.fileHeader(spec.header.id)}\n\n# No code blocks found in spec\n`,
      sourceBlock: 'placeholder',
      language: 'python',
    };
  }

  private getOutputPath(spec: CodeSpec): string {
    const basePath = spec.target.outputPath || 'src/generated';
    const specId = spec.header.id.replace(/[@/]/g, '-');
    return `${basePath}/${specId}.py`;
  }

  private getBlockOutputPath(spec: CodeSpec, block: CodeBlock): string {
    const basePath = spec.target.outputPath || 'src/generated';
    const blockName = block.id.replace(/[@/]/g, '-');
    return `${basePath}/${blockName}.py`;
  }

  generateDataclass(name: string, fields: PythonField[]): string {
    this.imports.clear();
    this.fromImports.clear();
    this.fromImports.set('dataclasses', ['dataclass']);

    const fieldLines = fields.map((f) => {
      const { type, imports } = mapPythonType(f.type);
      imports.forEach((i) => {
        if (!this.fromImports.has(i)) {
          this.fromImports.set(i, []);
        }
      });

      let defaultVal = 'None';
      if (f.optional) {
        defaultVal = 'None';
      } else if (f.default) {
        defaultVal = f.default;
      } else {
        defaultVal = getPythonZeroValue(f.type);
      }

      return renderPythonTemplate(PYTHON_TEMPLATES.dataclassField, {
        name: this.toSnakeCase(f.name),
        type,
        default: defaultVal,
      });
    });

    return renderPythonTemplate(PYTHON_TEMPLATES.dataclass, {
      name: this.toPascalCase(name),
      fields: fieldLines.join('\n'),
    });
  }

  generatePydanticModel(name: string, fields: PythonField[]): string {
    this.imports.clear();
    this.fromImports.clear();
    this.fromImports.set('pydantic', ['BaseModel', 'Field']);

    const fieldLines = fields.map((f) => {
      const { type, imports } = mapPythonType(f.type);
      imports.forEach((i) => {
        if (!this.fromImports.has(i)) {
          this.fromImports.set(i, []);
        }
      });

      let fieldArgs = '';
      if (f.optional) {
        fieldArgs = 'default=None';
      } else if (f.default) {
        fieldArgs = `default=${f.default}`;
      }

      return renderPythonTemplate(PYTHON_TEMPLATES.pydanticField, {
        name: this.toSnakeCase(f.name),
        type,
        fieldArgs,
      });
    });

    return renderPythonTemplate(PYTHON_TEMPLATES.pydanticModel, {
      name: this.toPascalCase(name),
      fields: fieldLines.join('\n'),
    });
  }

  generateFunction(
    name: string,
    params: string,
    returns: string,
    body: string,
    isAsync: boolean = false
  ): string {
    this.imports.clear();

    const { type: returnType, imports } = mapPythonType(returns);
    imports.forEach((i) => {
      if (!this.fromImports.has(i)) {
        this.fromImports.set(i, []);
      }
    });

    const template = isAsync ? PYTHON_TEMPLATES.asyncFunction : PYTHON_TEMPLATES.function;

    return renderPythonTemplate(template, {
      name: this.toSnakeCase(name),
      params,
      returnType,
      docstring: '',
      body: body || '    pass',
    });
  }

  generateEnum(name: string, values: string[]): string {
    this.imports.clear();
    this.fromImports.clear();
    this.fromImports.set('enum', ['Enum']);

    const valueLines = values.map((v) => {
      return renderPythonTemplate(PYTHON_TEMPLATES.enumValue, {
        name: this.toUpperSnakeCase(v),
        value: v,
      });
    });

    return renderPythonTemplate(PYTHON_TEMPLATES.enum, {
      name: this.toPascalCase(name),
      values: valueLines.join('\n'),
    });
  }

  generateProtocol(
    name: string,
    methods: Array<{ name: string; params: string; returns: string }>
  ): string {
    this.imports.clear();
    this.fromImports.clear();
    this.fromImports.set('typing', ['Protocol']);

    const methodLines = methods.map((m) => {
      const { type: returnType, imports } = mapPythonType(m.returns);
      imports.forEach((i) => {
        if (!this.fromImports.has(i)) {
          this.fromImports.set(i, []);
        }
      });

      return renderPythonTemplate(PYTHON_TEMPLATES.protocolMethod, {
        name: this.toSnakeCase(m.name),
        params: m.params,
        returnType,
      });
    });

    return renderPythonTemplate(PYTHON_TEMPLATES.protocol, {
      name: this.toPascalCase(name),
      methods: methodLines.join('\n'),
    });
  }

  formatImports(): string {
    const lines: string[] = [];

    for (const [module, names] of this.fromImports) {
      if (names.length > 0) {
        lines.push(`from ${module} import ${names.join(', ')}`);
      }
    }

    for (const module of this.imports) {
      if (isBuiltinType(module)) continue;
      lines.push(`import ${module}`);
    }

    if (lines.length === 0) return '';
    return lines.sort().join('\n');
  }

  fileHeader(source: string): string {
    return renderPythonTemplate(PYTHON_TEMPLATES.fileHeader, {
      source,
      timestamp: new Date().toISOString(),
      docstring: 'Generated module',
    });
  }

  fileFooter(): string {
    return '\n';
  }

  mapType(stdlibType: string): string {
    return mapPythonType(stdlibType).type;
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^|[-_\s]+)(.)/g, (_, __, c) => c.toUpperCase());
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .replace(/[-\s]+/g, '_');
  }

  private toUpperSnakeCase(str: string): string {
    return this.toSnakeCase(str).toUpperCase();
  }
}

export function createPythonGenerator(config?: PythonGeneratorConfig): PythonGenerator {
  return new PythonGenerator(config);
}
