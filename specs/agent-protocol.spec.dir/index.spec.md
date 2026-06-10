---
id: "@speclang/index"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for index.ts"
status: generated
---

## @block:getguard @kind:code
```typescript
export function getGuard(): WriteInterceptor {
```


## @block:initguard @kind:code
```typescript
export function initGuard(
```


## @block:resetguard @kind:code
```typescript
export function resetGuard(): void {
```


## @block:checkownership @kind:code
```typescript
export function checkOwnership(agent: AgentRole, filepath: string): boolean {
```


## @block:interceptwrite @kind:code
```typescript
export async function interceptWrite(
```


## @block:getfileowner @kind:code
```typescript
export function getFileOwner(filepath: string): AgentRole | null {
```


## @block:getviolations @kind:code
```typescript
export function getViolations() {
```


## @block:getguardstats @kind:code
```typescript
export function getGuardStats() {
```

