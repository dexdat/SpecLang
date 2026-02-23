/**
 * SPECLANG-GENERATED: Codegen Phase
 * Source: @speclang/compiler.spec.dir/phases @compiler/codegen
 */

import type { IR, Artifact } from './types';
import type { CompilerTarget } from '../targets';
import { getTarget } from '../targets';

export function codegen(ir: IR, targetId: string): Artifact[] {
  const target = getTarget(targetId);
  if (!target) {
    throw new Error(`Unknown target: ${targetId}`);
  }

  const artifacts: Artifact[] = [];

  for (const entity of ir.entities) {
    artifacts.push(generateEntity(entity, target));
  }

  for (const operation of ir.operations) {
    artifacts.push(generateOperation(operation, target));
  }

  for (let i = 0; i < artifacts.length; i++) {
    artifacts[i].markers = extractMarkers(artifacts[i].content);
  }

  return artifacts;
}

function generateEntity(entity: import('./types').IRBlock, target: CompilerTarget): Artifact {
  let content = '';

  if (target.id === 'compiler/ts-target') {
    content = generateTypeScriptEntity(entity);
  } else if (target.id === 'compiler/go-target') {
    content = generateGoEntity(entity);
  } else if (target.id === 'compiler/rust-target') {
    content = generateRustEntity(entity);
  } else if (target.id === 'compiler/py-target') {
    content = generatePythonEntity(entity);
  } else {
    content = generateGenericEntity(entity);
  }

  return {
    path: `generated/${entity.name}${target.fileExt}`,
    content,
    markers: [],
    target: target.id,
  };
}

function generateTypeScriptEntity(entity: import('./types').IRBlock): string {
  const fields = entity.fields
    .map((f) => `  ${f.name}${f.optional ? '?' : ''}: ${f.type};`)
    .join('\n');

  return `export interface ${capitalize(entity.name)} {\n${fields}\n}\n`;
}

function generateGoEntity(entity: import('./types').IRBlock): string {
  const fields = entity.fields
    .map((f) => `  ${capitalize(f.name)} ${goType(f.type)} \`json:"${camelToSnake(f.name)}"\``)
    .join('\n');

  return `type ${capitalize(entity.name)} struct {\n${fields}\n}\n`;
}

function generateRustEntity(entity: import('./types').IRBlock): string {
  const fields = entity.fields
    .map((f) => `  pub ${f.name}: ${rustType(f.type)}${f.optional ? 'Option' : ''},`)
    .join('\n');

  return `pub struct ${capitalize(entity.name)} {\n${fields}\n}\n`;
}

function generatePythonEntity(entity: import('./types').IRBlock): string {
  const fields = entity.fields.map((f) => `${f.name}: ${pythonType(f.type)}`).join(', ');

  return `@dataclass\nclass ${capitalize(entity.name)}:\n  ${fields}\n`;
}

function generateGenericEntity(entity: import('./types').IRBlock): string {
  return `// Entity: ${entity.name}\n// Fields: ${entity.fields.map((f) => f.name).join(', ')}\n`;
}

function generateOperation(op: import('./types').IROperation, target: CompilerTarget): Artifact {
  let content = '';

  if (target.id === 'compiler/ts-target') {
    const params = op.params.map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ');
    content = `export function ${op.name}(${params}): ${op.returnType} {\n  // ${op.body}\n}\n`;
  } else if (target.id === 'compiler/go-target') {
    const params = op.params.map((p) => `${p.name} ${goType(p.type)}`).join(', ');
    content = `func ${capitalize(op.name)}(${params}) ${goType(op.returnType)} {\n  // TODO: implement\n}\n`;
  } else if (target.id === 'compiler/rust-target') {
    const params = op.params.map((p) => `${p.name}: ${rustType(p.type)}`).join(', ');
    content = `pub fn ${op.name}(${params}) -> ${rustType(op.returnType)} {\n  // TODO: implement\n}\n`;
  } else if (target.id === 'compiler/py-target') {
    const params = op.params.map((p) => `${p.name}: ${pythonType(p.type)}`).join(', ');
    content = `def ${op.name}(${params}) -> ${pythonType(op.returnType)}:\n    pass\n`;
  } else {
    content = `// Operation: ${op.name}\n// ${op.body}\n`;
  }

  return {
    path: `generated/${op.name}${target.fileExt}`,
    content,
    markers: [],
    target: target.id,
  };
}

function extractMarkers(content: string): string[] {
  const markerRegex = /@speclang-id:\s*(\S+)/g;
  const markers: string[] = [];
  let match;

  while ((match = markerRegex.exec(content)) !== null) {
    markers.push(match[1]);
  }

  return markers;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function goType(type: string): string {
  const typeMap: Record<string, string> = {
    string: 'string',
    number: 'int',
    boolean: 'bool',
    any: 'interface{}',
  };
  return typeMap[type] || type;
}

function rustType(type: string): string {
  const typeMap: Record<string, string> = {
    string: 'String',
    number: 'i32',
    boolean: 'bool',
    any: 'String',
  };
  return typeMap[type] || type;
}

function pythonType(type: string): string {
  const typeMap: Record<string, string> = {
    string: 'str',
    number: 'int',
    boolean: 'bool',
    any: 'Any',
  };
  return typeMap[type] || type;
}
