/**
 * THINK-003: provider adapter, agent runtime, and CLI thinking-map coverage.
 */

import { execFileSync } from "child_process";
import * as fs from "fs-extra";
import * as path from "path";
import { describe, expect, it, vi } from "vitest";

import {
  mapThinkingLevel,
  parseThinkingOverrides,
} from "../../specs/cascade.spec.dir/src/provider-adapter.ts";
import {
  buildAgentRequest,
  runAgent,
  selectAgentForTrigger,
} from "../../specs/cascade.spec.dir/src/agent.ts";

const REPO_ROOT = path.resolve(__dirname, "..", "..");

describe("THINK-003 — provider-aware thinking adapter", () => {
  it.each([
    ["none", { reasoning_effort: "none" }],
    ["low", { reasoning_effort: "low" }],
    ["medium", { reasoning_effort: "medium" }],
    ["high", { reasoning_effort: "high" }],
  ] as const)("maps OpenAI %s to reasoning_effort", (level, expected) => {
    expect(mapThinkingLevel("openai", level)).toEqual(expected);
  });

  it("uses Anthropic thinking budget parameters instead of OpenAI names", () => {
    expect(mapThinkingLevel("anthropic", "none")).toEqual({
      thinking: { type: "disabled" },
    });
    expect(mapThinkingLevel("anthropic", "low")).toEqual({
      thinking: { type: "enabled", budget_tokens: 1024 },
    });
    expect(mapThinkingLevel("anthropic", "high")).toEqual({
      thinking: { type: "enabled", budget_tokens: 16384 },
    });
  });

  it("maps OpenRouter and Google to their provider-specific parameter shapes", () => {
    expect(mapThinkingLevel("openrouter", "medium")).toEqual({
      reasoning: { effort: "medium" },
    });
    expect(mapThinkingLevel("google", "none")).toEqual({
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
    });
  });

  it("rejects unsupported providers", () => {
    expect(() => mapThinkingLevel("unknown-provider", "high")).toThrow(
      "Unsupported LLM provider",
    );
  });
});

describe("THINK-003 — cascade --thinking parser", () => {
  it("normalizes phase aliases into CoordinatorOptions agent keys", () => {
    expect(parseThinkingOverrides("code_generate:high,spec_read:none")).toEqual(
      {
        "speclang-code-gen": "high",
        "speclang-coordinator": "none",
      },
    );
  });

  it("accepts canonical agent names and whitespace", () => {
    expect(
      parseThinkingOverrides(" speclang-test-writer:medium , spec_expand:low "),
    ).toEqual({
      "speclang-test-writer": "medium",
      "speclang-spec-writer": "low",
    });
  });

  it("rejects malformed entries and invalid levels", () => {
    expect(() => parseThinkingOverrides("code_generate")).toThrow(
      "Expected agent:level",
    );
    expect(() => parseThinkingOverrides("code_generate:maximum")).toThrow(
      "Invalid thinking level",
    );
  });
});

describe("THINK-003 — agent runtime", () => {
  it("selects the cascade agent from --trigger when no agent is explicit", () => {
    expect(selectAgentForTrigger("specs/foo.spec.md")).toBe(
      "speclang-spec-writer",
    );
    expect(selectAgentForTrigger("src/foo.ts")).toBe("speclang-code-gen");
    expect(selectAgentForTrigger("tests/foo.test.ts")).toBe(
      "speclang-test-writer",
    );
    expect(selectAgentForTrigger("docs/foo.md")).toBe("speclang-coordinator");
  });

  it("builds the default OpenAI request with mapped reasoning effort", () => {
    const request = buildAgentRequest({
      trigger: "src/foo.ts",
      thinking: "high",
      apiKey: "test-key",
    });

    expect(request.agent).toBe("speclang-code-gen");
    expect(request.provider).toBe("openai");
    expect(request.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(request.headers.authorization).toBe("Bearer test-key");
    expect(request.body.reasoning_effort).toBe("high");
  });

  it("applies the adapter to the real API request boundary", async () => {
    const fetchFn = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(body.reasoning_effort).toBe("low");
      expect(body.messages[1].content).toContain("src/foo.ts");
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "agent response" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const result = await runAgent(
      {
        trigger: "src/foo.ts",
        thinking: "low",
        apiKey: "test-key",
      },
      { fetchFn },
    );

    expect(fetchFn).toHaveBeenCalledOnce();
    expect(result.content).toBe("agent response");
    expect(result.providerParams).toEqual({ reasoning_effort: "low" });
  });

  it("exposes agent and cascade thinking flags in the public CLI", () => {
    // TEST-ISOLATION-001: spawn the CLI from a per-test temp cwd (never the
    // repo root) so no CLI code path can regenerate the tracked _index.json.
    const cliCwd = fs.mkdtempSync(
      path.join(REPO_ROOT, ".tmp", "think003-cli-"),
    );
    try {
      const agentHelp = execFileSync(
        "node",
        [path.join(REPO_ROOT, "bin", "speclang"), "agent", "--help"],
        { cwd: cliCwd, encoding: "utf-8" },
      );
      const cascadeHelp = execFileSync(
        "node",
        [path.join(REPO_ROOT, "bin", "speclang"), "cascade", "--help"],
        { cwd: cliCwd, encoding: "utf-8" },
      );

      expect(agentHelp).toContain("--trigger <path>");
      expect(agentHelp).toContain("--thinking <level>");
      expect(cascadeHelp).toContain("--thinking <mapping>");
    } finally {
      fs.removeSync(cliCwd);
    }
  });
});
