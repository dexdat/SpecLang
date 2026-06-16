# speclang-header lines:9
id: "@speclang/types"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for types.ts"
status: generated
---

## @block:ownershiprule @kind:entity
```text
export interface OwnershipRule {
```


## @block:ownershipcheck @kind:entity
```text
export interface OwnershipCheck {
```


## @block:interceptresult @kind:entity
```text
export interface InterceptResult {
```


## @block:violation @kind:entity
```text
export interface Violation {
```


## @block:conflict @kind:entity
```text
export interface Conflict {
```


## @block:violationreport @kind:entity
```text
export interface ViolationReport {
```


## @block:validationresult @kind:entity
```text
export interface ValidationResult {
```


## @block:overriderule @kind:entity
```text
export interface OverrideRule {
```


## @block:guardconfig @kind:entity
```text
export interface GuardConfig {
```


## @block:default_guard_config @kind:code
```typescript
export const DEFAULT_GUARD_CONFIG: GuardConfig = {
```


## @block:guard_agent_roles @kind:code
```typescript
export const GUARD_AGENT_ROLES: AgentRole[] = [
```


## @block:guardedaction @kind:entity
```text
export type GuardedAction = 'write' | 'delete' | 'rename';
```


## @block:guardstats @kind:entity
```text
export interface GuardStats {
```

