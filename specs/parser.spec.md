# speclang-header lines:11
id: "@speclang/parser"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated, parser]
short: "Parser module: parsing and validation of spec files"
children: ["@ref:speclang/parser/parsing", "@ref:speclang/parser/validation"]
status: generated
---

# Parser Module

TypeScript parser module for parsing and validating Speclang spec files.

## Sub‑Specs

- @ref:speclang/parser/parsing – Parsing spec files: headers, blocks, references
- @ref:speclang/parser/validation – Validation rules for parsed spec data

## Code Blocks

### @block:parsecodespec @kind:code
```typescript
export function parseCodeSpec(filepath: string, options?: CodeParserOptions): CodeSpec {
```


### @block:parsecodespeccontent @kind:code
```typescript
export function parseCodeSpecContent(content: string, filepath: string = 'unknown'): CodeSpec {
```


### @block:findcodespecfiles @kind:code
```typescript
export function findCodeSpecFiles(dir: string, recursive: boolean = true): string[] {
```


### @block:spechascodeblocks @kind:code
```typescript
export function specHasCodeBlocks(filepath: string): boolean {
```

