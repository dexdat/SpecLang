/**
 * SPECLANG-GENERATED: Lens System Types
 * Source: @speclang/lenses
 *
 * Type definitions for the Lens System - bidirectional parsers/renderers
 * that convert between structured Block objects and various content formats.
 */
export interface Block {
    id: string;
    kind: string;
    content: string;
    metadata: Record<string, any>;
    children?: Block[];
    source?: {
        lens: string;
        original: string;
        line: number;
    };
}
export interface LensContext {
    filePath: string;
    blockId: string;
    options: LensOptions;
}
export interface LensOptions {
    preserveSource: boolean;
    prettyPrint: boolean;
    indent: number;
    explicitKind?: string;
}
export interface Lens<TInput = any, TOutput = Block> {
    name: string;
    kind: string;
    description: string;
    priority: number;
    detect: (content: string) => boolean;
    parse: (content: string, context: LensContext) => Promise<Block>;
    render: (block: Block, context: LensContext) => Promise<string>;
}
export type LensMatch = {
    lens: Lens;
    confidence: number;
};
export interface FieldDef {
    name: string;
    type: string;
    description?: string;
}
export interface ParamDef {
    name: string;
    type: string;
}
export interface AcceptanceSection {
    given: string[];
    when: string[];
    then: string[];
}
export interface DiagramMetadata {
    format: string;
    diagramType: string;
}
//# sourceMappingURL=types.d.ts.map