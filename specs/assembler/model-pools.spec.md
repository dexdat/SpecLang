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

## See Also

- @ref:specs/assembler/config
- @ref:specs/agent-protocol - Model resolution section
- @ref:specs/cascade - Model pool dispatch section
