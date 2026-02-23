# Bootstrap Phase 0.32: Prose Lens Specification

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.32 of the bootstrap process.

**Prerequisites**: 
- Phase 0.14 (Lens System) complete
- Phase 0.31 (Operation Lens) complete
- Lens system implementation exists

## Your Task
Create the Prose lens specification file (`specs/lenses.spec.dir/prose.spec.md`) to provide comprehensive documentation, detection rules, examples, and integration guidelines for the Prose lens, which handles plain text, markdown, explanations, notes, and questions.

## Read These Specs First
1. `specs/lenses.spec.md` - Lens system overview
2. `specs/lenses.spec.dir/formats.spec.md` - Built-in lens formats (includes @block:lens/prose)
3. `specs/lenses.spec.dir/mermaid.spec.md` - Example lens spec
4. `specs/core.spec.md` - Block structure

## What to Build

### Files to Create
```
specs/lenses.spec.dir/prose.spec.md
```

### Requirements

#### 1. Header
The spec must have a valid SpecLang header with:
- `id: "@speclang/lenses/prose"`
- `version: 0.1.0`
- `layer: 2`
- `parent: "@speclang/lenses"`
- `tags: [lenses, prose, text, markdown]`
- `imports: ["@speclang/lenses"]`
- `project_level: Alpha`
- `agent_support: agent_assisted`
- `short: Prose Lens`

#### 2. Content Structure
The spec should include the following sections:

##### Overview
Explain the Prose lens purpose: to handle unstructured text content, including explanations, notes, questions, documentation, and narrative. Acts as the default fallback lens when no other lens matches.

##### Supported Formats
Describe the prose content:
- Plain text
- Markdown formatting (headings, lists, links, images)
- No specific structure required
- Can contain inline code snippets

##### Usage in SpecLang
Demonstrate how to use Prose lens in a spec block:
- Using `@kind:note` marker (or other prose-related kinds)
- Writing free-form text with markdown
- Combining with other lenses within the same block

##### Detection Rules
Define clear detection rules for the ProseLens:
- Default fallback: matches any content
- `@kind` marker is `note`, `documentation`, `question`, `decision`, etc.
- No other lens detection rules match

##### Integration with Other Lenses
Show how prose can be combined with:
- Entity lens (describing entities)
- Operation lens (explaining steps)
- Code lens (commentary on code)
- Diagram lens (caption and explanation)
- Acceptance lens (context for tests)

##### Role in Cascade
Explain how prose acts as connective tissue between structured blocks, providing context and rationale.

##### Configuration
Document configuration options for text wrapping, markdown rendering, and prose style via `speclang-config.yaml`.

##### References
Include references to:
- `@ref:speclang/lenses/formats#prose`
- `@ref:speclang/lenses`

#### 3. Examples
Provide at least 3 comprehensive examples:
1. A feature overview with markdown headings and bullet points
2. A decision record with context, options, and rationale
3. A question block with options and impact analysis

Each example should be a complete spec block with proper headers and context.

#### 4. Detection Rules in Speclang Format
Include a `@block:lens/detection/prose` with `@kind:operation` that defines the `detectProseLens` function in pseudocode (always returns true).

#### 5. Integration Examples
Show a multi-lens block that combines prose explanations with entity definitions, operation signatures, code snippets, and diagrams.

## Test Cases
1. The spec file passes SpecLang validation
2. All prose examples are well-formed markdown
3. Detection rules are clear (default fallback)
4. References resolve correctly

## Validation
```bash
# Validate the spec file
speclang validate specs/lenses.spec.dir/prose.spec.md

# Check references
speclang refs check specs/lenses.spec.dir/prose.spec.md
```

## Output Format
After completing, output:
1. Spec file created
2. Sections added
3. Examples included
4. Validation results