/**
 * SPECLANG-GENERATED: Lens System Index
 * Source: @speclang/lenses
 *
 * Main exports for the Lens System - bidirectional parsers/renderers
 * that convert between structured Block objects and various content formats.
 */
import { LensRegistry } from './registry';
import { LensConverter } from './converter';
export declare function initializeLenses(): {
    registry: LensRegistry;
    converter: LensConverter;
};
declare const defaultRegistry: LensRegistry, defaultConverter: LensConverter;
export { LensRegistry, LensConverter };
export { defaultRegistry, defaultConverter };
export { proseLens } from './prose-lens';
export { codeLens } from './code-lens';
export { entityLens } from './entity-lens';
export { operationLens } from './operation-lens';
export { mathLens } from './math-lens';
export { acceptanceLens } from './acceptance-lens';
export { diagramLens, detectDiagramType } from './diagram-lens';
export { tableLens } from './table-lens';
export { policyLens } from './policy-lens';
export { questionLens } from './question-lens';
export { decisionLens } from './decision-lens';
export type { Lens, Block, LensContext, LensOptions, LensMatch, FieldDef, ParamDef, AcceptanceSection, DiagramMetadata } from './types';
//# sourceMappingURL=index.d.ts.map