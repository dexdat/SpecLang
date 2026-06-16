# Bootstrap Phase 0.34: Layer Abstraction Concepts

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.34 of the bootstrap process.

**Prerequisites**: 
- Phase 0.33 (Layer System Overview) complete

## Your Task
Implement layer abstraction concepts - how layers interact with other metadata fields, how they guide agent behavior, and how specs evolve through layers as they mature.

## Read These Specs First
1. `specs/semantic-definitions.spec.dir/layer-mapping.spec.md` - Layer semantics and interactions
2. `specs/semantic-definitions.spec.dir/project-levels.spec.md` - Project level and agent support
3. `docs/prompts/phase-0.33-layers-overview.md` - Layer implementation

## What to Build

### Files to Create
```
src/layers/
├── abstraction.ts         # Abstraction concepts
├── agent-guidance.ts      # Agent guidance per layer
├── evolution.ts           # Spec evolution through layers
├── semantics.ts           # Layer semantic definitions
└── cross-field.ts          # Cross-field validation

tests/layers/
├── abstraction.test.ts
├── agent-guidance.test.ts
└── evolution.test.ts
```

### Requirements

#### 1. Abstraction Concepts (abstraction.ts)
```typescript
interface AbstractionConcept {
  layer: Layer;
  abstractionLevel: 'vision' | 'design' | 'implementation' | 'artifact';
  detailLevel: number;       // 1-10 scale (10 = most detailed)
  generativity: 'none' | 'template' | 'full';
  stability: 'volatile' | 'evolving' | 'stable' | 'frozen';
}

const ABSTRACTION_CONCEPTS: Record<Layer, AbstractionConcept> = {
  0: { abstractionLevel: 'vision', detailLevel: 1, generativity: 'none', stability: 'volatile' },
  1: { abstractionLevel: 'design', detailLevel: 2, generativity: 'none', stability: 'evolving' },
  2: { abstractionLevel: 'design', detailLevel: 3, generativity: 'none', stability: 'evolving' },
  3: { abstractionLevel: 'design', detailLevel: 5, generativity: 'none', stability: 'evolving' },
  4: { abstractionLevel: 'implementation', detailLevel: 6, generativity: 'template', stability: 'stable' },
  5: { abstractionLevel: 'implementation', detailLevel: 8, generativity: 'full', stability: 'stable' },
  6: { abstractionLevel: 'artifact', detailLevel: 10, generativity: 'full', stability: 'frozen' },
  7: { abstractionLevel: 'design', detailLevel: 4, generativity: 'none', stability: 'evolving' },
  8: { abstractionLevel: 'implementation', detailLevel: 7, generativity: 'template', stability: 'stable' },
  9: { abstractionLevel: 'artifact', detailLevel: 10, generativity: 'full', stability: 'frozen' },
  10: { abstractionLevel: 'implementation', detailLevel: 9, generativity: 'template', stability: 'stable' }
};

class AbstractionResolver {
  getConcept(layer: Layer): AbstractionConcept {
    return ABSTRACTION_CONCEPTS[layer];
  }
  
  getDetailLevel(layer: Layer): number {
    return ABSTRACTION_CONCEPTS[layer].detailLevel;
  }
  
  canEdit(layer: Layer): boolean {
    return ABSTRACTION_CONCEPTS[layer].stability !== 'frozen';
  }
  
  shouldGenerate(layer: Layer): boolean {
    return ABSTRACTION_CONCEPTS[layer].generativity === 'full';
  }
}
```

#### 2. Agent Guidance (agent-guidance.ts)
```typescript
interface LayerAgentGuidance {
  layer: Layer;
  role: AgentRole;
  responsibilities: string[];
  tools: string[];
  approvalRequired: ApprovalLevel;
  cascadeDepth: number;
  qualityChecks: string[];
}

type ApprovalLevel = 'none' | 'non_critical' | 'major_changes' | 'all';

const LAYER_AGENT_GUIDANCE: Record<Layer, LayerAgentGuidance> = {
  0: {
    layer: 0,
    role: 'strategist',
    responsibilities: [
      'Define project vision and goals',
      'Identify key stakeholders',
      'Establish success criteria'
    ],
    tools: ['speclang index', 'speclang search'],
    approvalRequired: 'all',
    cascadeDepth: 1,
    qualityChecks: ['Vision clarity', 'Goal measurability']
  },
  1: {
    layer: 1,
    role: 'architect',
    responsibilities: [
      'Break down vision into features',
      'Define feature boundaries',
      'Identify dependencies between features'
    ],
    tools: ['speclang index', 'speclang search', 'speclang expand'],
    approvalRequired: 'major_changes',
    cascadeDepth: 2,
    qualityChecks: ['Feature independence', 'Clear boundaries']
  },
  2: {
    layer: 2,
    role: 'designer',
    responsibilities: [
      'Design entities and operations',
      'Define data models',
      'Create component interfaces'
    ],
    tools: ['speclang parse', 'speclang expand', 'lens entity'],
    approvalRequired: 'major_changes',
    cascadeDepth: 3,
    qualityChecks: ['Entity consistency', 'Operation completeness']
  },
  3: {
    layer: 3,
    role: 'designer',
    responsibilities: [
      'Write pseudocode and algorithms',
      'Define logic flows',
      'Document edge cases'
    ],
    tools: ['speclang parse', 'lens code', 'speclang validate'],
    approvalRequired: 'non_critical',
    cascadeDepth: 4,
    qualityChecks: ['Algorithm correctness', 'Edge case coverage']
  },
  4: {
    layer: 4,
    role: 'implementer',
    responsibilities: [
      'Map pseudocode to language constructs',
      'Choose data structures',
      'Define implementation strategy'
    ],
    tools: ['speclang parse', 'target languages', 'speclang validate'],
    approvalRequired: 'non_critical',
    cascadeDepth: 5,
    qualityChecks: ['Language idioms', 'Performance considerations']
  },
  5: {
    layer: 5,
    role: 'implementer',
    responsibilities: [
      'Write code templates',
      'Define function signatures',
      'Create type definitions'
    ],
    tools: ['speclang generate', 'template engine', 'speclang validate'],
    approvalRequired: '    cascadeDepth: 6,
   non_critical',
 qualityChecks: ['Template correctness', 'Type safety']
  },
  6: {
    layer: 6,
    role: 'generator',
    responsibilities: [
      'Generate final code from templates',
      'Ensure code compiles',
      'Apply formatting and style'
    ],
    tools: ['speclang generate', 'code formatter', 'linter'],
    approvalRequired: 'none',
    cascadeDepth: 7,
    qualityChecks: ['Compilation', 'Style compliance']
  },
  7: {
    layer: 7,
    role: 'tester',
    responsibilities: [
      'Define test scenarios',
      'Write acceptance criteria',
      'Plan test coverage'
    ],
    tools: ['speclang parse', 'speclang expand', 'lens acceptance'],
    approvalRequired: 'non_critical',
    cascadeDepth: 4,
    qualityChecks: ['Coverage completeness', 'Criteria clarity']
  },
  8: {
    layer: 8,
    role: 'tester',
    responsibilities: [
      'Write test templates',
      'Define test fixtures',
      'Plan test data'
    ],
    tools: ['speclang generate', 'template engine'],
    approvalRequired: 'non_critical',
    cascadeDepth: 5,
    qualityChecks: ['Test isolation', 'Fixture correctness']
  },
  9: {
    layer: 9,
    role: 'generator',
    responsibilities: [
      'Generate test code',
      'Ensure tests compile',
      'Verify test structure'
    ],
    tools: ['speclang generate', 'test runner'],
    approvalRequired: 'none',
    cascadeDepth: 6,
    qualityChecks: ['Compilation', 'Test structure']
  },
  10: {
    layer: 10,
    role: 'operator',
    responsibilities: [
      'Define infrastructure',
      'Configure deployment',
      'Set up monitoring'
    ],
    tools: ['speclang parse', 'k8s tools', 'terraform'],
    approvalRequired: 'major_changes',
    cascadeDepth: 3,
    qualityChecks: ['Security', 'Scalability']
  }
};

class AgentGuidanceResolver {
  getGuidance(layer: Layer): LayerAgentGuidance {
    return LAYER_AGENT_GUIDANCE[layer];
  }
  
  getRequiredApproval(layer: Layer, changeType: 'minor' | 'major'): boolean {
    const guidance = this.getGuidance(layer);
    
    if (changeType === 'minor') {
      return guidance.approvalRequired === 'all' || guidance.approvalRequired === 'major_changes';
    }
    
    return guidance.approvalRequired === 'all';
  }
  
  getMaxCascadeDepth(layer: Layer): number {
    return LAYER_AGENT_GUIDANCE[layer].cascadeDepth;
  }
}
```

#### 3. Spec Evolution (evolution.ts)
```typescript
interface EvolutionStage {
  layer: Layer;
  name: string;
  description: string;
  preconditions: string[];
  postconditions: string[];
  autoPromote: boolean;
}

const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    layer: 0,
    name: 'Vision Defined',
    description: 'Project vision and goals established',
    preconditions: ['Vision document exists'],
    postconditions: ['Features can be defined'],
    autoPromote: false
  },
  {
    layer: 1,
    name: 'Feature Breakdown',
    description: 'Features identified and organized',
    preconditions: ['Vision defined', 'Stakeholders aligned'],
    postconditions: ['Components can be designed'],
    autoPromote: false
  },
  {
    layer: 2,
    name: 'Component Design',
    description: 'Entities and operations designed',
    preconditions: ['Features defined', 'Dependencies known'],
    postconditions: ['Algorithms can be detailed'],
    autoPromote: false
  },
  {
    layer: 3,
    name: 'Algorithm Detail',
    description: 'Pseudocode and logic documented',
    preconditions: ['Components designed'],
    postconditions: ['Implementation approach clear'],
    autoPromote: false
  },
  {
    layer: 4,
    name: 'Implementation Mapping',
    description: 'Language-specific implementation planned',
    preconditions: ['Algorithms complete'],
    postconditions: ['Code templates can be created'],
    autoPromote: true
  },
  {
    layer: 5,
    name: 'Code Specification',
    description: 'Code templates ready',
    preconditions: ['Implementation mapped'],
    postconditions: ['Code can be generated'],
    autoPromote: true
  },
  {
    layer: 6,
    name: 'Code Generated',
    description: 'Production code generated',
    preconditions: ['Code spec complete'],
    postconditions: ['Tests can be generated'],
    autoPromote: false
  }
];

class SpecEvolutionTracker {
  private history: EvolutionRecord[] = [];
  
  recordTransition(specId: string, from: Layer, to: Layer, trigger: string): void {
    this.history.push({
      specId,
      from,
      to,
      trigger,
      timestamp: new Date()
    });
  }
  
  getEvolutionPath(specId: string): EvolutionRecord[] {
    return this.history.filter(r => r.specId === specId);
  }
  
  canAutoPromote(layer: Layer): boolean {
    const stage = EVOLUTION_STAGES.find(s => s.layer === layer);
    return stage?.autoPromote || false;
  }
  
  getNextStage(layer: Layer): EvolutionStage | null {
    const idx = EVOLUTION_STAGES.findIndex(s => s.layer === layer);
    if (idx < 0 || idx >= EVOLUTION_STAGES.length - 1) return null;
    return EVOLUTION_STAGES[idx + 1];
  }
  
  validateTransition(from: Layer, to: Layer): TransitionValidation {
    if (to !== from + 1) {
      return { valid: false, reason: 'Layers must advance one at a time' };
    }
    
    const stage = EVOLUTION_STAGES.find(s => s.layer === from);
    if (!stage) {
      return { valid: false, reason: 'Unknown source layer' };
    }
    
    return { valid: true, nextStage: this.getNextStage(from) };
  }
}

interface EvolutionRecord {
  specId: string;
  from: Layer;
  to: Layer;
  trigger: string;
  timestamp: Date;
}

interface TransitionValidation {
  valid: boolean;
  reason?: string;
  nextStage?: EvolutionStage;
}
```

#### 4. Layer Semantics (semantics.ts)
```typescript
class LayerSemantics {
  getSemanticDescription(layer: Layer): string {
    const definitions: Record<Layer, string> = {
      0: 'Strategic intent - why we are building this',
      1: 'Feature scope - what we are building',
      2: 'Component design - how pieces fit together',
      3: 'Detailed logic - how it works internally',
      4: 'Implementation plan - how to build it in code',
      5: 'Code template - the actual code structure',
      6: 'Runnable code - the final product',
      7: 'Test intent - what should be verified',
      8: 'Test template - how to write tests',
      9: 'Test code - executable test cases',
      10: 'Infrastructure - how to deploy and operate'
    };
    return definitions[layer];
  }
  
  getRelationshipDescription(parent: Layer, child: Layer): string {
    const relationships: Record<string, string> = {
      '0-1': 'Vision is decomposed into features',
      '1-2': 'Features are designed as components',
      '2-3': 'Components are detailed with algorithms',
      '3-4': 'Algorithms map to implementations',
      '4-5': 'Implementations become code templates',
      '5-6': 'Templates generate actual code',
      '6-7': 'Code informs test requirements',
      '7-8': 'Test intent creates test templates',
      '8-9': 'Templates generate test code',
      '0-10': 'Vision guides infrastructure decisions'
    };
    return relationships[`${parent}-${child}`] || 'Related but non-sequential';
  }
  
  isValidParentChild(parent: Layer, child: Layer): boolean {
    // Allow any layer to reference any other layer
    // But warn about unusual relationships
    if (child === parent) return true;
    if (child > parent + 2) {
      return false; // Too big a jump
    }
    return true;
  }
}
```

#### 5. Cross-Field Validation (cross-field.ts)
```typescript
class LayerCrossFieldValidator {
  private semantics: LayerSemantics;
  
  constructor() {
    this.semantics = new LayerSemantics();
  }
  
  validateComplete(spec: ParsedSpec): CompleteValidationResult {
    const layer = spec.metadata.layer as Layer;
    const projectLevel = spec.metadata.project_level as MaturityLevel;
    const agentSupport = spec.metadata.agent_support as AgentSupport;
    const tags = spec.metadata.tags as string[];
    
    const issues: ValidationIssue[] = [];
    
    // Layer + Project Level
    if (layer >= 5 && projectLevel && projectLevel !== 'Production' && 
        projectLevel !== 'Startup' && projectLevel !== 'SMB' && 
        projectLevel !== 'MSB' && projectLevel !== 'Enterprise') {
      if (projectLevel === 'POC' || projectLevel === 'MVP' || projectLevel === 'Alpha') {
        issues.push({
          severity: 'warning',
          field: 'layer',
          message: `Layer ${layer} (code generation) typically requires Production-level maturity`
        });
      }
    }
    
    // Layer + Agent Support
    if (layer >= 5 && agentSupport === 'human_only') {
      issues.push({
        severity: 'warning',
        field: 'agent_support',
        message: `Layer ${layer} (code generation) is inefficient with human_only support`
      });
    }
    
    // Layer + Tags consistency
    if (layer <= 2 && tags?.includes('generated')) {
      issues.push({
        severity: 'error',
        field: 'tags',
        message: 'Generated tags not allowed on high-abstraction layers'
      });
    }
    
    if (layer >= 6 && layer <= 9 && !tags?.includes('generated')) {
      issues.push({
        severity: 'warning',
        field: 'tags',
        message: 'Generated layers should have generated tag'
      });
    }
    
    return { valid: issues.filter(i => i.severity === 'error').length === 0, issues };
  }
}

interface ValidationIssue {
  severity: 'error' | 'warning';
  field: string;
  message: string;
}
```

## Test Cases
1. Abstraction concepts correctly map to layers
2. Agent guidance provides correct responsibilities
3. Evolution stages have correct pre/post conditions
4. Layer semantics provide meaningful descriptions
5. Cross-field validation detects mismatches
6. Parent-child relationships validated
7. Auto-promote flags correct for code generation layers

## CLI Commands
```bash
# Show layer abstraction details
speclang layer --abstraction 5

# Show agent guidance for layer
speclang layer --guidance 3

# Show evolution path
speclang layer --evolution 0-6

# Validate cross-field consistency
speclang layer --validate-cross-field specs/auth.spec.md

# Show layer semantics
speclang layer --semantics 2
```

## Validation
```bash
bun test tests/layers/abstraction.test.ts
```

## Output Format
After completing, output:
1. Abstraction concepts implemented
2. Agent guidance matrix
3. Evolution paths defined
4. Test results
