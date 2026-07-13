# speclang-header lines:11
id: "@speclang/tools"
version: 0.1.0
layer: 5
target: src/tools/
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for tools.ts"
status: generated
---

## @block:simpletoolregistry @kind:entity
```text
export class SimpleToolRegistry implements ToolRegistry {
```


## @block:readspechandler @kind:code
```typescript
export const readSpecHandler: ToolHandler = async (input: { id: string }, context: ToolContext) => {
```


## @block:writespechandler @kind:code
```typescript
export const writeSpecHandler: ToolHandler = async (input: {
```


## @block:searchspecshandler @kind:code
```typescript
export const searchSpecsHandler: ToolHandler = async (input: {
```


## @block:readfilehandler @kind:code
```typescript
export const readFileHandler: ToolHandler = async (input: { path: string }, context: ToolContext) => {
```


## @block:writefilehandler @kind:code
```typescript
export const writeFileHandler: ToolHandler = async (input: {
```


## @block:listfileshandler @kind:code
```typescript
export const listFilesHandler: ToolHandler = async (input: {
```


## @block:getdependencieshandler @kind:code
```typescript
export const getDependenciesHandler: ToolHandler = async (input: { id: string }, context: ToolContext) => {
```


## @block:getdependentshandler @kind:code
```typescript
export const getDependentsHandler: ToolHandler = async (input: { id: string }, context: ToolContext) => {
```


## @block:impactanalysishandler @kind:code
```typescript
export const impactAnalysisHandler: ToolHandler = async (input: { id: string }, context: ToolContext) => {
```


## @block:triggercascadehandler @kind:code
```typescript
export const triggerCascadeHandler: ToolHandler = async (input: { path?: string }, context: ToolContext) => {
```


## @block:cascadestatushandler @kind:code
```typescript
export const cascadeStatusHandler: ToolHandler = async (_input: any, _context: ToolContext) => {
```


## @block:getstandardtools @kind:code
```typescript
export function getStandardTools(): Tool[] {
```


## @block:createtoolregistry @kind:code
```typescript
export function createToolRegistry(): ToolRegistry {
```

