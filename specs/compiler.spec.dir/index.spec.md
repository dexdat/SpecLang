---
id: "@specs/compiler"
version: 1.0.0
layer: 3
project_level: Alpha
agent_support: agent_autonomous
tags: [compiler, codegen]
short: SpecLang compiler - parses specs and generates code for multiple targets
target: src/compiler/index.ts
---

# Compiler Specification

The SpecLang compiler transforms specification files into executable code for various target languages.

### @block::overview @kind:note

**Compiler Pipeline:**
1. **Parse** - Read spec files and extract blocks, references, headers
2. **Validate** - Check syntax, references, headers
3. **Resolve** - Build dependency graph, topological sort
4. **Transform** - Convert to intermediate representation (IR)
5. **Codegen** - Generate target language code

**Supported Targets:**
- TypeScript
- Go
- Python
- Rust (planned)

### @block::index-export @kind:code

```typescript
export * from "./targets";
export * from "./phases";
```
