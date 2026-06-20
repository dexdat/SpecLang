# speclang-header lines:10
id: "@speclang/migrations"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "Auto-generated spec for migrations.ts"
status: draft
---

## @block:getcurrentversion @kind:code
```typescript
export function getCurrentVersion(db: DatabaseType): number {
```


## @block:migrate @kind:code
```typescript
export function migrate(db: DatabaseType): { applied: number; currentVersion: number } {
```


## @block:rollback @kind:code
```typescript
export function rollback(db: DatabaseType, targetVersion: number): boolean {
```

