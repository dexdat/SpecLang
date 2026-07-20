import type { ThinkingLevel } from 'parser.spec.dir/src/types.js';

export type ProviderName = 'openai' | 'openrouter' | 'anthropic' | 'google';

const THINKING_LEVELS = new Set<ThinkingLevel>([
  'none',
  'low',
  'medium',
  'high',
]);

export const THINKING_AGENT_ALIASES: Readonly<Record<string, string>> = {
  spec_read: 'speclang-coordinator',
  spec_merge: 'speclang-coordinator',
  spec_expand: 'speclang-spec-writer',
  code_generate: 'speclang-code-gen',
  test_generate: 'speclang-test-writer',
};

export function normalizeProvider(provider: string): ProviderName {
  const normalized = provider.trim().toLowerCase();
  const prefix = normalized.split(/[/:]/, 1)[0];

  if (prefix === 'openai') return 'openai';
  if (prefix === 'openrouter') return 'openrouter';
  if (prefix === 'anthropic') return 'anthropic';
  if (prefix === 'google' || prefix === 'gemini') return 'google';

  throw new Error(
    `Unsupported LLM provider "${provider}". Expected openai, openrouter, anthropic, or google.`
  );
}

export function isThinkingLevel(value: string): value is ThinkingLevel {
  return THINKING_LEVELS.has(value as ThinkingLevel);
}

export function mapThinkingLevel(
  provider: string,
  level: ThinkingLevel
): Record<string, unknown> {
  if (!isThinkingLevel(level)) {
    throw new Error(
      `Invalid thinking level "${level}". Expected none, low, medium, or high.`
    );
  }

  switch (normalizeProvider(provider)) {
    case 'openai':
      return { reasoning_effort: level };

    case 'openrouter':
      return level === 'none'
        ? { reasoning: { enabled: false } }
        : { reasoning: { effort: level } };

    case 'anthropic': {
      if (level === 'none') {
        return { thinking: { type: 'disabled' } };
      }
      const budgetByLevel: Record<Exclude<ThinkingLevel, 'none'>, number> = {
        low: 1024,
        medium: 4096,
        high: 16384,
      };
      return {
        thinking: {
          type: 'enabled',
          budget_tokens: budgetByLevel[level],
        },
      };
    }

    case 'google': {
      const budgetByLevel: Record<ThinkingLevel, number> = {
        none: 0,
        low: 1024,
        medium: 8192,
        high: 24576,
      };
      return {
        generationConfig: {
          thinkingConfig: {
            thinkingBudget: budgetByLevel[level],
          },
        },
      };
    }
  }
}

export function parseThinkingOverrides(
  value: string
): Record<string, ThinkingLevel> {
  if (value.trim() === '') {
    throw new Error('Thinking mapping cannot be empty. Expected agent:level.');
  }

  const result: Record<string, ThinkingLevel> = {};
  for (const rawEntry of value.split(',')) {
    const entry = rawEntry.trim();
    const separator = entry.indexOf(':');
    if (separator <= 0 || separator === entry.length - 1) {
      throw new Error(
        `Invalid thinking mapping "${entry}". Expected agent:level.`
      );
    }

    const rawAgent = entry.slice(0, separator).trim();
    const rawLevel = entry.slice(separator + 1).trim();
    if (!isThinkingLevel(rawLevel)) {
      throw new Error(
        `Invalid thinking level "${rawLevel}" for "${rawAgent}". Expected none, low, medium, or high.`
      );
    }

    const agent = THINKING_AGENT_ALIASES[rawAgent] ?? rawAgent;
    result[agent] = rawLevel;
  }

  return result;
}
