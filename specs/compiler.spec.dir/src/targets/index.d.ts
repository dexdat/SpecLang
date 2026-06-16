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
export declare const TypeScriptTarget: CompilerTarget;
export declare const GoTarget: CompilerTarget;
export declare const RustTarget: CompilerTarget;
export declare const PythonTarget: CompilerTarget;
export declare const targets: Record<string, CompilerTarget>;
export declare function getTarget(lang: string): CompilerTarget | undefined;
export declare function getAllTargets(): CompilerTarget[];
//# sourceMappingURL=index.d.ts.map