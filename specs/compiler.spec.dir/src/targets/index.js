"use strict";
/**
 * SPECLANG-GENERATED: Compiler Target Languages
 * Source: @speclang/compiler.spec.dir/targets
 *
 * Supported output languages and their mappings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.targets = exports.PythonTarget = exports.RustTarget = exports.GoTarget = exports.TypeScriptTarget = void 0;
exports.getTarget = getTarget;
exports.getAllTargets = getAllTargets;
exports.TypeScriptTarget = {
    id: "compiler/ts-target",
    name: "TypeScript",
    fileExt: ".ts",
    mappings: {
        entity: "interface or class",
        operation: "function",
        policy: "type guard or middleware",
        enum: "union type or enum",
    },
    features: {
        typeInference: true,
        optionalChaining: true,
        templateLiterals: true,
        decorators: true,
    },
};
exports.GoTarget = {
    id: "compiler/go-target",
    name: "Go",
    fileExt: ".go",
    mappings: {
        entity: "struct",
        operation: "func",
        policy: "func that returns error",
        enum: "iota const or string",
    },
    features: {
        explicitErrorHandling: true,
        interfacePolymorphism: true,
        structTags: true,
    },
};
exports.RustTarget = {
    id: "compiler/rust-target",
    name: "Rust",
    fileExt: ".rs",
    mappings: {
        entity: "struct",
        operation: "fn",
        policy: "impl or Result",
        enum: "enum",
        option: "Option<T>",
        result: "Result<T,E>",
    },
    features: {
        ownershipAnnotations: true,
        lifetimeInference: true,
        deriveMacros: true,
        errorTypes: true,
    },
};
exports.PythonTarget = {
    id: "compiler/py-target",
    name: "Python",
    fileExt: ".py",
    mappings: {
        entity: "@dataclass or Pydantic",
        operation: "def",
        policy: "decorator or raise",
        enum: "Enum class",
    },
    features: {
        typeHints: true,
        pydanticValidation: true,
        asyncAwait: true,
    },
};
exports.targets = {
    typescript: exports.TypeScriptTarget,
    go: exports.GoTarget,
    rust: exports.RustTarget,
    python: exports.PythonTarget,
};
function getTarget(lang) {
    return exports.targets[lang.toLowerCase()];
}
function getAllTargets() {
    return Object.values(exports.targets);
}
//# sourceMappingURL=index.js.map