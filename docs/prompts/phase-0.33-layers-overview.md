# Bootstrap Phase 0.33: Layer System Overview

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.33 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.32 complete
- Phase 0.25 (Project Maturity Levels) complete
- Parser, indexer, headers validation working

## Your Task
Implement the Layer System - a 0-10 abstraction scale that defines the purpose and depth of each spec. Layers help agents understand what kind of content a spec contains and how it should be processed.

## Read These Specs First
1. `specs/layer-definitions.spec.md` - Layer overview
2. `specs/semantic-definitions.spec.dir/layer-mapping.spec.md` - Layer mapping table
3. `specs/headers.spec.md` - Header fields including layer

## What to Build

### Files to Create
```
src/layers/
├── index.ts              # Layer system entry point
├── types.ts              # Layer types
├── definitions.ts        # Layer 0-10 definitions
├── validator.ts          # Layer validation
├── interactions.ts       # Cross-field interactions
└── transitions.ts        # Layer transition handling

tests/layers/
├── definitions.test.ts
├── validator.test.ts
└── interactions.test.ts
```

### Requirements

#### 1. Layer Types (types.ts)
```typescript
type Layer = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface LayerDefinition {
  layer: Layer;
  name: string;
  purpose: string;
  exampleSpec: string;
  contentTypes: string[];
  agentRole: AgentRole;
  requiredFields: string[];
  validationStrictness: 'none' | 'warning' | 'error';
}

type AgentRole = 
  | 'strategist'
  | 'architect'
  | 'designer'
  | 'implementer'
  | 'generator'
  | 'tester'
  | 'operator';

interface LayerContext {
  layer: Layer;
  projectLevel: MaturityLevel;
  agentSupport: AgentSupport;
}
```

#### 2. Layer Definitions (definitions.ts)
```typescript
const LAYER_DEFINITIONS: LayerDefinition[] = [
  {
    layer: 0,
    name: 'North Star',
    purpose: 'Project intent, vision, and high-level goals',
    exampleSpec: 'project.scl',
    contentTypes: ['vision', 'goals', 'requirements'],
    agentRole: 'strategist',
    requiredFields: ['id', 'version', 'short'],
    validationStrictness: 'warning'
  },
  {
    layer: 1,
    name: 'Feature',
    purpose: 'Feature breakdown and domain organization',
    exampleSpec: 'auth.spec.md',
    contentTypes: ['feature', 'domain'],
    agentRole: 'architect',
    requiredFields: ['id', 'version', 'layer', 'short'],
    validationStrictness: 'warning'
  },
  {
    layer: 2,
    name: 'Component',
    purpose: 'Entities, operations, and component design',
    exampleSpec: 'auth/entities.spec.yaml',
    contentTypes: ['entity', 'operation', 'component'],
    agentRole: 'designer',
    requiredFields: ['id', 'version', 'layer', 'tags'],
    validationStrictness: 'warning'
  },
  {
    layer: 3,
    name: 'Detail',
    purpose: 'Pseudocode, algorithms, and detailed logic',
    exampleSpec: 'auth/login-algorithm.spec.yaml',
    contentTypes: ['algorithm', 'pseudocode', 'logic'],
    agentRole: 'designer',
    requiredFields: ['id', 'version', 'layer'],
    validationStrictness: 'error'
  },
  {
    layer: 4,
    name: 'Implementation',
    purpose: 'Language mapping and implementation decisions',
    exampleSpec: 'auth/login-implementation.spec.yaml',
    contentTypes: ['implementation', 'mapping'],
    agentRole: 'implementer',
    requiredFields: ['id', 'version', 'layer', 'target'],
    validationStrictness: 'error'
  },
  {
    layer: 5,
    name: 'Code Spec',
    purpose: 'Direct code mapping, near-final code structure',
    exampleSpec: 'auth/login.go.spec',
    contentTypes: ['code-spec', 'template'],
    agentRole: 'implementer',
    requiredFields: ['id', 'version', 'layer', 'target', 'template'],
    validationStrictness: 'error'
  },
  {
    layer: 6,
    name: 'Generated Code',
    purpose: 'Output code, generated artifacts',
    exampleSpec: 'generated/go/auth/login.go',
    contentTypes: ['generated', 'code'],
    agentRole: 'generator',
    requiredFields: ['id', 'version', 'parent'],
    validationStrictness: 'none'
  },
  {
    layer: 7,
    name: 'Test Spec',
    purpose: 'Test descriptions and acceptance criteria',
    exampleSpec: 'auth/login.test.spec.md',
    contentTypes: ['test-spec', 'acceptance'],
    agentRole: 'tester',
    requiredFields: ['id', 'version', 'layer', 'target'],
    validationStrictness: 'warning'
  },
  {
    layer: 8,
    name: 'Test Code Spec',
    purpose: 'Test code mapping and templates',
    exampleSpec: 'auth/login.test.go.spec',
    contentTypes: ['test-code-spec', 'test-template'],
    agentRole: 'tester',
    requiredFields: ['id', 'version', 'layer', 'target', 'template'],
    validationStrictness: 'error'
  },
  {
    layer: 9,
    name: 'Generated Test Code',
    purpose: 'Generated test code',
    exampleSpec: 'generated/go/auth/login_test.go',
    contentTypes: ['generated', 'test'],
    agentRole: 'generator',
    requiredFields: ['id', 'version', 'parent'],
    validationStrictness: 'none'
  },
  {
    layer: 10,
    name: 'Deployment/Ops',
    purpose: 'Infrastructure, deployment, and operations',
    exampleSpec: 'deployment/k8s.spec.yaml',
    contentTypes: ['infrastructure', 'deployment', 'ops'],
    agentRole: 'operator',
    requiredFields: ['id', 'version', 'layer'],
    validationStrictness: 'error'
  }
];

function getLayerDefinition(layer: Layer): LayerDefinition {
  return LAYER_DEFINITIONS.find(d => d.layer === layer)!;
}

function getLayerName(layer: Layer): string {
  return getLayerDefinition(layer).name;
}
```

#### 3. Layer Validator (validator.ts)
```typescript
class LayerValidator {
  validate(spec: ParsedSpec): ValidationResult {
    const layer = spec.metadata.layer as Layer;
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (layer === undefined) {
      errors.push('Missing required field: layer');
      return { valid: false, errors, warnings };
    }
    
    if (layer < 0 || layer > 10 || !Number.isInteger(layer)) {
      errors.push(`Invalid layer value: ${layer}. Must be 0-10 integer.`);
      return { valid: false, errors, warnings };
    }
    
    const definition = getLayerDefinition(layer);
    
    // Check required fields for this layer
    for (const field of definition.requiredFields) {
      if (!spec.metadata[field]) {
        if (definition.validationStrictness === 'error') {
          errors.push(`Layer ${layer} requires field: ${field}`);
        } else {
          warnings.push(`Layer ${layer} recommends field: ${field}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  suggestLayer(spec: ParsedSpec): Layer {
    // Heuristics based on content
    const content = spec.content.toLowerCase();
    const path = spec.filePath.toLowerCase();
    
    if (path.includes('generated/')) return 6;
    if (path.includes('test') && path.includes('generated')) return 9;
    if (path.includes('test.spec')) return 7;
    if (path.includes('test.') && path.includes('.spec')) return 8;
    if (path.includes('deployment') || path.includes('k8s')) return 10;
    if (path.includes('.go.spec')) return 5;
    if (content.includes('pseudocode') || content.includes('algorithm')) return 3;
    if (content.includes('entity') || content.includes('operation')) return 2;
    if (path.includes('.spec.md') && !path.includes('/')) return 1;
    if (path.endsWith('.scl') || path.endsWith('.vision')) return 0;
    
    return 1; // Default to Feature
  }
}
```

#### 4. Layer Interactions (interactions.ts)
```typescript
interface LayerProjectLevelRule {
  layer: Layer;
  minProjectLevel?: MaturityLevel;
  maxProjectLevel?: MaturityLevel;
  warning?: string;
}

const LAYER_PROJECT_LEVEL_RULES: LayerProjectLevelRule[] = [
  { layer: 0, maxProjectLevel: 'Enterprise', warning: 'Layer 0 typically for early-stage projects' },
  { layer: 5, minProjectLevel: 'Beta', warning: 'Layer 5 requires higher maturity' },
  { layer: 10, minProjectLevel: 'Production', warning: 'Deployment specs need production level' }
];

interface LayerAgentSupportRule {
  layer: Layer;
  recommended: AgentSupport[];
  warning?: string;
}

const LAYER_AGENT_SUPPORT_RULES: LayerAgentSupportRule[] = [
  { layer: 0, recommended: ['human_only', 'agent_assisted'], warning: 'Strategic specs benefit from human input' },
  { layer: 1, recommended: ['agent_assisted', 'agent_autonomous'] },
  { layer: 5, recommended: ['agent_autonomous'], warning: 'Code specs can be autonomous' },
  { layer: 6, recommended: ['agent_autonomous'] },
  { layer: 9, recommended: ['agent_autonomous'] }
];

class LayerInteractionChecker {
  checkCrossField(spec: ParsedSpec): CrossFieldResult {
    const layer = spec.metadata.layer as Layer;
    const projectLevel = spec.metadata.project_level as MaturityLevel;
    const agentSupport = spec.metadata.agent_support as AgentSupport;
    
    const results: CrossFieldCheck[] = [];
    
    // Check layer + project_level
    for (const rule of LAYER_PROJECT_LEVEL_RULES) {
      if (rule.layer === layer) {
        if (rule.minProjectLevel && this.compareLevel(projectLevel, rule.minProjectLevel) < 0) {
          results.push({
            type: 'warning',
            message: rule.warning || `Layer ${layer} recommends ${rule.minProjectLevel}+`
          });
        }
      }
    }
    
    // Check layer + agent_support
    for (const rule of LAYER_AGENT_SUPPORT_RULES) {
      if (rule.layer === layer && !rule.recommended.includes(agentSupport)) {
        results.push({
          type: 'warning',
          message: rule.warning || `Layer ${layer} works best with ${rule.recommended.join(' or ')}`
        });
      }
    }
    
    return { checks: results };
  }
  
  private compareLevel(a: MaturityLevel, b: MaturityLevel): number {
    const order: Record<MaturityLevel, number> = {
      'POC': 0, 'MVP': 1, 'Alpha': 2, 'Beta': 3, 'Production': 4,
      'Startup': 3, 'SMB': 4, 'MSB': 5, 'Enterprise': 6
    };
    return (order[a] || 0) - (order[b] || 0);
  }
}
```

#### 5. Layer Transitions (transitions.ts)
```typescript
interface LayerTransition {
  from: Layer;
  to: Layer;
  description: string;
  agentBehavior: string;
}

const LAYER_TRANSITIONS: LayerTransition[] = [
  { from: 0, to: 1, description: 'Vision to Feature breakdown', agentBehavior: 'Expand vision into features' },
  { from: 1, to: 2, description: 'Feature to Component design', agentBehavior: 'Design entities and operations' },
  { from: 2, to: 3, description: 'Component to Detail algorithms', agentBehavior: 'Write pseudocode and logic' },
  { from: 3, to: 4, description: 'Detail to Implementation mapping', agentBehavior: 'Map to language constructs' },
  { from: 4, to: 5, description: 'Implementation to Code Spec', agentBehavior: 'Create code templates' },
  { from: 5, to: 6, description: 'Code Spec to Generated Code', agentBehavior: 'Generate final code' },
  { from: 6, to: 9, description: 'Code to Test generation', agentBehavior: 'Generate tests from code' }
];

class LayerTransitionHandler {
  getNextLayer(current: Layer, direction: 'forward' | 'backward'): Layer | null {
    const idx = LAYER_DEFINITIONS.findIndex(d => d.layer === current);
    if (idx < 0) return null;
    
    const nextIdx = direction === 'forward' ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= LAYER_DEFINITIONS.length) return null;
    
    return LAYER_DEFINITIONS[nextIdx].layer;
  }
  
  getTransitionPath(from: Layer, to: Layer): LayerTransition[] {
    const transitions: LayerTransition[] = [];
    let current = from;
    
    while (current < to) {
      const next = this.getNextLayer(current, 'forward');
      if (next === null) break;
      
      const transition = LAYER_TRANSITIONS.find(t => t.from === current && t.to === next);
      if (transition) transitions.push(transition);
      
      current = next;
    }
    
    return transitions;
  }
}
```

## Test Cases
1. Layer 0 (North Star) has correct name and purpose
2. Layer 10 (Deployment) has correct agent role
3. Layer validation detects missing required fields
4. Layer validator suggests correct layer from content
5. Cross-field check warns on layer + project_level mismatch
6. Cross-field check warns on layer + agent_support mismatch
7. Layer transitions provide correct path
8. Invalid layer values caught by validator

## CLI Commands
```bash
# Check spec layer
speclang layer specs/auth.spec.md

# Suggest appropriate layer
speclang layer --suggest specs/auth.spec.md

# Validate layer requirements
speclang layer --validate specs/auth.spec.md

# Show layer definition
speclang layer --info 5

# List all layers
speclang layer --list
```

## Validation
```bash
bun test tests/layers/
```

## Output Format
After completing, output:
1. Files created
2. Layer definitions summary
3. Validation rules implemented
4. Test results
