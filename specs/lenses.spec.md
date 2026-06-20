# speclang-header lines:11
id: "@speclang/lenses"
version: 0.1.0
layer: 0
tags: [lenses, views, formats, parsers]
imports: ["@speclang/core"]
children: ["@speclang/lenses/formats", "@speclang/lenses/mermaid"]
project_level: Alpha
agent_support: agent_assisted
short: Lenses
---

# Lenses

Different ways to view and write specs. AI understands all of them.

## What is a Lens?

```speclang
# @block:lens/definition @kind:entity
Lens:
  description: "A way to parse/render spec content"
  input: content format (mermaid, code, math, prose)
  output: structured Block
  bidirectional: can generate back from Block
  
Each block can use any lens.
AI picks the right one based on @kind marker.
```

See sub‑specs for detailed lens formats and Mermaid diagram support.

---


## Lens Detection

```speclang
# @block:lens/detection @kind:operation
detectLens(block: Block) -> Lens

Rules:
  - @kind:diagram + ```mermaid -> DiagramLens
  - @kind:code + ```lang -> CodeLens
  - @kind:math + ``` -> MathLens
  - @kind:entity + field:type -> EntityLens
  - @kind:operation + signature -> OperationLens
  - @kind:acceptance + GIVEN/WHEN/THEN -> AcceptanceLens
  - default -> ProseLens
```

---

## Lens Composition

```speclang
# @block:lens/composition @kind:note
A block can have multiple lenses:

# @block:user/login @kind:operation
login(email, password) -> Token

Steps:
1. Validate email format using regex
2. Look up user by email in database
3. Verify password hash matches stored hash
4. Generate JWT token with user claims
5. Return token

# visual flow
```mermaid
...diagram...
```

# implementation hint
```pseudocode
...algorithm...
```

# test criteria
GIVEN ... WHEN ... THEN ...

AI extracts all into one rich block.
```

---

## Custom Lenses

```speclang
# @block:lens/custom @kind:entity
CustomLens:
  name: String
  detector: (content) -> Boolean
  parser: (content) -> Block
  renderer: (Block) -> content
  
Register:
  speclang lens register ./my-lens.js
```

---

## Lens Priority

```speclang
# @block:lens/priority @kind:note
When multiple lenses match:
1. Explicit @kind marker
2. Code fence language
3. Content heuristics
4. Default to ProseLens
```

---

## AI Lens Selection

```speclang
# @block:lens/ai @kind:note
AI automatically:
- Picks right lens for new blocks
- Transforms between lenses
- Suggests lens changes
- Combines lenses for clarity

User can override with @kind marker.
```
