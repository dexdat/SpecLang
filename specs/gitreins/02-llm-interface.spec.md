# speclang-header lines:11
id: "@gitreins/02-llm-interface"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, llm]
status: imported
short: "LLM Interface — provider-agnostic LLM wrapper with structured output parsing"
realized_by: gitreins-poc/engine/llm.py
---

# 02 — LLM Interface

> **Status:** Implemented  
> **Realized by:** `engine/llm.py` (298 lines)  
> **Reverse-engineered:** 2026-06-09

## 1. Overview

Multi-provider chat completions client with retry logic, autodetection, and format conversion. Supports OpenAI-compatible and Anthropic-native APIs.

## Requirements

### @block:llm/multi-provider-support @kind:requirement

The LLM client MUST support both OpenAI-compatible (`/v1/chat/completions`) and Anthropic-native (`/v1/messages`) APIs. Provider is auto-detected from the base URL or can be forced via configuration.

**Realized by:** `engine/llm.py:46-84` — `LLMClient.__init__()`.

### @block:llm/env-configuration @kind:requirement

LLM configuration MUST be read from environment variables with sensible defaults:

| Variable | Purpose | Default |
|----------|---------|---------|
| `GITREINS_LLM_BASE_URL` | API base URL | `https://api.openai.com/v1` |
| `GITREINS_LLM_API_KEY` | API key | (blank — falls back) |
| `GITREINS_LLM_MODEL` | Model name | `gpt-4o-mini` |
| `GITREINS_LLM_PROVIDER` | Force provider: "openai" / "anthropic" | auto-detect |

**Realized by:** `engine/llm.py:46-83`.

### @block:llm/api-key-fallback @kind:requirement

When `GITREINS_LLM_API_KEY` is not set, the client MUST check these env vars in order: `NEURALWATT_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`.

**Realized by:** `engine/llm.py:59-64`.

### @block:llm/provider-auto-detection @kind:requirement

Provider MUST be auto-detected from the base URL. If the URL contains "anthropic.com" or "claude", the provider is `anthropic`. Otherwise, `openai`.

**Realized by:** `engine/llm.py:40-43` — `_is_anthropic()`.

### @block:llm/retry-backoff @kind:requirement

Chat requests MUST retry up to 3 times with exponential backoff (2^n seconds). 4xx errors (except 429 rate-limit) MUST NOT be retried. Network errors and 5xx are retried.

**Realized by:** `engine/llm.py:86-114` — `chat()` method.

### @block:llm/tool-calling @kind:requirement

The client MUST support tool calling (function calling) with both providers. OpenAI format is the internal representation. Anthropic tools and messages MUST be converted automatically.

**Realized by:** `engine/llm.py:177-298` — `_chat_openai()`, `_chat_anthropic()`, conversion helpers.

### @block:llm/openai-message-format @kind:requirement

OpenAI-compatible path MUST send standard payload with model, messages, temperature, max_tokens, tools, and tool_choice=auto. Tool calls parsed from `choices[0].message.tool_calls`.

**Realized by:** `engine/llm.py:130-180`.

### @block:llm/anthropic-message-format @kind:requirement

Anthropic path MUST extract system message separately, convert alternating user/assistant messages, merge tool results into user messages with `tool_result` blocks, and parse `content` array for text and `tool_use` blocks.

**Realized by:** `engine/llm.py:183-298`.

### @block:llm/data-types @kind:requirement

The module MUST export these dataclasses:

- `ToolCall`: with `id: str`, `name: str`, `arguments: dict[str, Any]`
- `LLMResponse`: with `content: str | None`, `tool_calls: list[ToolCall]`

**Realized by:** `engine/llm.py:27-37`.

### @block:llm/request-timeout @kind:requirement

HTTP requests MUST have a 120-second timeout.

**Realized by:** `engine/llm.py:153`, line 221 — `timeout=120`.

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/02-LLM-Interface.md impl=engine/llm.py
