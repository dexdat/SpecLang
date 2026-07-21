# speclang-header lines:10
id: "@specs/cascade/provider-adapter"
version: 1.0.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [cascade, thinking, provider, cli]
short: Provider-aware mapping from abstract thinking levels to LLM API parameters
status: active
---

# THINK-003 — Provider adapter and agent CLI

## Purpose

The cascade exposes provider-neutral `ThinkingLevel` values. The runtime must translate those values at the provider boundary rather than leaking provider-specific API fields into coordinator logic.

## Provider adapter

`src/provider-adapter.ts` is the source-of-truth implementation and is dual-viewed at `src/cascade/provider-adapter.ts`.

- OpenAI uses `reasoning_effort` with `none`, `low`, `medium`, and `high`.
- OpenRouter uses the nested `reasoning.effort` field and disables reasoning for `none`.
- Anthropic uses `thinking.type`; enabled levels receive increasing `budget_tokens`.
- Google uses `generationConfig.thinkingConfig.thinkingBudget`.
- Unknown providers, levels, malformed CLI entries, and empty mappings fail with actionable errors.

The adapter also parses `--thinking=agent:level,...`. Friendly cascade phase aliases are normalized to coordinator agent names:

- `spec_read` and `spec_merge` → `speclang-coordinator`
- `spec_expand` → `speclang-spec-writer`
- `code_generate` → `speclang-code-gen`
- `test_generate` → `speclang-test-writer`

## Agent runtime

`src/agent.ts` is dual-viewed at `src/cascade/agent.ts`. It selects an agent from `--trigger` when no explicit agent is supplied, builds a provider-specific request, applies the provider adapter exactly once at the API boundary, and sends the request through `fetch`.

The default provider is OpenAI. Provider/model/base URL/API key can be selected by CLI flags or environment variables. `--dry-run` returns the selected agent and provider parameters without making a network request.

## CLI wiring

- `speclang agent [agent] --trigger <path> --thinking <level>` invokes the runtime.
- `speclang cascade <spec> --thinking=agent:level,...` parses the mapping and forwards it as `CascadeOptions.thinking`, which uses the same shape as `CoordinatorOptions.thinking`.
- The spec-based Commander CLI exposes the same cascade thinking syntax.

## Verification

- `npx vitest run tests/daemon/think003-provider-adapter.test.ts`
- `npm test`
- `npm run build`
- `node bin/speclang agent --trigger src/example.ts --thinking high --dry-run --json`
- `node bin/speclang cascade specs/example.spec.md --thinking=code_generate:high,spec_read:none`
