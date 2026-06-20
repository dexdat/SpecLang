# speclang-header lines:15
id: "@speclang/spec-format/blocks"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [format, syntax, self-describing]
status: draft
parent: "@ref:specs/spec-format"
part: 2/2
siblings:
  prev: "@ref:specs/spec-format.spec.dir/structure"

short: Spec Format - Blocks
---

# Spec Format: Blocks

## Block

### @format/block

```speclang
# @block:format/block @kind:entity
Block:
  syntax: "# @block:{id} @kind:{kind} @{attr}:{value}*"
  
  parts:
    - id: unique block identifier
    - kind: what type of content
    - attrs: optional key:value pairs
    - content: until next block or EOF
  
  id_format: domain/path/name
    - no spaces, use hyphens
    - hierarchical with /
    - unique within project
```

### @format/block-example

```speclang
# @block:format/block-example @kind:code
```speclang
# @block:auth/login @kind:operation @status:draft
login(email: String, password: String) -> Result<Token, Error>

steps:
  - find user by email
  - verify password
  - generate token

refs: ["@ref:northstar#auth"", "@ref:stdlib/Result""]
```
```

## Kinds

### @format/kinds

```speclang
# @block:format/kinds @kind:table
| Kind | Use | Content |
|------|-----|---------|
| entity | data structure | fields, types |
| operation | function/action | signature, steps |
| policy | rules | conditions, effects |
| test | test spec | given/when/then |
| mock | test double | behavior |
| diagram | visual | mermaid, etc |
| code | implementation | any language |
| note | explanation | prose |
| question | unresolved | question text |
| decision | ADR | context, decision |
```

## Content Types

### @format/prose

```speclang
# @block:format/prose @kind:note
Plain text. Paragraphs separated by blank lines.

No special syntax. Just write.

Use markdown for formatting:
- **bold** for emphasis
- `code` for inline code
- [links](url) for references
```

### @format/code-fence

```speclang
# @block:format/code-fence @kind:note
Code blocks use triple backticks with language:

```language
code here
```

Language can be:
- programming: typescript, go, rust, python
- spec: speclang, ebnf
- diagram: mermaid, plantuml
- math: latex
- data: yaml, json, toml
```

### @format/table

```speclang
# @block:format/table @kind:note
Standard markdown tables:

| Column1 | Column2 |
|---------|---------|
| value1  | value2  |
| value3  | value4  |
```

### @format/list

```speclang
# @block:format/list @kind:note
Bullet lists:
- item one
- item two
  - nested item

Numbered:
1. first
2. second
3. third
```

## References

### @format/ref

```speclang
# @block:format/ref @kind:entity
Reference:
  syntax: "@ref:path/to/block"
  inline: see @ref:format/ref for details
  explicit: refs: ["@ref:format/block"", "@ref:format/kinds""]
  
  forms:
    "@ref:spec"           -> entire spec
    @ref:spec#block     -> specific block
    @ref:file.ext#loc   -> generated code location
```

### @format/ref-usage

```speclang
# @block:format/ref-usage @kind:code
```speclang
# @block:auth/login @kind:operation
refs: ["@ref:northstar#auth"", "@ref:stdlib/Result"", "@ref:specs/users#User""]

Steps:
1. Validate email format using regex
2. Look up user by email in database
3. Verify password hash matches stored hash
4. Generate JWT token with user claims
5. Return token wrapped in Result<Token, Error>

login uses User from @ref:specs/users#User.
Returns Result from @ref:stdlib/Result.
Part of auth feature from @ref:northstar#auth.
```
```

## Generated Code Markers

### @format/markers

```speclang
# @block:format/markers @kind:entity
GeneratedCodeMarker:
  purpose: link code back to spec
  
  format:
    // SPECLANG-ID: "@ref:specs/auth#login"
    // SPECLANG-NORTHSTAR: "@ref:northstar#auth"
    // SPECLANG-VERSION: 1.2.0
    // SPECLANG-GENERATED: DO NOT EDIT
  
  placement: at top of generated file or before each function
```

### @format/marker-example

```speclang
# @block:format/marker-example @kind:code
```typescript
// SPECLANG-ID: "@ref:specs/auth#login"
// SPECLANG-NORTHSTAR: "@ref:northstar#auth"
// SPECLANG-VERSION: 1.0.0
// SPECLANG-GENERATED: DO NOT EDIT

export async function login(email: string, password: string): Promise<Result<Token, AuthError>> {
  // implementation
}
```
```