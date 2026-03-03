/**
 * SPECLANG-GENERATED: Target registry for codegen
 * Source: @speclang/codegen @block:targets
 */
import type { ITargetGenerator, TargetLanguage, CodeSpec, GeneratedFile } from '../types';
/** Registry of all target generators */
declare class TargetRegistry {
    private generators;
    constructor();
    /** Register a target generator */
    register(generator: ITargetGenerator): void;
    /** Get generator for target language */
    get(target: TargetLanguage): ITargetGenerator | undefined;
    /** Check if target is supported */
    has(target: TargetLanguage): boolean;
    /** Get all supported targets */
    supportedTargets(): TargetLanguage[];
    /** Get generators map for internal use */
    getGenerators(): Map<TargetLanguage, ITargetGenerator>;
    /** Generate code for a spec using appropriate target */
    generate(spec: CodeSpec): GeneratedFile[];
}
export declare const targetRegistry: TargetRegistry;
/** Generate code for a spec */
export declare function generateForSpec(spec: CodeSpec): GeneratedFile[];
/** Get generator for target language */
export declare function getGenerator(target: TargetLanguage): ITargetGenerator | undefined;
/** Check if target is supported */
export declare function isTargetSupported(target: string): target is TargetLanguage;
/** Get list of supported targets */
export declare function getSupportedTargets(): TargetLanguage[];
/** Get all target generators */
export declare function getAllGenerators(): ITargetGenerator[];
export type { ITargetGenerator } from '../types';
//# sourceMappingURL=index.d.ts.map