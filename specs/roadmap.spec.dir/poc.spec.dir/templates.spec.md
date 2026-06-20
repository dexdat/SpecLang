# speclang-header lines:10
id: "@speclang/roadmap/poc/templates"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Code generation templates for POC"
tags: [poc, templates, codegen, generation]
project_level: Alpha
agent_support: agent_autonomous
---

# POC: Code Generation Templates

Simple templates for generating TypeScript from parsed blocks.

## Template System

### @poc/templates/system

**Simple string replacement (no complex templating engine for POC).**

```typescript
type Template = (data: BlockData) => string;
```

## Function Template

### @poc/templates/function

**Template:**
```typescript
const functionTemplate = (data: BlockData): string => {
  const params = data.parameters
    .map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`)
    .join(', ');
  
  const paramDocs = data.parameters
    .map(p => ` * @param ${p.name} - ${p.description}`)
    .join('\n');
  
  return `/**
 * ${data.description}
${paramDocs}
 * @returns ${data.returns?.description || 'void'}
 */
export function ${data.id}(${params}): ${data.returns?.type || 'void'} {
  // TODO: Implement
  throw new Error('Not implemented: ${data.id}');
}`;
};
```

**Example Input:**
```typescript
{
  id: 'greet',
  kind: 'function',
  description: 'Greets a user',
  parameters: [{ name: 'name', type: 'string', description: 'User name' }],
  returns: { type: 'string', description: 'Greeting' }
}
```

**Example Output:**
```typescript
/**
 * Greets a user
 * @param name - User name
 * @returns Greeting
 */
export function greet(name: string): string {
  // TODO: Implement
  throw new Error('Not implemented: greet');
}
```

## Class Template

### @poc/templates/class

**Template:**
```typescript
const classTemplate = (data: BlockData): string => {
  return `/**
 * ${data.description}
 */
export class ${data.id} {
  // TODO: Implement
  constructor() {
    throw new Error('Not implemented: ${data.id}');
  }
}`;
};
```

## Interface Template

### @poc/templates/interface

**Template:**
```typescript
const interfaceTemplate = (data: BlockData): string => {
  const properties = data.properties
    ?.map(p => `  ${p.name}${p.optional ? '?' : ''}: ${p.type};  // ${p.description}`)
    .join('\n') || '';
  
  return `/**
 * ${data.description}
 */
export interface ${data.id} {
${properties}
}`;
};
```

## Template Registry

### @poc/templates/registry

```typescript
const templates: Map<BlockKind, Template> = new Map([
  ['function', functionTemplate],
  ['class', classTemplate],
  ['interface', interfaceTemplate],
]);

export function getTemplate(kind: BlockKind): Template {
  return templates.get(kind) || functionTemplate;
}
```

## Code Header

### @poc/templates/header

**Every generated file gets this header:**
```typescript
const fileHeader = (specId: string, blockId: string) => `// SPECLANG-GENERATED: ${blockId}
// Source: specs/${specId}.spec.md#${blockId}
// DO NOT EDIT MANUALLY - Changes will be overwritten
`;
```

## Full Generation Example

### @poc/templates/example

```typescript
// Input
const block = {
  id: 'calculateTotal',
  kind: 'function',
  description: 'Calculate total price',
  parameters: [
    { name: 'price', type: 'number', description: 'Unit price' },
    { name: 'quantity', type: 'number', description: 'Quantity' }
  ],
  returns: { type: 'number', description: 'Total price' }
};

// Output
`
// SPECLANG-GENERATED: calculateTotal
// Source: specs/order.spec.md#calculateTotal
// DO NOT EDIT MANUALLY - Changes will be overwritten

/**
 * Calculate total price
 * @param price - Unit price
 * @param quantity - Quantity
 * @returns Total price
 */
export function calculateTotal(price: number, quantity: number): number {
  // TODO: Implement
  throw new Error('Not implemented: calculateTotal');
}
`;
```

## Testing

### @poc/templates/testing

```typescript
describe('Templates', () => {
  it('should generate function', () => {
    const code = functionTemplate(testBlock);
    expect(code).toContain('export function');
    expect(code).toContain('// SPECLANG-GENERATED');
  });
});
```
