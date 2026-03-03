"use strict";
/**
 * SPECLANG-GENERATED: Validate Phase
 * Source: @speclang/compiler.spec.dir/phases @compiler/validate
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const errors_1 = require("./errors");
function validate(graph) {
    const errors = [];
    const warnings = [];
    validateHeaders(graph, errors, warnings);
    validateBlockIds(graph, errors);
    validateRefs(graph, errors, warnings);
    validateSyntax(graph, errors);
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
function validateHeaders(graph, errors, warnings) {
    for (const [id, header] of Object.entries(graph.headers)) {
        if (!header.id) {
            errors.push(new errors_1.ValidationError('E001', 'Missing spec ID', { file: '', line: 1, column: 1 }));
        }
        if (!header.version) {
            errors.push(new errors_1.ValidationError('E002', 'Missing version', { file: '', line: 2, column: 1 }));
        }
        if (!header.layer && header.layer !== 0) {
            warnings.push({
                code: 'W001',
                message: 'Missing layer',
                location: { file: '', line: 0, column: 1 },
            });
        }
    }
}
function validateBlockIds(graph, errors) {
    const seenIds = new Set();
    for (const block of graph.nodes) {
        if (seenIds.has(block.id)) {
            errors.push(new errors_1.ValidationError('E003', `Duplicate block ID: ${block.id}`, { file: '', line: block.line, column: 1 }, block.id));
        }
        seenIds.add(block.id);
    }
}
function validateRefs(graph, errors, warnings) {
    const validBlockIds = new Set(graph.nodes.map((b) => b.id));
    const validSpecIds = new Set(Object.keys(graph.headers));
    for (const ref of graph.edges) {
        const target = ref.ref;
        if (target.includes('#')) {
            const [specId, blockId] = target.split('#');
            if (!validSpecIds.has(specId) && !validBlockIds.has(target)) {
                errors.push(new errors_1.ValidationError('E004', `Unresolved ref: ${target}`, { file: ref.sourceFile || '', line: ref.line || 0, column: 1 }));
            }
        }
        else if (!validBlockIds.has(target) && !validSpecIds.has(target)) {
            errors.push(new errors_1.ValidationError('E004', `Unresolved ref: ${target}`, { file: ref.sourceFile || '', line: ref.line || 0, column: 1 }));
        }
    }
}
function validateSyntax(graph, errors) {
    const validKinds = new Set([
        'entity', 'operation', 'policy', 'test', 'mock',
        'diagram', 'code', 'note', 'question', 'decision',
    ]);
    for (const block of graph.nodes) {
        if (!validKinds.has(block.kind)) {
            errors.push(new errors_1.ValidationError('E008', `Unknown kind: ${block.kind}`, { file: '', line: block.line, column: 1 }, block.id));
        }
    }
}
//# sourceMappingURL=validate.js.map