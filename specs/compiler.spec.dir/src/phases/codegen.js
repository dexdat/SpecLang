"use strict";
/**
 * SPECLANG-GENERATED: Codegen Phase
 * Source: @speclang/compiler.spec.dir/phases @compiler/codegen
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.codegen = codegen;
const targets_1 = require("../targets");
function codegen(ir, targetId) {
    const target = (0, targets_1.getTarget)(targetId);
    if (!target) {
        throw new Error(`Unknown target: ${targetId}`);
    }
    const artifacts = [];
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
function generateEntity(entity, target) {
    let content = '';
    if (target.id === 'compiler/ts-target') {
        content = generateTypeScriptEntity(entity);
    }
    else if (target.id === 'compiler/go-target') {
        content = generateGoEntity(entity);
    }
    else if (target.id === 'compiler/rust-target') {
        content = generateRustEntity(entity);
    }
    else if (target.id === 'compiler/py-target') {
        content = generatePythonEntity(entity);
    }
    else {
        content = generateGenericEntity(entity);
    }
    return {
        path: `generated/${entity.name}${target.fileExt}`,
        content,
        markers: [],
        target: target.id,
    };
}
function generateTypeScriptEntity(entity) {
    const fields = entity.fields
        .map((f) => `  ${f.name}${f.optional ? '?' : ''}: ${f.type};`)
        .join('\n');
    return `export interface ${capitalize(entity.name)} {\n${fields}\n}\n`;
}
function generateGoEntity(entity) {
    const fields = entity.fields
        .map((f) => `  ${capitalize(f.name)} ${goType(f.type)} \`json:"${camelToSnake(f.name)}"\``)
        .join('\n');
    return `type ${capitalize(entity.name)} struct {\n${fields}\n}\n`;
}
function generateRustEntity(entity) {
    const fields = entity.fields
        .map((f) => `  pub ${f.name}: ${rustType(f.type)}${f.optional ? 'Option' : ''},`)
        .join('\n');
    return `pub struct ${capitalize(entity.name)} {\n${fields}\n}\n`;
}
function generatePythonEntity(entity) {
    const fields = entity.fields.map((f) => `${f.name}: ${pythonType(f.type)}`).join(', ');
    return `@dataclass\nclass ${capitalize(entity.name)}:\n  ${fields}\n`;
}
function generateGenericEntity(entity) {
    return `// Entity: ${entity.name}\n// Fields: ${entity.fields.map((f) => f.name).join(', ')}\n`;
}
function generateOperation(op, target) {
    let content = '';
    if (target.id === 'compiler/ts-target') {
        const params = op.params.map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ');
        content = `export function ${op.name}(${params}): ${op.returnType} {\n  // ${op.body}\n}\n`;
    }
    else if (target.id === 'compiler/go-target') {
        const params = op.params.map((p) => `${p.name} ${goType(p.type)}`).join(', ');
        content = `func ${capitalize(op.name)}(${params}) ${goType(op.returnType)} {\n  // TODO: implement\n}\n`;
    }
    else if (target.id === 'compiler/rust-target') {
        const params = op.params.map((p) => `${p.name}: ${rustType(p.type)}`).join(', ');
        content = `pub fn ${op.name}(${params}) -> ${rustType(op.returnType)} {\n  // TODO: implement\n}\n`;
    }
    else if (target.id === 'compiler/py-target') {
        const params = op.params.map((p) => `${p.name}: ${pythonType(p.type)}`).join(', ');
        content = `def ${op.name}(${params}) -> ${pythonType(op.returnType)}:\n    pass\n`;
    }
    else {
        content = `// Operation: ${op.name}\n// ${op.body}\n`;
    }
    return {
        path: `generated/${op.name}${target.fileExt}`,
        content,
        markers: [],
        target: target.id,
    };
}
function extractMarkers(content) {
    const markerRegex = /@speclang-id:\s*(\S+)/g;
    const markers = [];
    let match;
    while ((match = markerRegex.exec(content)) !== null) {
        markers.push(match[1]);
    }
    return markers;
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function camelToSnake(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function goType(type) {
    const typeMap = {
        string: 'string',
        number: 'int',
        boolean: 'bool',
        any: 'interface{}',
    };
    return typeMap[type] || type;
}
function rustType(type) {
    const typeMap = {
        string: 'String',
        number: 'i32',
        boolean: 'bool',
        any: 'String',
    };
    return typeMap[type] || type;
}
function pythonType(type) {
    const typeMap = {
        string: 'str',
        number: 'int',
        boolean: 'bool',
        any: 'Any',
    };
    return typeMap[type] || type;
}
//# sourceMappingURL=codegen.js.map