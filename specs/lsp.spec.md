# speclang-header lines:11
id: "@speclang/lsp"
version: 1.0.0
layer: 5
target: src/lsp/
tags: [lsp, language-server, typescript, diagnostics]
short: Language Server Protocol implementation for SpecLang spec files
status: draft
project_level: Alpha
agent_support: agent_assisted
---

# LSP — SpecLang Language Server

Language Server Protocol implementation for `.spec.md` files. Provides real-time
diagnostic validation (header field checks) and goto-definition for `@ref:`
annotations.

## Modules

- `src/lsp/server.ts` — LSP entry point (connection lifecycle, document sync,
  validation, go-to-definition).
- `src/lsp/references.ts` — pure parser for `@ref:` annotations and file/block
  resolution.
- `src/lsp/completions.ts` — context-aware spec/block completion providers.
- `src/lsp/symbols.ts` — document symbol extraction for outline view.

## Public Surface

```typescript
// references.ts
export interface Ref { refId: string; block: string | null; line, startChar, endChar }
export function parseReferences(text: string): Ref[]
export function resolveFileRef(refId, workspaceRoot): string | null
export function resolveReference(target, workspaceRoot): Location | null
export function findBlockInFile(filePath, blockName): { line, character } | null

// server.ts
export interface SpecHeader { id?, version?, layer?, tags?, agent_support?, short?, project_level? }
export function parseHeader(text: string): { header: SpecHeader; bodyStart: number }
```

## Dependencies

- `vscode-languageserver/node` — protocol primitives.
- `vscode-languageserver-textdocument` — text document wrapper.

@ref:specs/compliance §Dual-View Pattern
