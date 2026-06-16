/**
 * SPECLANG-GENERATED: Template system for codegen
 * Source: @speclang/codegen @block:templates
 */
import type { Template, TargetLanguage, CodeSpec } from './types';
import type { SpecMetadata } from '../parser/types';
/** Built-in templates for each target language */
export declare const TEMPLATES: Record<TargetLanguage, Record<string, Template>>;
/** Render a template with variables */
export declare function renderTemplate(template: string, vars: Record<string, string>): string;
/** Get template by name and target */
export declare function getTemplate(target: TargetLanguage, name: string): Template | undefined;
/** Get all template names for a target */
export declare function getTemplateNames(target: TargetLanguage): string[];
/** List all available templates */
export declare function listTemplates(): Array<{
    target: TargetLanguage;
    name: string;
}>;
/** Convert fields array to string */
export declare function formatFields(fields: Array<{
    name: string;
    type: string;
    optional?: boolean;
}>, indent?: number): string;
/** Convert params array to string */
export declare function formatParams(params: Array<{
    name: string;
    type: string;
    optional?: boolean;
}>): string;
/** Convert method array to string */
export declare function formatMethods(methods: Array<{
    name: string;
    params: string;
    return: string;
    body: string;
}>, indent?: number): string;
/** Create a simple file header */
export declare function createFileHeader(spec: CodeSpec, generatorName?: string): string;
/** Create file footer */
export declare function createFileFooter(_spec: CodeSpec): string;
/** Create block-level markers for generated code */
export declare function createBlockMarker(blockId: string, header: SpecMetadata | undefined, language?: TargetLanguage): string;
interface ExternalTemplate {
    name: string;
    target: TargetLanguage;
    content: string;
    variables: string[];
    sourcePath: string;
}
/** Load external .hbs template from filesystem */
export declare function loadExternalTemplate(templatePath: string): ExternalTemplate | null;
/** Get all loaded external templates */
export declare function getExternalTemplates(): ExternalTemplate[];
/** Clear external template cache */
export declare function clearExternalTemplates(): void;
export {};
//# sourceMappingURL=templates.d.ts.map