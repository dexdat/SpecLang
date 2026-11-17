# speclang-header lines:6
id: "@agent-driver/baseline"
version: 0.1.0
layer: 1
target_lang: ts
---

# Agent-driver baseline seed

This is the single seed file an agent session writes to start a SpecLang loop.
Every `### @block::<name> @kind:<kind>` heading below becomes one file under
`<directory containing this seed>/../generated/` — for this file that is
`scripts/generated/`.

Keep the seed small and unambiguous: the cascade copies each fenced body
verbatim, so what you see in the fence is what lands on disk.

## Implementation

### @block::greeting @kind:code
```ts
export interface GreetingOptions {
  name: string;
  punctuation?: string;
}

/** Render a greeting for one name. */
export function greet(options: GreetingOptions): string {
  const mark = options.punctuation ?? '!';
  return `Hello, ${options.name}${mark}`;
}
```

### @block::farewell @kind:code
```ts
/** Render a farewell for one name. */
export function farewell(name: string): string {
  return `Goodbye, ${name}.`;
}
```
