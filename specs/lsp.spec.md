# speclang-header lines:13
id: "@specs/lsp"
version: 1.0.0
layer: 5
target: src/lsp/
project_level: Alpha
agent_support: agent_assonomous
tags: [lsp]
short: lsp module implementation
---

# Lsp Module

Specification for the lsp module.

## Files

### @block:lsp/completions @kind:code
Provides autocompletion for @ref and @block spec references

### @block:lsp/index @kind:code
Barrel entry-point re-exporting LSP public API

### @block:lsp/references @kind:code
Resolves @ref annotations to file paths and block locations

### @block:lsp/server @kind:code
SpecLang LSP server with diagnostics, hover, completion, go-to-definition

### @block:lsp/symbols @kind:code
Produces DocumentSymbol entries from @block declarations for IDE outline

