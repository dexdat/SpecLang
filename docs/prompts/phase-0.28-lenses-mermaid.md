# Bootstrap Phase 0.28: Mermaid Diagram Lens Specification

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.28 of the bootstrap process.

**Prerequisites**: 
- Phase 0.14 (Lens System) complete
- Phase 0.27 (Stdlib Functions) complete
- Lens system implementation exists

## Your Task
Create or enhance the Mermaid diagram lens specification file (`specs/lenses.spec.dir/mermaid.spec.md`) to provide comprehensive documentation, detection rules, examples, and integration guidelines for the Mermaid diagram lens.

## Read These Specs First
1. `specs/lenses.spec.md` - Lens system overview
2. `specs/lenses.spec.dir/formats.spec.md` - Built-in lens formats
3. `specs/lenses.spec.dir/mermaid.spec.md` - Existing Mermaid lens spec (if exists)
4. `specs/core.spec.md` - Block structure

## What to Build

### Files to Create/Update
```
specs/lenses.spec.dir/mermaid.spec.md
```

### Requirements

#### 1. Header
The spec must have a valid SpecLang header with:
- `id: "@speclang/lenses/mermaid"`
- `version: 0.1.0` (or increment)
- `layer: 2`
- `parent: "@speclang/lenses"`
- `tags: [lenses, diagram, mermaid]`
- `imports: ["@speclang/lenses"]`
- `project_level: Alpha` (or higher)
- `agent_support: agent_assisted` (or `agent_autonomous` if detailed enough)
- `short: Mermaid Diagram Lens`

#### 2. Content Structure
The spec should include the following sections:

##### Overview
Explain what Mermaid is and its role in SpecLang.

##### Supported Diagram Types
List and provide examples of each Mermaid diagram type:
- Sequence diagrams
- Flowcharts
- Class diagrams
- State diagrams
- Entity Relationship diagrams
- Gantt charts
- Pie charts
- Git graphs

Each example should show both the Mermaid code and a brief description.

##### Usage in SpecLang
Demonstrate how to use Mermaid in a spec block:
- Using `@kind:diagram` marker
- Code fence with `mermaid` language identifier
- Combining with other lenses in the same block

##### Detection Rules
Define clear detection rules for the DiagramLens:
- Content contains ````mermaid` fence
- `@kind` marker is `diagram`
- Content matches Mermaid syntax patterns (regex patterns)

##### Integration with Other Lenses
Show how Mermaid diagrams can be combined with:
- Operation lens (describing flows)
- Entity lens (showing relationships)
- Acceptance lens (visualizing test scenarios)

##### Configuration
Document configuration options for Mermaid themes and styling via `speclang-config.yaml`.

##### References
Include references to:
- Mermaid official documentation
- `@ref:speclang/lenses/formats#diagram`
- `@ref:speclang/lenses`

#### 3. Examples
Provide at least 3 comprehensive examples:
1. A sequence diagram for authentication flow
2. A flowchart for a decision process
3. A class diagram for a domain model

Each example should be a complete spec block with proper headers and context.

#### 4. Detection Rules in Speclang Format
Include a `@block:lens/detection/diagram` with `@kind:operation` that defines the `detectDiagramLens` function in pseudocode.

#### 5. Integration Examples
Show a multi-lens block that combines a diagram with prose, entity definitions, and acceptance criteria.

## Test Cases
1. The spec file passes SpecLang validation (headers, references)
2. All examples are syntactically valid Mermaid
3. Detection rules are clear and implementable
4. References resolve correctly

## Validation
```bash
# Validate the spec file
speclang validate specs/lenses.spec.dir/mermaid.spec.md

# Check references
speclang refs check specs/lenses.spec.dir/mermaid.spec.md
```

## Output Format
After completing, output:
1. Spec file created/updated
2. Sections added
3. Examples included
4. Validation results