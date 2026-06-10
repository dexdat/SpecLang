---
id: "@speclang/layer"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [layer, system, overview, depth, abstraction]
short: "Layer System Overview - The 10 abstraction layers and their purposes"
---
# Layer System Overview

The layer system provides a structured way to organize specs across different abstraction levels. Each layer serves a distinct purpose in the overall architecture.

## Layer Architecture

SpecLang organizes specs into 10 abstraction layers, from high-level intent to low-level implementation:

### Layer 0: North Star (Root Intent)
**Purpose:** Top-level project intent and vision

The root specification that defines what the project is and why it exists.
- Contains high-level goals and vision
- Defines project scope and boundaries
- References all major components
- Must be human-authored initially

**Example:**
```yaml
id: @northstar/myapp
layer: 0
short: "North Star: My Application"
```

### Layer 1: Component Architecture
**Purpose:** High-level component design

Defines major components and their relationships.
- Lists core modules and services
- Defines component boundaries
- Establishes communication patterns
- References implementation specs

**Example:**
```yaml
id: @speclang/components
layer: 1
depends_on: ["@northstar/myapp"]
```

### Layer 2: Domain Models
**Purpose:** Domain entity and value object definitions

Defines the core domain concepts.
- Entity definitions
- Value objects
- Domain events
- Aggregate roots

**Example:**
```yaml
id: @speclang/entities
layer: 2
depends_on: ["@speclang/components"]
```

### Layer 3: Interface Specifications
**Purpose:** API and interface definitions

Defines how components interact.
- REST API specifications
- GraphQL schemas
- Event contracts
- Message formats

**Example:**
```yaml
id: @speclang/api
layer: 3
depends_on: ["@speclang/entities"]
```

### Layer 4: Business Logic
**Purpose:** Business rules and workflows

Defines how the system behaves.
- Use cases
- Business rules
- Workflow definitions
- Validation logic

**Example:**
```yaml
id: @speclang/workflows
layer: 4
depends_on: ["@speclang/api"]
```

### Layer 5: Code Mapping
**Purpose:** Direct mapping to implementation

Maps specs to target language code.
- TypeScript specifications
- Go specifications
- Python specifications
- Directly generates compilable code

**Example:**
```yaml
id: @speclang/handler.ts.spec
layer: 5
target: src/handler.ts
depends_on: ["@speclang/workflows"]
```

### Layer 6: Generated Implementation
**Purpose:** Generated target language code

The output of code generation.
- TypeScript files
- Go files
- Python files
- Should not be edited directly

### Layer 7: Test Specifications
**Purpose:** Test definitions in natural language

Defines what to test, not how.
- Test scenarios
- Test data
- Expected outcomes
- Uses Given/When/Then format

**Example:**
```yaml
id: @speclang/handler.test.spec
layer: 7
depends_on: ["@speclang/handler.ts.spec"]
```

### Layer 8: Generated Tests
**Purpose:** Generated test code

The output of test generation.
- Test files
- Fixtures
- Should not be edited directly

### Layer 9: Pipeline Configuration
**Purpose:** Build and deployment configuration

Defines how to build, test, and deploy.
- Build commands
- Test commands
- Deployment targets
- Environment configuration

**Example:**
```yaml
id: @speclang/pipeline
layer: 9
depends_on: ["@speclang/handler.ts.spec"]
```

## Layer Dependencies

Layers should only depend on equal or lower layers:

```
Layer 0 ──────────────► (no dependencies)
Layer 1 ──────────────► Layer 0
Layer 2 ──────────────► Layer 1, Layer 0
Layer 3 ──────────────► Layer 2, Layer 1, Layer 0
Layer 4 ──────────────► Layer 3, Layer 2, Layer 1, Layer 0
Layer 5 ──────────────► Layer 4, Layer 3, Layer 2, Layer 1, Layer 0
Layer 6 ──────────────► Layer 5, Layer 4, Layer 3, Layer 2, Layer 1, Layer 0
Layer 7 ──────────────► Layer 6, Layer 5, Layer 4, Layer 3, Layer 2, Layer 1, Layer 0
Layer 8 ──────────────► Layer 7, Layer 6, Layer 5, Layer 4, Layer 3, Layer 2, Layer 1, Layer 0
Layer 9 ──────────────► Layer 8, Layer 7, Layer 6, Layer 5, Layer 4, Layer 3, Layer 2, Layer 1, Layer 0
```

**Valid dependency:** A spec at layer N can depend on specs at layers 0 through N.

**Invalid dependency:** A spec at layer N cannot depend on specs at layers N+1 or higher.

## Layer Validation Rules

### Rule 1: No Backward Dependencies
A spec cannot depend on a spec at a higher layer.

### Rule 2: Layer Field Required
Every spec must have a valid `layer` field (0-9).

### Rule 3: Parent Chain Valid
Every dependency chain must end at layer 0.

### Rule 4: No Circular Dependencies
The dependency graph must be acyclic.

### Rule 5: Monotonic Growth
When a spec creates children, the children must be at equal or higher layers.

## Layer Decision Tree

Use this decision tree to determine the correct layer for a new spec:

```
1. Is this the root project intent?
   YES → Layer 0 (North Star)
   NO → Continue

2. Does this define components/services?
   YES → Layer 1 (Component Architecture)
   NO → Continue

3. Does this define domain entities?
   YES → Layer 2 (Domain Models)
   NO → Continue

4. Does this define APIs/interfaces?
   YES → Layer 3 (Interface Specifications)
   NO → Continue

5. Does this define business logic?
   YES → Layer 4 (Business Logic)
   NO → Continue

6. Does this directly map to code?
   YES → Layer 5 (Code Mapping)
   NO → Continue

7. Is this generated code?
   YES → Layer 6 (Generated Implementation)
   NO → Continue

8. Does this define tests?
   YES → Layer 7 (Test Specifications)
   NO → Continue

9. Is this generated test code?
   YES → Layer 8 (Generated Tests)
   NO → Continue

10. Does this define build/deploy?
    YES → Layer 9 (Pipeline Configuration)
    NO → Unknown type - review spec content
```

## Layer Examples

### Complete Dependency Chain Example

```
project.scl (layer: 0)
    │
    ├── components.scl (layer: 1) ───────────────┐
    │                                              │
    ├── entities.spec.md (layer: 2) ──────────────┼──┐
    │                                              │  │
    ├── api.spec.yaml (layer: 3) ─────────────────┼──┼──┐
    │                                              │  │  │
    ├── workflows.spec.md (layer: 4) ─────────────┼──┼──┼──┐
    │                                              │  │  │  │
    ├── handler.ts.spec (layer: 5) ───────────────┘  │  │  │
    │                                              │  │  │
    ├── handler.ts (layer: 6) ──────────────────────┘  │  │
    │                                              │  │
    ├── handler.test.spec (layer: 7) ──────────────────┼──┘
    │                                              │
    ├── handler.test.ts (layer: 8) ───────────────────┘
    │
    └── pipeline.yaml (layer: 9)
```

## Layer Auto-Detection

When a spec lacks a layer field, the system can auto-detect based on:

1. **File path patterns:**
   - `project.scl` → layer 0
   - `*.components.*` → layer 1
   - `*entities*.spec.*` → layer 2
   - `*api*.spec.*` → layer 3
   - `*.workflows*.spec.*` → layer 4
   - `*.{ext}.spec` → layer 5
   - `*.test.spec.*` → layer 7
   - `pipeline*.yaml` → layer 9

2. **Content analysis:**
   - Contains `northstar` or `intent` → layer 0
   - Contains `component` or `service` → layer 1
   - Contains `interface` or `api` → layer 3
   - Contains `business` or `workflow` → layer 4

3. **Dependency inference:**
   - Depends on layer 0 → minimum layer 1
   - Depends on layer 1 → minimum layer 2
   - And so on...

## Layer Transitions

When upgrading or downgrading a project's maturity level, layer requirements may change:

| Maturity Level | Min Layer | Max Layer | Notes |
|---------------|-----------|-----------|-------|
| POC | 0 | 3 | Minimal structure |
| MVP | 0 | 5 | Core features |
| Alpha | 0 | 7 | Testing enabled |
| Beta | 0 | 8 | Full coverage |
| Production | 0 | 9 | Complete pipeline |

## Cross-Layer Interactions

### Validation Interactions

- **Layer 0-1**: North star must reference all layer 1 specs
- **Layer 1-2**: Components must own entities they define
- **Layer 2-3**: Entities must be API-compatible
- **Layer 3-4**: APIs must cover all use cases
- **Layer 4-5**: Use cases must map to code
- **Layer 5-6**: Code specs must generate valid code
- **Layer 6-7**: Generated code must be testable
- **Layer 7-8**: Test specs must generate passing tests
- **Layer 8-9**: Tests must be runnable by pipeline

### Ownership Interactions

- **Layer 0**: Owned by human (project lead)
- **Layer 1-4**: Owned by spec writers (AI or human)
- **Layer 5**: Owned by code generators
- **Layer 6**: Owned by generated output (read-only)
- **Layer 7**: Owned by test writers
- **Layer 8**: Owned by generated output (read-only)
- **Layer 9**: Owned by pipeline system

## See Also

- @ref:speclang/layer-definitions - Tree depth concepts
- @ref:speclang/headers - Layer field in headers
- @ref:speclang/cascade - How layers trigger cascade
- @ref:speclang/validation - Layer validation rules
