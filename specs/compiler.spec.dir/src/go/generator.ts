/**
 * SPECLANG-GENERATED: Go code generator
 * Source: @speclang/compiler.spec.dir/go
 *
 * Reads SpecLang spec blocks and produces idiomatic Go source files.
 */

import { mapGoType, getGoZeroValue } from './types';
import {
  renderStruct,
  renderInterface,
  renderConstructor,
  renderImports,
  renderFile,
  toPascalCase,
  toCamelCase,
  toSnakeCase,
  GO_TEMPLATES,
} from './templates';
import { isStdlibPackage, isBuiltinType } from './builtins';

// ============================================================================
// PUBLIC TYPES
// ============================================================================

export interface SpecField {
  name: string;
  type: string;
  optional?: boolean;
  jsonName?: string;
  comment?: string;
}

export interface SpecMethod {
  name: string;
  params: SpecField[];
  returns: string[];
  description?: string;
}

export interface SpecInterface {
  name: string;
  methods: SpecMethod[];
  description?: string;
}

export interface SpecBlock {
  name: string;
  package?: string;
  fields?: SpecField[];
  methods?: SpecMethod[];
  interfaces?: SpecInterface[];
  description?: string;
}

export interface GeneratedGoCode {
  code: string;
  imports: string[];
  package: string;
}

export interface GoGeneratorOptions {
  packageName?: string;
  addJsonTags?: boolean;
  addGormTags?: boolean;
  addConstructor?: boolean;
  addInterfaces?: boolean;
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

interface ResolvedField {
  name: string;
  exportedName: string;
  goType: string;
  imports: string[];
  jsonTag: string;
  gormTag: string;
  zeroValue: string;
}

function resolveField(
  field: SpecField,
  options: GoGeneratorOptions
): ResolvedField {
  const resolved = mapGoType(field.type);
  const exportedName = toPascalCase(field.name);
  const jsonName = field.jsonName || toSnakeCase(field.name);

  let jsonTag = '';
  if (options.addJsonTags) {
    const omitempty = field.optional ? ',omitempty' : '';
    jsonTag = GO_TEMPLATES.jsonTag
      .replace('{{name}}', jsonName)
      .replace('{{omitempty}}', omitempty);
  }

  let gormTag = '';
  if (options.addGormTags) {
    const parts = [`column:${jsonName}`];
    if (field.optional) parts.push('default:null');
    gormTag = `\`gorm:"${parts.join(';')}"\``;
  }

  return {
    name: field.name,
    exportedName,
    goType: resolved.type,
    imports: resolved.imports,
    jsonTag,
    gormTag,
    zeroValue: getGoZeroValue(field.type),
  };
}

function collectImports(resolved: ResolvedField[]): string[] {
  const importSet = new Set<string>();
  for (const r of resolved) {
    for (const imp of r.imports) {
      if (!isBuiltinType(imp)) importSet.add(imp);
    }
  }
  return Array.from(importSet).sort();
}

function formatImportBlock(imports: string[]): string {
  if (imports.length === 0) return '';

  const stdlib: string[] = [];
  const thirdParty: string[] = [];

  for (const imp of imports) {
    if (isStdlibPackage(imp)) {
      stdlib.push(imp);
    } else {
      thirdParty.push(imp);
    }
  }

  const all = [...stdlib.sort(), ...thirdParty.sort()];
  return renderImports(all);
}

// ============================================================================
// MAIN GENERATOR CLASS
// ============================================================================

export class GoCodeGenerator {
  language = 'go';
  extension = '.go';
  private options: GoGeneratorOptions;

  constructor(options: GoGeneratorOptions = {}) {
    this.options = {
      packageName: 'generated',
      addJsonTags: true,
      addGormTags: false,
      addConstructor: true,
      addInterfaces: true,
      ...options,
    };
  }

  generate(block: SpecBlock): GeneratedGoCode {
    const pkg = block.package || this.options.packageName || 'generated';
    const parts: string[] = [];

    const resolvedFields = (block.fields || []).map(f =>
      resolveField(f, this.options)
    );
    const allImports = collectImports(resolvedFields);

    // Generate struct
    if (block.fields && block.fields.length > 0) {
      parts.push(this.generateStruct(block.name, block.fields));
    }

    // Generate constructor
    if (
      this.options.addConstructor &&
      block.fields &&
      block.fields.length > 0
    ) {
      parts.push(this.generateConstructor(block.name, block.fields));
    }

    // Generate interfaces
    if (this.options.addInterfaces && block.interfaces) {
      for (const iface of block.interfaces) {
        parts.push(this.generateInterface(iface.name, iface.methods));
      }
    }

    // Generate method implementations
    if (block.methods && block.methods.length > 0) {
      parts.push(this.generateMethods(block.name, block.methods));
    }

    const body = parts.join('\n');
    const code = renderFile(pkg, allImports, body, block.name);

    return {
      code,
      imports: allImports,
      package: pkg,
    };
  }

  generateStruct(name: string, fields: SpecField[]): string {
    const resolved = fields.map(f => resolveField(f, this.options));
    const allImports = collectImports(resolved);

    // Clear and re-populate imports for caller
    const goFields = resolved.map(r => ({
      name: r.exportedName,
      type: r.goType,
      tag: [r.jsonTag, r.gormTag].filter(Boolean).join(' '),
    }));

    return renderStruct(toPascalCase(name), goFields);
  }

  generateConstructor(name: string, fields: SpecField[]): string {
    const resolved = fields.map(f => {
      const r = resolveField(f, this.options);
      const paramName = toCamelCase(f.name);
      return {
        name: r.exportedName,
        type: r.goType,
        paramName,
        zeroValue: r.zeroValue,
      };
    });

    const params = fields
      .map((f, i) => `${resolved[i].paramName} ${resolved[i].type}`)
      .join(', ');

    const fieldInits = resolved
      .map(r => `    ${r.name}: ${r.paramName},`)
      .join('\n');

    const constr = GO_TEMPLATES.constructor
      .replace(/{{name}}/g, toPascalCase(name))
      .replace('{{params}}', params)
      .replace('{{fieldInits}}', fieldInits);

    return constr;
  }

  generateInterface(name: string, methods: SpecMethod[]): string {
    const methodDefs = methods.map(m => {
      const params = m.params
        .map(p => `${toCamelCase(p.name)} ${mapGoType(p.type).type}`)
        .join(', ');
      const returns = m.returns.length === 0 ? '' : m.returns.join(', ');
      return {
        name: toPascalCase(m.name),
        params,
        returns,
      };
    });

    return renderInterface(toPascalCase(name), methodDefs);
  }

  generateMethods(structName: string, methods: SpecMethod[]): string {
    const parts = methods.map(m => {
      const params = m.params
        .map(p => `${toCamelCase(p.name)} ${mapGoType(p.type).type}`)
        .join(', ');
      const returns = m.returns.length === 0 ? '' : m.returns.join(', ');
      const receiver = GO_TEMPLATES.receiver.replace(
        '{{type}}',
        toPascalCase(structName)
      );

      const body = `  // TODO: Implement ${toPascalCase(m.name)}`;

      return `func ${receiver}${toPascalCase(m.name)}(${params}) ${returns} {\n${body}\n}\n`;
    });

    return parts.join('\n');
  }

  generateFile(pkg: string, block: SpecBlock): string {
    const result = this.generate({ ...block, 'package': pkg });
    return result.code;
  }
}

// ============================================================================
// PACKAGE GENERATOR
// ============================================================================

export interface GoPackageFile {
  filename: string;
  content: string;
}

export interface GoPackageOptions {
  module?: string;
  goVersion?: string;
  packageName?: string;
  addGoMod?: boolean;
}

export class GoPackageGenerator {
  private files: Map<string, string> = new Map();
  private generator: GoCodeGenerator;
  private options: GoPackageOptions;

  constructor(options: GoPackageOptions = {}) {
    this.options = {
      module: 'github.com/user/project',
      goVersion: '1.21',
      packageName: 'generated',
      addGoMod: true,
      ...options,
    };
    this.generator = new GoCodeGenerator({
      packageName: this.options.packageName,
    });
  }

  addBlock(block: SpecBlock): void {
    const result = this.generator.generate(block);
    const filename = `${toSnakeCase(block.name)}.go`;
    this.files.set(filename, result.code);
  }

  addStruct(name: string, fields: SpecField[], pkg?: string): void {
    const block: SpecBlock = {
      name,
      package: pkg || this.options.packageName,
      fields,
    };
    this.addBlock(block);
  }

  addInterface(name: string, methods: SpecMethod[], pkg?: string): void {
    const block: SpecBlock = {
      name: `${name}Interface`,
      package: pkg || this.options.packageName,
      interfaces: [{ name, methods }],
    };
    this.addBlock(block);
  }

  addFile(filename: string, content: string): void {
    this.files.set(filename, content);
  }

  hasFile(filename: string): boolean {
    return this.files.has(filename);
  }

  removeFile(filename: string): boolean {
    return this.files.delete(filename);
  }

  generateGoMod(): string {
    if (!this.options.addGoMod) return '';
    const lines: string[] = [
      `module ${this.options.module}`,
      '',
      `go ${this.options.goVersion}`,
    ];
    return lines.join('\n') + '\n';
  }

  generateAll(): GoPackageFile[] {
    const result: GoPackageFile[] = [];
    for (const [filename, content] of this.files) {
      result.push({ filename, content });
    }
    if (this.options.addGoMod) {
      result.push({ filename: 'go.mod', content: this.generateGoMod() });
    }
    return result.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  getGenerator(): GoCodeGenerator {
    return this.generator;
  }

  clear(): void {
    this.files.clear();
  }

  get fileCount(): number {
    return this.files.size;
  }
}

export function createGoCodeGenerator(
  options?: GoGeneratorOptions
): GoCodeGenerator {
  return new GoCodeGenerator(options);
}

export function createGoPackageGenerator(
  options?: GoPackageOptions
): GoPackageGenerator {
  return new GoPackageGenerator(options);
}
