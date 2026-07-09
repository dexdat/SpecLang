# Layer System

SpecLang organizes specifications into 10 abstraction layers, from high-level intent to low-level implementation. Each layer serves a distinct purpose in the overall architecture.

## Layer Overview

| Layer | Name | Purpose | Example Files |
|-------|------|---------|---------------|
| 0 | North Star | Root project intent and vision | `project.scl` |
| 1 | Component Architecture | High-level component design | `components.spec.md`, `*.components.*` |
| 2 | Domain Models | Domain entity and value object definitions | `entities.spec.yaml`, `models.spec.yaml` |
| 3 | Interface Specifications | API and interface definitions | `api.spec.yaml`, `interface.*.spec.yaml` |
| 4 | Business Logic | Business rules and workflows | `workflows.spec.md`, `business.*.spec.md` |
| 5 | Code Mapping | Direct mapping to implementation | `*.ts.spec`, `*.go.spec`, `*.py.spec` |
| 6 | Generated Implementation | Generated target language code | `*.ts`, `*.go`, `*.py` |
| 7 | Test Specifications | Test definitions in natural language | `*.test.spec.md` |
| 8 | Generated Tests | Generated test code | `*_test.go`, `*.test.ts`, `*_test.py` |
| 9 | Pipeline Configuration | Build and deployment configuration | `pipeline.yaml`, `build.yaml`, `deploy.*.yaml` |

## Layer Dependencies

Layers form a directed acyclic graph (DAG) where a spec at layer N can only depend on specs at layers 0 through N. Dependencies cannot go upward (no backward dependencies).

### Valid Dependency Examples
- Layer 1 → Layer 0 (valid)
- Layer 5 → Layer 3 (valid)
- Layer 5 → Layer 5 (valid)
- Layer 2 → Layer 4 (invalid – cannot depend on higher layer)

### Dependency Validation Rules
1. **No Backward Dependencies**: A spec cannot depend on a spec at a higher layer.
2. **Layer Field Required**: Every spec must have a valid `layer` field (0‑9).
3. **Parent Chain Valid**: Every dependency chain must end at layer 0 (North Star).
4. **No Circular Dependencies**: The dependency graph must be acyclic.
5. **Monotonic Growth**: When a spec creates children, the children must be at equal or higher layers.

## Layer Auto‑Detection

When a spec lacks an explicit `layer` field, the system can auto‑detect it based on:

### File Path Patterns
- `project.scl` → layer 0
- `*.components.*` → layer 1
- `*entities*.spec.*` → layer 2
- `*api*.spec.*` → layer 3
- `*.workflows*.spec.*` → layer 4
- `*.{ext}.spec` → layer 5
- `*.test.spec.*` → layer 7
- `pipeline*.yaml` → layer 9

### Content Keywords
- Contains `northstar`, `intent`, `vision`, `goals` → layer 0
- Contains `component`, `service`, `module` → layer 1
- Contains `entity`, `value object`, `aggregate`, `domain model` → layer 2
- Contains `api`, `interface`, `endpoint`, `rest`, `graphql` → layer 3
- Contains `business`, `workflow`, `use case`, `rule` → layer 4
- Contains `test`, `scenario`, `given`, `when`, `then` → layer 7
- Contains `build`, `deploy`, `pipeline`, `ci`, `cd` → layer 9

### Dependency Inference
If a spec has dependencies, its minimum layer is `min(dependency layers) + 1`.

## Layer Decision Tree

Use this decision tree to determine the correct layer for a new spec:

1. **Is this the root project intent?**  
   YES → Layer 0 (North Star)  
   NO → Continue

2. **Does this define components/services?**  
   YES → Layer 1 (Component Architecture)  
   NO → Continue

3. **Does this define domain entities?**  
   YES → Layer 2 (Domain Models)  
   NO → Continue

4. **Does this define APIs/interfaces?**  
   YES → Layer 3 (Interface Specifications)  
   NO → Continue

5. **Does this define business logic?**  
   YES → Layer 4 (Business Logic)  
   NO → Continue

6. **Does this directly map to code?**  
   YES → Layer 5 (Code Mapping)  
   NO → Continue

7. **Is this generated code?**  
   YES → Layer 6 (Generated Implementation)  
   NO → Continue

8. **Does this define tests?**  
   YES → Layer 7 (Test Specifications)  
   NO → Continue

9. **Is this generated test code?**  
   YES → Layer 8 (Generated Tests)  
   NO → Continue

10. **Does this define build/deploy?**  
    YES → Layer 9 (Pipeline Configuration)  
    NO → Unknown type – review spec content

## Layer Transitions and Maturity Levels

Different project maturity levels require different maximum layers:

| Maturity Level | Minimum Layer | Maximum Layer | Notes |
|----------------|---------------|---------------|-------|
| POC            | 0             | 3             | Minimal structure |
| MVP            | 0             | 5             | Core features |
| Alpha          | 0             | 7             | Testing enabled |
| Beta           | 0             | 8             | Full coverage |
| Production     | 0             | 9             | Complete pipeline |
| Startup        | 0             | 5             | Rapid iteration |
| SMB            | 0             | 7             | Established processes |
| Enterprise     | 0             | 9             | Strict governance |

## Cross‑Layer Interactions

### Validation Interactions
- **Layer 0‑1**: North star must reference all layer 1 specs
- **Layer 1‑2**: Components must own entities they define
- **Layer 2‑3**: Entities must be API‑compatible
- **Layer 3‑4**: APIs must cover all use cases
- **Layer 4‑5**: Use cases must map to code
- **Layer 5‑6**: Code specs must generate valid code
- **Layer 6‑7**: Generated code must be testable
- **Layer 7‑8**: Test specs must generate passing tests
- **Layer 8‑9**: Tests must be runnable by pipeline

### Ownership Interactions
- **Layer 0**: Owned by human (project lead)
- **Layer 1‑4**: Owned by spec writers (AI or human)
- **Layer 5**: Owned by code generators
- **Layer 6**: Owned by generated output (read‑only)
- **Layer 7**: Owned by test writers
- **Layer 8**: Owned by generated output (read‑only)
- **Layer 9**: Owned by pipeline system

## Implementation

The layer system is implemented in `src/layers/`:

- `types.ts` – Layer enum, type definitions
- `validator.ts` – Validation rules and dependency checking
- `resolver.ts` – Auto‑detection from file path, content, and dependencies
- `index.ts` – Public API

### Usage

```typescript
import { Layer, validateLayer, resolveLayer } from '../layers';

// Validate a layer value
const result = validateLayer(5); // { valid: true, errors: [], warnings: [] }

// Resolve layer from file path
const layer = resolveLayer({ filePath: 'specs/auth.spec.md' });

// Check layer dependencies
const valid = validateLayerDependency(Layer.CODE_MAPPING, Layer.BUSINESS_LOGIC);
```

## See Also

- [SpecLang Headers](headers.md) – Layer field in universal headers
- [Spec Format](spec-format.md) – Layer system in spec structure
- [Cascade System](cascade.md) – How layers trigger cascade
- [Validation Rules](validation.md) – Layer validation rules