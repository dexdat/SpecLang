# speclang-header lines:10
id: "@speclang/mapper"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for mapper.ts"
status: generated
---

## @block:type_mappings @kind:code
```typescript
export const TYPE_MAPPINGS: TypeMapping[] = [
```


## @block:maptype @kind:code
```typescript
export function mapType(stdlibType: string, target: TargetLanguage): string {
```


## @block:getstdlibtypes @kind:code
```typescript
export function getStdlibTypes(): StdlibType[] {
```


## @block:isstdlibtype @kind:code
```typescript
export function isStdlibType(type: string): boolean {
```


## @block:gettypemapping @kind:code
```typescript
export function getTypeMapping(stdlibType: string): TypeMapping | undefined {
```

