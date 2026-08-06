# speclang-header lines:11
id: "@speclang/lenses/prose"
version: 0.1.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [lenses, prose, documentation, narrative]
short: "Prose and narrative text extraction lens"
target: src/lenses/prose-lens.ts
status: draft
---

# Prose Lens

Extracts and formats narrative text from specs.

## Input Format (Spec Blocks)

### @lenses/prose/input-format

Prose lens accepts spec blocks with `@kind:note`, `@kind:note`, `@kind:note`, or any block without a specific kind marker. The prose content is natural language text with optional markdown formatting.

**Plain text format:**
```speclang
### @block::overview @kind:note

SpecLang is a reactive multi-agent system where natural language specifications self-assemble into working code. The specs are the source of truth, and generated code is disposable.
```

**Markdown enriched format:**
```speclang
### @block::installation @kind:note

# Installation

To install SpecLang:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/speclang/speclang
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the bootstrap:**
   ```bash
   ./bin/speclang bootstrap
   ```

See the getting-started guide for more details.
```

**Structured prose with sections:**
```speclang
### @block::rationale @kind:note

## Why SpecLang?

### Problem
Traditional code generation tools lose context between specification and implementation.

### Solution
SpecLang maintains explicit references (@ref:) that preserve context across the entire system.

### Benefits
- **Context preservation:** AI never loses track of dependencies
- **Perfect traceability:** Every generated file points back to its spec
- **Autonomous operation:** Specs contain enough depth for full agent autonomy
```

## Output Format (Formatted Prose)

### @lenses/prose/output-format

Generates formatted prose in multiple output formats.

**Markdown output:** Preserves original markdown with enhanced formatting and resolved references.

**HTML output:** Clean, styled HTML with proper heading hierarchy and interactive elements.

**Plain text output:** Simplified text for documentation generation or inclusion in code comments.

**PDF output:** Printable documentation with table of contents, page numbers, and professional styling.

**Interactive documentation:** Web-based documentation with search, navigation, and interactive examples.

## Supported Content Types

### @lenses/prose/content-types

**Narrative content:**
- **Overview descriptions:** High-level system descriptions
- **Step-by-step instructions:** Tutorials, guides, how-tos
- **Rationale explanations:** Why decisions were made
- **Usage examples:** Code examples with explanations
- **API documentation:** Endpoint descriptions, parameter explanations
- **Error messages:** User-facing error descriptions and resolutions

**Structural elements:**
- **Headings:** H1-H6 with automatic TOC generation
- **Lists:** Ordered, unordered, task lists
- **Tables:** Data tables with alignment and sorting
- **Code blocks:** Syntax-highlighted code snippets
- **Blockquotes:** Quotations, warnings, notes
- **Horizontal rules:** Section dividers

**Cross-references:**
- **Internal references:** @ref:domain/path#block links
- **External references:** URLs to external documentation
- **Block references:** References to specific blocks within specs
- **File references:** Links to generated code files

## Text Extraction

### @lenses/prose/extraction

Extracts prose content from spec blocks with structure preservation.

**Extraction process:**
1. Detect prose blocks by absence of other lens markers or explicit `@kind:note`/`@kind:note`
2. Parse markdown structure (headings, lists, code blocks, etc.)
3. Extract cross-references and resolve them to targets
4. Capture metadata (author, created date, version)
5. Build content tree with hierarchical sections

**Structure parsing:**
- **Heading hierarchy:** Maintain proper nesting levels
- **List continuity:** Handle nested lists and list item continuation
- **Code block isolation:** Extract code blocks for separate processing
- **Link resolution:** Convert @ref: to actual references
- **Image handling:** Extract and process embedded images

**Metadata extraction:**
- **Author:** From spec header or block metadata
- **Created/updated dates:** From git history or metadata
- **Version:** Associated spec version
- **Tags:** Keywords for categorization
- **Status:** Draft, review, approved, deprecated

## Formatting and Styling

### @lenses/prose/formatting

Formats extracted prose for various output targets.

**Markdown enhancements:**
- **Consistent heading levels:** Normalize based on context
- **Table formatting:** Align columns, add captions
- **Code block language detection:** Auto-detect and label
- **Link beautification:** Convert raw URLs to descriptive links
- **Emphasis consistency:** Standardize bold/italic usage

**HTML styling:**
- **CSS frameworks:** Tailwind, Bootstrap, or custom styles
- **Responsive design:** Mobile-friendly layouts
- **Syntax highlighting:** Prism.js or highlight.js for code blocks
- **Interactive elements:** Expandable sections, tabbed interfaces
- **Accessibility:** ARIA labels, proper semantic markup

**PDF generation:**
- **Page layout:** Margins, headers, footers, page numbers
- **Table of contents:** Auto-generated with page numbers
- **Font selection:** Serif for body, sans-serif for headings
- **Image handling:** Proper scaling and positioning
- **Cross-references:** Hyperlinks within PDF

## Cross-Reference Handling

### @lenses/prose/reference-handling

Manages cross-references within prose content.

**Reference resolution:**
- **Internal spec references:** Resolve @ref:domain/path to actual spec titles
- **Block references:** Resolve @ref:domain/path#block to block content
- **External references:** Validate URLs and fetch metadata
- **File references:** Link to generated code files in repository

**Link validation:**
- **Broken link detection:** Identify unresolved references
- **Circular reference detection:** Prevent infinite loops
- **Reference freshness:** Check if referenced content has changed
- **Accessibility checking:** Ensure linked content is accessible

**Bidirectional linking:**
- **Backlink generation:** Automatically create "referenced by" sections
- **Reference graphs:** Visualize how content connects
- **Impact analysis:** Show what content would be affected by changes
- **Navigation aids:** Previous/next links, breadcrumb trails

## Validation Rules

### @lenses/prose/validation

Validates prose content for quality and completeness.

**Readability validation:**
- **Sentence length:** Flag overly long sentences
- **Passive voice detection:** Suggest active voice alternatives
- **Readability scores:** Flesch-Kincaid, Gunning Fog indices
- **Jargon detection:** Identify technical terms needing explanation

**Structure validation:**
- **Heading hierarchy:** No skipped heading levels
- **List consistency:** Consistent bullet styles and indentation
- **Table structure:** Proper header rows and column alignment
- **Code block completeness:** Language specified, balanced fences

**Reference validation:**
- **All references resolvable:** No broken @ref: links
- **Reference context:** References have sufficient context
- **Circular reference avoidance:** No reference loops
- **External link accessibility:** URLs return 200 OK

**Completeness validation:**
- **Required sections present:** Overview, steps, examples as needed
- **Examples executable:** Code examples can be run (where applicable)
- **Images have alt text:** Accessibility requirement
- **Metadata complete:** Author, date, version present

## Examples

### @lenses/prose/examples

**Example 1: Technical overview**

```speclang
### @block::system-overview @kind:note

# SpecLang System Overview

SpecLang is a **reactive multi-agent system** where natural language specifications self-assemble into working code.

## Core Components

1. **Specs:** Human-readable intent documents with structured blocks
2. **Agents:** AI sessions that own and process specific files
3. **Cascade:** Reactive file-watching system that triggers agents
4. **Pipeline:** Build, test, and deployment automation

## Key Benefits

- context-preservation - Zero context loss between specs and code
- autonomous-agents - Specs detailed enough for full AI autonomy
- perfect-traceability - Every generated file traces back to its spec

See the getting-started guide for installation instructions.
```

**Example 2: Step-by-step guide**

```speclang
### @block::first-spec @kind:note

# Creating Your First Spec

Follow these steps to create your first SpecLang specification:

## Step 1: Choose a Domain

Select a simple domain for your first spec, like user authentication or todo lists.

## Step 2: Write the North Star

Create a `project.scl` file with high-level intent:

```scl
# speclang-header lines:8
id: "@myproject/auth"
version: 0.1.0
layer: 0
---

# User Authentication System

A secure authentication system with login, registration, and password reset.
```

## Step 3: Expand with Spec Writer

Run `speclang expand @myproject/auth` to generate detailed specs.

## Step 4: Generate Code

Run `speclang cascade` to generate working code from specs.
```

**Example 3: Rationale document**

```speclang
### @block::why-cascade @kind:note

## Why the Cascade System?

### The Problem with Traditional Codegen

Traditional code generation tools operate in "batch mode" - you write specs, run a command, get code. This breaks the feedback loop between specification and implementation.

### The Cascade Solution

SpecLang uses a **reactive cascade** where:
1. File changes trigger specific agents
2. Agents only edit files they own
3. Changes propagate until convergence
4. Pipeline runs automatically

### Benefits Observed

- **Faster iteration:** See code changes within seconds of spec edits
- **Better quality:** Each agent specializes in one file type
- **Self-healing:** Errors trigger recovery agents automatically
- **Perfect history:** Git commits trace every change to its cause
```

## Implementation Notes

### @lenses/prose/implementation

The prose lens implementation should:

1. **Detection:** Identify prose blocks by kind markers or absence of other lens markers
2. **Parsing:** Extract structured content with markdown parsing and reference resolution
3. **Formatting:** Apply consistent styling across output formats
4. **Reference handling:** Resolve and validate all cross-references
5. **Validation:** Check prose quality, structure, and completeness

**Integration:** The lens integrates with the existing lens registry and serves as the fallback lens when no other lens matches. It supports all standard lens operations (parse, render, validate).

**Testing:** Each content type should have test coverage for extraction, formatting, and reference handling.

**Performance:** Prose lens should handle large documents efficiently (10k+ words) with responsive reference resolution.
