---
id: "@speclang/assembler/model-pools"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [assembler, model-pools, providers, rate-limits, concurrency, downgrade]
short: "Model pool system — provider configuration, rate limits, capability grouping"
status: draft
---

# Model Pools

Users bring their own API keys from multiple providers. The model pool system pools concurrency across providers and groups models by capability.

## Pool Configuration

```yaml
# In .speclangrc
model_pools:
  # Same model from multiple providers = pooled concurrency
  code-gen:
    max_concurrent: 15
    models:
      - provider: openai
        model: gpt-4o
        max_concurrent: 5
      - provider: openrouter
        model: gpt-4o
        max_concurrent: 10

  # Different models with same capability = named pool
  spec-writer:
    max_concurrent: 8
    models:
      - provider: openai
        model: gpt-4o
        max_concurrent: 5
      - provider: anthropic
        model: claude-3-opus
        max_concurrent: 3

  # Budget pool for low-stakes work
  cheap:
    max_concurrent: 50
    models:
      - provider: openai
        model: gpt-4o-mini
        max_concurrent: 20
      - provider: openrouter
        model: gpt-4o-mini
        max_concurrent: 30
        quality: downgrade  # Reduced context window
```

## Provider Configuration

```yaml
providers:
  openai:
    api_key_env: "OPENAI_API_KEY"
    base_url: "https://api.openai.com/v1"
    rate_limit_rpm: 500

  openrouter:
    api_key_env: "OPENROUTER_API_KEY"
    base_url: "https://openrouter.ai/api/v1"
    rate_limit_rpm: 1000

  anthropic:
    api_key_env: "ANTHROPIC_API_KEY"
    base_url: "https://api.anthropic.com/v1"
    rate_limit_rpm: 200
```

## Rate Limit Resolution

When dispatching a cascade item, the effective rate limit is:

```
effective_max = min(spec.header.max_concurrent, pool.max_concurrent, provider.max_concurrent)
```

All three must allow the dispatch. If any limit is reached, the item is queued.

### Header Fields

- `model:` — Explicit model override (e.g., `openai/gpt-4o`)
- `model_pool:` — Named pool to use (e.g., `code-gen`)
- `max_concurrent:` — Per-spec concurrency cap
- `rate_limit:` — Per-spec rate limit (cascade triggers per minute)
- `quality:` — `production` or `downgrade`

### Resolution Order (first match wins)

1. Header `model:` field — explicit model for this spec
2. Header `model_pool:` field — named pool of models with this capability
3. File pattern default — owned-by role's default model

## Downgrade Handling

Some providers offer models with reduced capabilities:

| Provider | Issue | Flag |
|----------|-------|------|
| GitHub (Copilot) | 128K context instead of 400K | `quality: downgrade` |
| Budget endpoints | Lower rate limits, older quantizations | `quality: downgrade` |

Models flagged `quality: downgrade` are:

- Avoided for specs with `quality: production` in their header
- Used only when no production model is available in the pool
- Available for specs with `quality: downgrade` or no quality field

## Language → Skill Routing

The `target_lang` field in a spec header determines which skill set handles it. Two field formats are supported:

```
target_lang: py              # Base language → routes to core skill set
target_lang: py:3.12         # Language + version → routes to version-specific sub-skill
target_lang: py:pydantic-v2  # Language + feature → routes to feature-specific sub-skill
```

### Core Language Routing Table

All 25+ languages. ✅ = full skill + resources. ⬜ = stub (falls back to agnostic for code-gen/test-writer, spec-writer routes to language folder).

| target_lang | SpecWriter | CodeGen | TestWriter | Extension | Status |
|-------------|-----------|---------|------------|-----------|--------|
| `ts` / `typescript` | typescript/spec-writer | typescript/code-gen | typescript/test-writer | `.spec.ts.md` | ✅ |
| `py` / `python` | python/spec-writer | python/code-gen | python/test-writer | `.spec.py.md` | ✅ |
| `go` / `golang` | go/spec-writer | go/code-gen | go/test-writer | `.spec.go.md` | ✅ |
| `rs` / `rust` | rust/spec-writer | agnostic | agnostic | `.spec.rs.md` | ⬜ |
| `java` | java/spec-writer | agnostic | agnostic | `.spec.java.md` | ⬜ |
| `cs` / `csharp` | csharp/spec-writer | agnostic | agnostic | `.spec.cs.md` | ⬜ |
| `rb` / `ruby` | ruby/spec-writer | agnostic | agnostic | `.spec.rb.md` | ⬜ |
| `php` | php/spec-writer | agnostic | agnostic | `.spec.php.md` | ⬜ |
| `swift` | swift/spec-writer | agnostic | agnostic | `.spec.swift.md` | ⬜ |
| `kt` / `kotlin` | kotlin/spec-writer | agnostic | agnostic | `.spec.kt.md` | ⬜ |
| `dart` | dart/spec-writer | agnostic | agnostic | `.spec.dart.md` | ⬜ |
| `c` | c/spec-writer | agnostic | agnostic | `.spec.c.md` | ⬜ |
| `cpp` / `c++` | cpp/spec-writer | agnostic | agnostic | `.spec.cpp.md` | ⬜ |
| `scala` | scala/spec-writer | agnostic | agnostic | `.spec.scala.md` | ⬜ |
| `ex` / `elixir` | elixir/spec-writer | agnostic | agnostic | `.spec.ex.md` | ⬜ |
| `hs` / `haskell` | haskell/spec-writer | agnostic | agnostic | `.spec.hs.md` | ⬜ |
| `clj` / `clojure` | clojure/spec-writer | agnostic | agnostic | `.spec.clj.md` | ⬜ |
| `lua` | lua/spec-writer | agnostic | agnostic | `.spec.lua.md` | ⬜ |
| `r` | r/spec-writer | agnostic | agnostic | `.spec.r.md` | ⬜ |
| `jl` / `julia` | julia/spec-writer | agnostic | agnostic | `.spec.jl.md` | ⬜ |
| `zig` | zig/spec-writer | agnostic | agnostic | `.spec.zig.md` | ⬜ |
| `pl` / `perl` | perl/spec-writer | agnostic | agnostic | `.spec.pl.md` | ⬜ |
| `groovy` | groovy/spec-writer | agnostic | agnostic | `.spec.groovy.md` | ⬜ |
| `erl` / `erlang` | erlang/spec-writer | agnostic | agnostic | `.spec.erl.md` | ⬜ |
| `fs` / `fsharp` | fsharp/spec-writer | agnostic | agnostic | `.spec.fs.md` | ⬜ |
| `objc` | objc/spec-writer | agnostic | agnostic | `.spec.m.md` | ⬜ |
| `*` / `any` | agnostic/spec-writer | agnostic/code-gen | agnostic/test-writer | `.spec.md` | ✅ |

### Version Sub-Skills

When `target_lang` includes a version (e.g., `py:3.12`, `ts:5.4`), the cascade resolves to a version-specific sub-skill if one exists, falling back to the base language skill:

```
target_lang: py:3.12
  → try: @speclang/skills/code-gen-python-3.12
  → fallback: @speclang/skills/code-gen-python

target_lang: ts:5.4
  → try: @speclang/skills/code-gen-typescript-5.4
  → fallback: @speclang/skills/code-gen
```

Version sub-skills handle language-specific features (e.g., Python 3.12 `type` statement, TypeScript 5.4 `NoInfer`).

### Feature Sub-Skills

When `target_lang` includes a feature tag (e.g., `py:pydantic-v2`, `ts:decorators-experimental`), the cascade resolves to a feature-specific sub-skill:

```
target_lang: py:pydantic-v2
  → try: @speclang/skills/code-gen-python-pydantic-v2
  → fallback: @speclang/skills/code-gen-python

target_lang: ts:decorators-experimental
  → try: @speclang/skills/code-gen-typescript-decorators-experimental
  → fallback: @speclang/skills/code-gen
```

Feature sub-skills handle experimental or specialized frameworks/libraries. They're designed to be swapped in/out without changing the base language skill.

**Tag naming convention:** `{lang}:{feature-name}` where feature-name uses hyphens. Experimental features use `-experimental` suffix.

### Language-Agnostic Catch-All

The `*` / `any` target routes to **language-agnostic skills** that produce implementation-agnostic specifications:

- **No code generation** — produces structural specs only (entities, relationships, constraints)
- **Pseudo-code blocks** — uses ` ```pseudo ` code fences for algorithm descriptions
- **Output:** `.spec.md` with resolved refs but no language-specific assembly
- **Purpose:** Future-proofing — any new language can start here before dedicated skills are built

```
target_lang: any
  → @speclang/skills/spec-writer-agnostic
  → produces: structural specs with pseudo-code blocks
```

### Resolution Order

1. Read `target_lang` from spec header (accepts `target_lang`, `target_lang`, or `target`)
2. Parse the value: `{base}[:{version_or_feature}]`
3. If version/feature present, try version/feature sub-skill first
4. Fall back to base language skill
5. If base language has no dedicated skills, route to `spec-writer-agnostic`/`code-gen-agnostic`/`test-writer-agnostic`
6. If no `target_lang` at all, default to `ts` (TypeScript)

### Assembler Aliases

The assembler already supports all common language aliases for code fence extraction:

```typescript
const aliases: Record<string, string[]> = {
  ts:     ['typescript', 'ts'],
  py:     ['python', 'py'],
  go:     ['go', 'golang'],
  rs:     ['rust', 'rs'],
  js:     ['javascript', 'js'],
  java:   ['java'],
  cs:     ['csharp', 'cs', 'c#'],
  rb:     ['ruby', 'rb'],
  php:    ['php'],
  swift:  ['swift'],
  kt:     ['kotlin', 'kt'],
  dart:   ['dart'],
  any:    ['pseudo', 'text'],  // agnostic → pseudo-code blocks
};
```

### Skill Folder Structure

Each language has its own folder under `specs/skills.spec.dir/` with a `resources/` subdirectory:

```
specs/skills.spec.dir/
├── typescript/              # ts, typescript
│   ├── spec-writer.spec.md
│   ├── code-gen.spec.md
│   ├── test-writer.spec.md
│   └── resources/
│       ├── INDEX.md         # Lists all resources for this language
│       ├── decorators-experimental.md
│       └── ts-5.4-features.md
├── python/                  # py, python
│   ├── spec-writer.spec.md
│   ├── code-gen.spec.md
│   ├── test-writer.spec.md
│   └── resources/
│       ├── INDEX.md
│       ├── pydantic-v2.md
│       └── python-3.12-features.md
├── go/                      # go, golang
│   ├── spec-writer.spec.md
│   ├── code-gen.spec.md
│   ├── test-writer.spec.md
│   └── resources/
│       ├── INDEX.md
│       └── go-generics.md
├── agnostic/                # any, *
│   ├── spec-writer.spec.md
│   ├── code-gen.spec.md
│   ├── test-writer.spec.md
│   └── resources/
│       ├── INDEX.md
│       └── pseudo-code-guide.md
├── rust/    (stub → agnostic)
├── java/    (stub → agnostic)
├── csharp/  (stub → agnostic)
├── ruby/    (stub → agnostic)
├── php/     (stub → agnostic)
├── swift/   (stub → agnostic)
├── kotlin/  (stub → agnostic)
└── dart/    (stub → agnostic)
```

### Resource Loading

When a feature tag is specified (e.g., `target_lang: py:pydantic-v2`), the cascade loads the corresponding resource file and injects it into the model's context:

```
target_lang: py:pydantic-v2
  → load: specs/skills.spec.dir/python/resources/pydantic-v2.md
  → inject into model context before code generation
  → model now knows Pydantic v2 syntax (model_config, field_validator, etc.)
```

**Loading order:**
1. Load base language skill (e.g., `python/code-gen.spec.md`)
2. If version tag present, load version resource (e.g., `python/resources/python-3.12-features.md`)
3. If feature tag present, load feature resource (e.g., `python/resources/pydantic-v2.md`)
4. Resources are appended to the model's system prompt as reference material

**Why folders + resources instead of flat skills:**
- New Go generics? Add `go/resources/go-generics.md` — no skill rewrite needed
- Python 3.13 pattern matching? Add `python/resources/python-3.13-features.md`
- Experimental TypeScript feature? Add a file, reference in INDEX.md, works immediately
- Resources explain concepts to the model without changing the core generation logic

## See Also

- @ref:specs/assembler/config
- @ref:specs/agent-protocol - Model resolution section
- @ref:specs/cascade - Model pool dispatch section
