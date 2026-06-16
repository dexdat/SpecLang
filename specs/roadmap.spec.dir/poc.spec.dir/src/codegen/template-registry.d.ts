/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/template-registry.spec.md
 * Generated: 2026-03-03T05:20:00.000Z
 *
 * Edit the spec, not this file.
 */
import { BlockData, BlockKind } from '../types/poc';
/**
 * Template function signature
 */
export type Template = (data: BlockData) => string;
/**
 * Template metadata
 */
export interface TemplateMetadata {
    /** Template name/ID */
    name: string;
    /** Supported block kind */
    kind: BlockKind;
    /** Template description */
    description: string;
    /** Language (typescript, javascript) */
    language: string;
    /** Template version */
    version: string;
    /** Source path (for custom templates) */
    sourcePath?: string;
    /** When template was registered */
    registeredAt: number;
}
/**
 * Template registry with loading and caching
 */
export declare class TemplateRegistry {
    private templates;
    private customTemplates;
    constructor();
    /**
     * Get template for block kind
     * Falls back to generic template if not found
     */
    get(kind: BlockKind): Template;
    /**
     * Check if template exists for kind
     */
    has(kind: BlockKind): boolean;
    /**
     * Register a template
     */
    register(kind: BlockKind, template: Template, metadata?: Partial<TemplateMetadata>): void;
    /**
     * Unregister a template
     */
    unregister(kind: BlockKind): boolean;
    /**
     * Load template from file
     */
    loadFromFile(filePath: string, kind: BlockKind): Promise<void>;
    /**
     * Load all templates from directory
     */
    loadFromDirectory(dirPath: string): Promise<number>;
    /**
     * Get all registered templates
     */
    getAll(): Map<BlockKind, TemplateMetadata>;
    /**
     * Get template metadata
     */
    getMetadata(kind: BlockKind): TemplateMetadata | undefined;
    /**
     * Clear all templates (except built-ins)
     */
    clear(): void;
    /**
     * Register built-in templates
     */
    private registerBuiltInTemplates;
    /**
     * Compile template string to function
     * Simple placeholder replacement
     */
    private compileTemplate;
    /**
     * Format parameters for signature
     */
    private formatParams;
    /**
     * Format parameter docs
     */
    private formatParamDocs;
    /**
     * Generic fallback template
     */
    private getGenericTemplate;
}
//# sourceMappingURL=template-registry.d.ts.map