# Bootstrap Phase 0.30: Entity Lens Specification

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.30 of the bootstrap process.

**Prerequisites**: 
- Phase 0.14 (Lens System) complete
- Phase 0.29 (Code Lens) complete
- Lens system implementation exists

## Your Task
Create the Entity lens specification file (`specs/lenses.spec.dir/entity.spec.md`) to provide comprehensive documentation, detection rules, examples, and integration guidelines for the Entity lens, which handles structured data definitions (types, models, schemas).

## Read These Specs First
1. `specs/lenses.spec.md` - Lens system overview
2. `specs/lenses.spec.dir/formats.spec.md` - Built-in lens formats (includes @block:lens/entity)
3. `specs/lenses.spec.dir/mermaid.spec.md` - Example lens spec
4. `specs/core.spec.md` - Block structure

## What to Build

### Files to Create
```
specs/lenses.spec.dir/entity.spec.md
```

### Requirements

#### 1. Header
The spec must have a valid SpecLang header with:
- `id: "@speclang/lenses/entity"`
- `version: 0.1.0`
- `layer: 2`
- `parent: "@speclang/lenses"`
- `tags: [lenses, entity, types, schemas]`
- `imports: ["@speclang/lenses"]`
- `project_level: Alpha`
- `agent_support: agent_assisted`
- `short: Entity Lens`

#### 2. Content Structure
The spec should include the following sections:

##### Overview
Explain the Entity lens purpose: to define structured data types, models, schemas, and enumerations. Used for generating TypeScript interfaces, Go structs, SQL tables, etc.

##### Supported Formats
Describe the entity definition syntax:
- EntityName: followed by indented field list
- Field syntax: `fieldName: Type [optional description]`
- Support for nested entities, arrays, optional fields, constraints
- Enumeration syntax: `enum Name { value1, value2 }`

##### Usage in SpecLang
Demonstrate how to use Entity lens in a spec block:
- Using `@kind:entity` marker
- Writing entity definitions with proper indentation
- Adding metadata (e.g., `@unique`, `@required`, `@default`)

##### Detection Rules
Define clear detection rules for the EntityLens:
- First line matches `^\w+:$` (entity name colon)
- Subsequent lines contain field definitions with `fieldName: Type` pattern
- `@kind` marker is `entity`

##### Integration with Other Lenses
Show how entity definitions can be combined with:
- Code lens (generated type definitions)
- Diagram lens (ER diagrams)
- Operation lens (functions that use these entities)
- Prose lens (explanations)

##### Mapping to Target Languages
Describe how entity definitions map to various programming languages:
- TypeScript: interfaces
- Go: structs
- Python: dataclasses
- SQL: CREATE TABLE statements
- GraphQL: types

##### Configuration
Document configuration options for naming conventions, type mappings, and validation rules via `speclang-config.yaml`.

##### References
Include references to:
- `@ref:speclang/lenses/formats#entity`
- `@ref:speclang/lenses`

#### 3. Examples
Provide at least 3 comprehensive examples:
1. A User entity with fields id, email, name, roles
2. An Order entity with relationships (Customer, LineItems)
3. An enum Status with values active, inactive, pending

Each example should be a complete spec block with proper headers and context.

#### 4. Detection Rules in Speclang Format
Include a `@block:lens/detection/entity` with `@kind:operation` that defines the `detectEntityLens` function in pseudocode.

#### 5. Integration Examples
Show a multi-lens block that combines entity definitions with code implementations, diagrams, and acceptance criteria.

## Test Cases
1. The spec file passes SpecLang validation
2. All entity examples are syntactically valid
3. Detection rules are clear and implementable
4. References resolve correctly

## Validation
```bash
# Validate the spec file
speclang validate specs/lenses.spec.dir/entity.spec.md

# Check references
speclang refs check specs/lenses.spec.dir/entity.spec.md
```

## Output Format
After completing, output:
1. Spec file created
2. Sections added
3. Examples included
4. Validation results