# speclang-header lines:10
id: "@speclang/templates"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for templates.ts"
status: generated
---

## @block:templates @kind:code
```typescript
export const TEMPLATES: Record<TargetLanguage, Record<string, Template>> = {
```


## @block:rendertemplate @kind:code
```typescript
export function renderTemplate(template: string, vars: Record<string, string>): string {
```


## @block:gettemplate @kind:code
```typescript
export function getTemplate(target: TargetLanguage, name: string): Template | undefined {
```


## @block:gettemplatenames @kind:code
```typescript
export function getTemplateNames(target: TargetLanguage): string[] {
```


## @block:listtemplates @kind:code
```typescript
export function listTemplates(): Array<{ target: TargetLanguage; name: string }> {
```


## @block:formatfields @kind:code
```typescript
export function formatFields(fields: Array<{ name: string; type: string; optional?: boolean }>, indent: number = 2): string {
```


## @block:formatparams @kind:code
```typescript
export function formatParams(params: Array<{ name: string; type: string; optional?: boolean }>): string {
```


## @block:formatmethods @kind:code
```typescript
export function formatMethods(methods: Array<{ name: string; params: string; return: string; body: string }>, indent: number = 2): string {
```


## @block:createfileheader @kind:code
```typescript
export function createFileHeader(spec: CodeSpec, generatorName?: string): string {
```


## @block:createfilefooter @kind:code
```typescript
export function createFileFooter(_spec: CodeSpec): string {
```

