---
name: sip-035-lenses-speclang-v0
title: "SIP 35: Lenses System"
version: 0.1.0
description: Content views and format transformations for spec blocks
category: standard
---

# SIP 35: Lenses System

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Lenses System—different ways to view and write spec content.

### Quick Start

Lenses let you write specs in different formats:
- **Diagram**: Mermaid flowcharts, sequence diagrams
- **Code**: Language-specific code blocks
- **Math**: LaTeX equations
- **Entity**: Field:type definitions
- **Operation**: Function signatures
- **Acceptance**: GIVEN/WHEN/THEN tests
- **Prose**: Natural language (default)

### When to Read This

- **Writing specs**: Choose the right format
- **Transforming content**: Convert between formats
- **Custom formats**: Create new lenses

### Related SIPs

- SIP 3: Block System
- SIP 4: Reference System
- SIP 21: Semantic Definitions

## Abstract

This SIP defines the Lenses System—pluggable parsers and renderers that transform spec content between human-readable formats and structured Block data. AI understands all lens formats and picks the right one automatically.

## Motivation

Specs need different formats for different content:
- Diagrams for flows and architecture
- Code for implementation hints
- Math for algorithms
- Tables for comparisons
- Prose for explanations

Lenses make all formats first-class citizens.

## Rationale

**Bidirectional transformation:**

1. **Parse**: Convert content → Block
2. **Render**: Convert Block → content
3. **Detect**: Automatically pick the right lens
4. **Compose**: Multiple lenses in one block

## Specification

### Lens Entity

```yaml
Lens:
  description: "A way to parse/render spec content"
  input: content format (mermaid, code, math, prose)
  output: structured Block
  bidirectional: can generate back from Block
  
  properties:
    name: String
    detector: (content) -> Boolean
    parser: (content) -> Block
    renderer: (Block) -> content
```

### Built-in Lenses

```yaml
BuiltInLenses:
  DiagramLens:
    detector: "@kind:diagram + ```mermaid"
    formats: [mermaid, plantuml, graphviz]
    
  CodeLens:
    detector: "@kind:code + ```lang"
    formats: [typescript, python, go, rust, etc.]
    
  MathLens:
    detector: "@kind:math + ```"
    formats: [latex, asciimath]
    
  EntityLens:
    detector: "@kind:entity + field:type"
    formats: [yaml, toml]
    
  OperationLens:
    detector: "@kind:operation + signature"
    formats: [signature, pseudocode]
    
  AcceptanceLens:
    detector: "@kind:acceptance + GIVEN/WHEN/THEN"
    formats: [gherkin]
    
  ProseLens:
    detector: "default"
    formats: [markdown]
```

### Lens Detection

```yaml
LensDetection:
  priority_order:
    1_explicit_kind: "@kind marker in block header"
    2_code_fence: "```language identifier"
    3_content_heuristics: "pattern matching"
    4_default: "ProseLens"
    
  detection_rules:
    - "@kind:diagram + ```mermaid -> DiagramLens"
    - "@kind:code + ```lang -> CodeLens"
    - "@kind:math + ``` -> MathLens"
    - "@kind:entity + field:type -> EntityLens"
    - "@kind:operation + signature -> OperationLens"
    - "@kind:acceptance + GIVEN/WHEN/THEN -> AcceptanceLens"
    - "default -> ProseLens"
```

### Lens Composition

```yaml
LensComposition:
  description: "A block can have multiple lenses"
  
  example:
    block: "user/login"
    lenses:
      - OperationLens: "login(email, password) -> Token"
      - ProseLens: "Steps for authentication"
      - DiagramLens: "Mermaid flow of login flow"
      - CodeLens: "Pseudocode algorithm"
      - AcceptanceLens: "Test criteria"
      
  ai_behavior:
    - "Extracts all into one rich block"
    - "Combines lens outputs"
    - "Maintains semantic equivalence"
```

### Custom Lenses

```yaml
CustomLens:
  entity:
    name: String
    detector: "(content) -> Boolean"
    parser: "(content) -> Block"
    renderer: "(Block) -> content"
    
  registration:
    command: "speclang lens register ./my-lens.js"
    
  example:
    name: "OpenAPI"
    detector: "content.includes('openapi:')"
    parser: "parseOpenAPI(content)"
    renderer: "renderOpenAPI(block)"
```

### AI Lens Selection

```yaml
AILensSelection:
  automatic:
    - "Picks right lens for new blocks"
    - "Transforms between lenses"
    - "Suggests lens changes"
    - "Combines lenses for clarity"
    
  user_override:
    method: "@kind marker"
    example: "@kind:diagram forces DiagramLens"
```

## Examples

### Example 1: Multi-Lens Block

```yaml
block:
  id: "@block:user/login"
  kind: "operation"
  
  operation_lens:
    signature: "login(email, password) -> Token"
    
  prose_lens:
    steps:
      - "Validate email format using regex"
      - "Look up user by email in database"
      - "Verify password hash matches"
      - "Generate JWT token with user claims"
      - "Return token"
      
  diagram_lens:
    format: mermaid
    content: |
      flowchart TD
        A[Receive credentials] --> B[Validate email]
        B --> C[Look up user]
        C --> D[Verify password]
        D --> E[Generate JWT]
        E --> F[Return token]
        
  code_lens:
    format: pseudocode
    content: |
      func login(email, password):
        if !validateEmail(email):
          return Error("invalid email")
        user = db.findUser(email)
        if !user:
          return Error("user not found")
        if !verifyHash(password, user.hash):
          return Error("invalid password")
        token = generateJWT(user)
        return token
        
  acceptance_lens:
    format: gherkin
    content: |
      GIVEN valid credentials
      WHEN user logs in
      THEN JWT token is returned
```

### Example 2: Entity Lens

```yaml
block:
  id: "@block:lens/custom"
  kind: "entity"
  
  entity_lens:
    CustomLens:
      name: String
      detector: "(content) -> Boolean"
      parser: "(content) -> Block"
      renderer: "(Block) -> content"
```

### Example 3: Custom Lens Registration

```yaml
file: "./my-lens.js"

content: |
  export default {
    name: "OpenAPI",
    detector: (content) => content.includes('openapi:'),
    parser: (content) => {
      const spec = yaml.parse(content);
      return {
        type: 'api-spec',
        endpoints: Object.keys(spec.paths),
        schemas: Object.keys(spec.components?.schemas || {})
      };
    },
    renderer: (block) => {
      return yaml.stringify({
        openapi: '3.0.0',
        paths: block.endpoints,
        components: { schemas: block.schemas }
      });
    }
  };

command: "speclang lens register ./my-lens.js"
```

## Implementation

```python
from typing import Callable, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class Lens:
    name: str
    detector: Callable[[str], bool]
    parser: Callable[[str], Dict[str, Any]]
    renderer: Callable[[Dict[str, Any]], str]

class LensRegistry:
    def __init__(self):
        self.lenses: Dict[str, Lens] = {}
        self._register_builtin()
        
    def _register_builtin(self):
        self.register(Lens(
            name="diagram",
            detector=lambda c: "```mermaid" in c,
            parser=self._parse_diagram,
            renderer=self._render_diagram
        ))
        self.register(Lens(
            name="code",
            detector=lambda c: "```" in c and not "```mermaid" in c,
            parser=self._parse_code,
            renderer=self._render_code
        ))
        self.register(Lens(
            name="prose",
            detector=lambda c: True,
            parser=lambda c: {"text": c},
            renderer=lambda b: b.get("text", "")
        ))
        
    def register(self, lens: Lens):
        self.lenses[lens.name] = lens
        
    def detect(self, content: str, kind_hint: Optional[str] = None) -> Lens:
        if kind_hint:
            for lens in self.lenses.values():
                if lens.name == kind_hint:
                    return lens
        for lens in self.lenses.values():
            if lens.detector(content):
                return lens
        return self.lenses["prose"]
        
    def parse(self, content: str) -> Dict[str, Any]:
        lens = self.detect(content)
        return lens.parser(content)
        
    def render(self, block: Dict[str, Any], format: str) -> str:
        lens = self.lenses.get(format)
        if lens:
            return lens.renderer(block)
        return str(block)
```

## References

- @ref:speclang/lenses
- @ref:speclang/lenses/formats
- @ref:speclang/lenses/mermaid
- SIP 3: Block System
- SIP 21: Semantic Definitions

## Copyright

This document is in the public domain.
