# Bootstrap Phase 0.31: Operation Lens Specification

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.31 of the bootstrap process.

**Prerequisites**: 
- Phase 0.14 (Lens System) complete
- Phase 0.30 (Entity Lens) complete
- Lens system implementation exists

## Your Task
Create the Operation lens specification file (`specs/lenses.spec.dir/operation.spec.md`) to provide comprehensive documentation, detection rules, examples, and integration guidelines for the Operation lens, which handles function signatures, steps, and behavior definitions.

## Read These Specs First
1. `specs/lenses.spec.md` - Lens system overview
2. `specs/lenses.spec.dir/formats.spec.md` - Built-in lens formats (includes @block:lens/operation)
3. `specs/lenses.spec.dir/mermaid.spec.md` - Example lens spec
4. `specs/core.spec.md` - Block structure

## What to Build

### Files to Create
```
specs/lenses.spec.dir/operation.spec.md
```

### Requirements

#### 1. Header
The spec must have a valid SpecLang header with:
- `id: "@speclang/lenses/operation"`
- `version: 0.1.0`
- `layer: 2`
- `parent: "@speclang/lenses"`
- `tags: [lenses, operation, function, behavior]`
- `imports: ["@speclang/lenses"]`
- `project_level: Alpha`
- `agent_support: agent_assisted`
- `short: Operation Lens`

#### 2. Content Structure
The spec should include the following sections:

##### Overview
Explain the Operation lens purpose: to define functions, methods, endpoints, use cases, and their behavior including signatures, steps, preconditions, postconditions, and acceptance criteria.

##### Supported Formats
Describe the operation definition syntax:
- Signature: `name(params) -> returnType`
- Parameters: `name: Type` comma-separated
- Steps: numbered or bulleted list
- Preconditions: `requires:` clause
- Postconditions: `ensures:` clause
- Acceptance criteria: GIVEN/WHEN/THEN style

##### Usage in SpecLang
Demonstrate how to use Operation lens in a spec block:
- Using `@kind:operation` marker
- Writing operation signatures and steps
- Adding metadata (e.g., `@async`, `@idempotent`, `@sideEffect`)

##### Detection Rules
Define clear detection rules for the OperationLens:
- First line matches `^\w+\([^)]*\)\s*(?:->|:)\s*\w+` (signature with return)
- Content contains numbered steps or bulleted list
- `@kind` marker is `operation`

##### Integration with Other Lenses
Show how operation definitions can be combined with:
- Entity lens (types used in parameters)
- Code lens (implementation)
- Diagram lens (flowcharts)
- Acceptance lens (test scenarios)
- Prose lens (explanations)

##### Mapping to Target Languages
Describe how operation definitions map to various programming languages:
- TypeScript: function declarations
- Go: methods
- Python: def functions
- REST API: endpoints
- GraphQL: mutations/queries

##### Configuration
Document configuration options for naming conventions, error handling, and step formatting via `speclang-config.yaml`.

##### References
Include references to:
- `@ref:speclang/lenses/formats#operation`
- `@ref:speclang/lenses`

#### 3. Examples
Provide at least 3 comprehensive examples:
1. A login operation with email/password parameters, steps, and acceptance criteria
2. A data transformation operation with pre/post conditions
3. An API endpoint operation with error handling

Each example should be a complete spec block with proper headers and context.

#### 4. Detection Rules in Speclang Format
Include a `@block:lens/detection/operation` with `@kind:operation` that defines the `detectOperationLens` function in pseudocode.

#### 5. Integration Examples
Show a multi-lens block that combines operation definitions with entity definitions, code implementations, diagrams, and acceptance tests.

## Test Cases
1. The spec file passes SpecLang validation
2. All operation examples are syntactically valid
3. Detection rules are clear and implementable
4. References resolve correctly

## Validation
```bash
# Validate the spec file
speclang validate specs/lenses.spec.dir/operation.spec.md

# Check references
speclang refs check specs/lenses.spec.dir/operation.spec.md
```

## Output Format
After completing, output:
1. Spec file created
2. Sections added
3. Examples included
4. Validation results