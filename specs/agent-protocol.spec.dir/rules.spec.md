---
id: "@speclang/rules"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for rules.ts"
status: generated
---

## @block:default_rules @kind:code
```typescript
export const DEFAULT_RULES: OwnershipRule[] = [
```


## @block:orchestrator_rule @kind:code
```typescript
export const ORCHESTRATOR_RULE: OwnershipRule = {
```


## @block:isexemptfromguard @kind:code
```typescript
export function isExemptFromGuard(role: AgentRole): boolean {
```


## @block:getagentpriority @kind:code
```typescript
export function getAgentPriority(role: AgentRole): number {
```


## @block:validaterules @kind:code
```typescript
export function validateRules(rules: OwnershipRule[]): { valid: boolean; conflicts: string[] } {
```

