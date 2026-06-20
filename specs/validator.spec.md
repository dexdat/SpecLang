# speclang-header lines:10
id: "@speclang/validator"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for validator.ts"
status: draft
---

## @block:isvalidsemver @kind:code
```typescript
export function isValidSemver(version: string): boolean {
```


## @block:isvalidlayer @kind:code
```typescript
export function isValidLayer(layer: number): layer is Layer {
```


## @block:validateidformat @kind:code
```typescript
export function validateIdFormat(id: string, filepath: string): boolean {
```


## @block:loadspecindex @kind:code
```typescript
export function loadSpecIndex(indexPath: string = '_index.json'): SpecIndex {
```


## @block:clearindexcache @kind:code
```typescript
export function clearIndexCache(): void {
```


## @block:checkreference @kind:code
```typescript
export function checkReference(
```


## @block:checkreferences @kind:code
```typescript
export function checkReferences(
```


## @block:validatemetadata @kind:code
```typescript
export function validateMetadata(
```


## @block:validateheaderlines @kind:code
```typescript
export function validateHeaderLines(
```


## @block:validatespec @kind:code
```typescript
export function validateSpec(
```


## @block:validateallspecs @kind:code
```typescript
export function validateAllSpecs(
```


## @block:findspecfiles @kind:code
```typescript
export function findSpecFiles(dir: string): string[] {
```

