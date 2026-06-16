/**
 * SPECLANG-GENERATED: Compiler Target Languages
 * Source: @speclang/compiler.spec.dir/targets
 * 
 * Supported output languages and their mappings.
 */

export interface TargetMapping {
  entity: string;
  operation: string;
  policy: string;
  enum: string;
  option?: string;
  result?: string;
}

export interface TargetFeatures {
  typeInference?: boolean;
  optionalChaining?: boolean;
  templateLiterals?: boolean;
  decorators?: boolean;
  explicitErrorHandling?: boolean;
  interfacePolymorphism?: boolean;
  structTags?: boolean;
  ownershipAnnotations?: boolean;
  lifetimeInference?: boolean;
  deriveMacros?: boolean;
  errorTypes?: boolean;
  typeHints?: boolean;
  pydanticValidation?: boolean;
  asyncAwait?: boolean;
}

export interface CompilerTarget {
  id: string;
  name: string;
  fileExt: string;
  mappings: TargetMapping;
  features: TargetFeatures;
}

export const TypeScriptTarget: CompilerTarget = {
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

export const GoTarget: CompilerTarget = {
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

export const RustTarget: CompilerTarget = {
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

export const PythonTarget: CompilerTarget = {
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

export const targets: Record<string, CompilerTarget> = {
  typescript: TypeScriptTarget,
  go: GoTarget,
  rust: RustTarget,
  python: PythonTarget,
};

export function getTarget(lang: string): CompilerTarget | undefined {
  return targets[lang.toLowerCase()];
}

export function getAllTargets(): CompilerTarget[] {
  return Object.values(targets);
}
