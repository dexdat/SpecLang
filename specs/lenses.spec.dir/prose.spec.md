# speclang-header lines:12
id: "@speclang/lenses/prose"
parent: "@ref:specs/lenses"
short: "Prose and narrative text extraction lens"
project_level: Alpha
agent_support: agent_autonomous
tags: [lenses, prose, documentation, narrative]
version: 0.1.0
layer: 4
---

# Prose Lens

Extracts and formats narrative text from specs.

## Text Extraction

### @lenses/prose/extraction

Extracts prose content from spec blocks.

**Content Types:**
- Overview descriptions
- Step-by-step instructions
- Rationale explanations
- Usage examples

## Formatting

### @lenses/prose/formatting

Formats extracted prose for output.

**Formats:**
- Markdown (preserved)
- HTML
- Plain text
- PDF generation

## Cross-References

### @lenses/prose/references

Handles cross-references in prose.

**Features:**
- Link to @ref: targets
- Block references
- Automatic link validation
- Bidirectional linking
