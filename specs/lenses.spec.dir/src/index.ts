/**
 * SPECLANG-GENERATED: Lens System Index
 * Source: @speclang/lenses
 * 
 * Main exports for the Lens System - bidirectional parsers/renderers
 * that convert between structured Block objects and various content formats.
 */

import { LensRegistry } from './registry';
import { LensConverter } from './converter';
import { proseLens } from './prose-lens';
import { codeLens } from './code-lens';
import { entityLens } from './entity-lens';
import { operationLens } from './operation-lens';
import { mathLens } from './math-lens';
import { acceptanceLens } from './acceptance-lens';
import { diagramLens } from './diagram-lens';
import { flowchartLens, sequenceLens, classLens } from './mermaid';
import { tableLens } from './table-lens';
import { policyLens } from './policy-lens';
import { questionLens } from './question-lens';
import { decisionLens } from './decision-lens';

export function initializeLenses(): { registry: LensRegistry; converter: LensConverter } {
  const registry = new LensRegistry();
  
  // Register in priority order (highest first)
  registry.register(diagramLens);      // 70
  registry.register(acceptanceLens);    // 65
  registry.register(entityLens);       // 60
  registry.register(flowchartLens);    // 61
  registry.register(sequenceLens);     // 60
  registry.register(classLens);        // 59
  registry.register(operationLens);    // 55
  registry.register(codeLens);         // 50
  registry.register(mathLens);         // 45
  registry.register(tableLens);        // 40
  registry.register(decisionLens);    // 32
  registry.register(questionLens);     // 30
  registry.register(policyLens);       // 35
  registry.register(proseLens);        // 0 (fallback)
  
  const converter = new LensConverter(registry);
  
  return { registry, converter };
}

// Create default instance
const { registry: defaultRegistry, converter: defaultConverter } = initializeLenses();

export { LensRegistry, LensConverter };
export { defaultRegistry, defaultConverter };

// Re-export lens implementations
export { proseLens } from './prose-lens';
export { codeLens } from './code-lens';
export { entityLens } from './entity-lens';
export { operationLens } from './operation-lens';
export { mathLens } from './math-lens';
export { acceptanceLens } from './acceptance-lens';
export { diagramLens, detectDiagramType } from './diagram-lens';
export { flowchartLens, sequenceLens, classLens } from './mermaid';
export { tableLens } from './table-lens';
export { policyLens } from './policy-lens';
export { questionLens } from './question-lens';
export { decisionLens } from './decision-lens';

// Export types
export type { 
  Lens, 
  Block, 
  LensContext, 
  LensOptions, 
  LensMatch,
  FieldDef,
  ParamDef,
  AcceptanceSection,
  DiagramMetadata
} from './types';
