"use strict";
/**
 * SPECLANG-GENERATED: Plugin System
 * Source: @speclang/compiler.spec.dir/phases @compiler/plugin-api @compiler/builtin-plugins
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.layerEnforcer = exports.refResolver = exports.mermaidValidator = void 0;
exports.registerPlugin = registerPlugin;
exports.unregisterPlugin = unregisterPlugin;
exports.getPlugins = getPlugins;
exports.runBeforeParse = runBeforeParse;
exports.runAfterParse = runAfterParse;
exports.runBeforeValidate = runBeforeValidate;
exports.runAfterValidate = runAfterValidate;
exports.runBeforeTransform = runBeforeTransform;
exports.runBeforeCodegen = runBeforeCodegen;
exports.runAfterCodegen = runAfterCodegen;
exports.registerBuiltinPlugins = registerBuiltinPlugins;
const registeredPlugins = [];
function registerPlugin(plugin) {
    if (registeredPlugins.some((p) => p.name === plugin.name)) {
        throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    registeredPlugins.push(plugin);
}
function unregisterPlugin(name) {
    const idx = registeredPlugins.findIndex((p) => p.name === name);
    if (idx !== -1) {
        registeredPlugins.splice(idx, 1);
    }
}
function getPlugins() {
    return [...registeredPlugins];
}
function runBeforeParse(source) {
    let result = source;
    for (const plugin of registeredPlugins) {
        if (plugin.beforeParse) {
            result = plugin.beforeParse(result);
        }
    }
    return result;
}
function runAfterParse(graph) {
    let result = graph;
    for (const plugin of registeredPlugins) {
        if (plugin.afterParse) {
            result = plugin.afterParse(result);
        }
    }
    return result;
}
function runBeforeValidate(graph) {
    let result = graph;
    for (const plugin of registeredPlugins) {
        if (plugin.beforeValidate) {
            result = plugin.beforeValidate(result);
        }
    }
    return result;
}
function runAfterValidate(result) {
    let final = result;
    for (const plugin of registeredPlugins) {
        if (plugin.afterValidate) {
            final = plugin.afterValidate(final);
        }
    }
    return final;
}
function runBeforeTransform(ir) {
    let result = ir;
    for (const plugin of registeredPlugins) {
        if (plugin.beforeTransform) {
            result = plugin.beforeTransform(result);
        }
    }
    return result;
}
function runBeforeCodegen(ir, target) {
    let result = ir;
    for (const plugin of registeredPlugins) {
        if (plugin.beforeCodegen) {
            result = plugin.beforeCodegen(result, target);
        }
    }
    return result;
}
function runAfterCodegen(artifacts) {
    let result = artifacts;
    for (const plugin of registeredPlugins) {
        if (plugin.afterCodegen) {
            result = plugin.afterCodegen(result);
        }
    }
    return result;
}
exports.mermaidValidator = {
    name: 'mermaid-validator',
    version: '1.0.0',
    afterParse(graph) {
        for (const block of graph.nodes) {
            if (block.kind === 'diagram' && block.content.includes('```mermaid')) {
                const valid = validateMermaidSyntax(block.content);
                if (!valid) {
                    graph.errors.push({
                        code: 'E005',
                        message: `Invalid mermaid syntax in block ${block.id}`,
                        location: { file: '', line: block.line, column: 1 },
                        block: block.id,
                    });
                }
            }
        }
        return graph;
    },
};
exports.refResolver = {
    name: 'ref-resolver',
    version: '1.0.0',
    afterParse(graph) {
        const blockIds = new Set(graph.nodes.map((b) => b.id));
        for (const ref of graph.edges) {
            const target = ref.ref.includes('#') ? ref.ref.split('#')[1] : ref.ref;
            if (!blockIds.has(target)) {
                graph.errors.push({
                    code: 'E004',
                    message: `Unresolved reference: ${ref.ref}`,
                    location: { file: ref.sourceFile || '', line: ref.line || 0, column: 1 },
                });
            }
        }
        return graph;
    },
};
exports.layerEnforcer = {
    name: 'layer-enforcer',
    version: '1.0.0',
    afterValidate(result) {
        for (const header of Object.values(result.errors)) {
            if (header.message.includes('Missing layer')) {
                result.warnings.push({
                    code: 'W001',
                    message: 'Consider adding layer for better organization',
                });
            }
        }
        return result;
    },
};
function registerBuiltinPlugins() {
    registerPlugin(exports.mermaidValidator);
    registerPlugin(exports.refResolver);
    registerPlugin(exports.layerEnforcer);
}
function validateMermaidSyntax(content) {
    const diagramMatch = content.match(/```mermaid\s*(\w+)?\s*([\s\S]*?)```/);
    if (!diagramMatch)
        return false;
    const diagramType = diagramMatch[1];
    const diagramContent = diagramMatch[2] || '';
    const validTypes = ['flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'mindmap', 'journey'];
    if (!validTypes.includes(diagramType)) {
        return false;
    }
    return diagramContent.trim().length > 0;
}
//# sourceMappingURL=plugins.js.map