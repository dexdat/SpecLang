import type { ThinkingLevel } from 'parser.spec.dir/src/types.js';

import {
  mapThinkingLevel,
  normalizeProvider,
  type ProviderName,
} from './provider-adapter.js';

export interface AgentRunOptions {
  agent?: string;
  trigger: string;
  params?: Record<string, unknown>;
  thinking?: ThinkingLevel;
  provider?: string;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  dryRun?: boolean;
}

export interface ProviderRequest {
  agent: string;
  provider: ProviderName;
  model: string;
  thinking: ThinkingLevel;
  providerParams: Record<string, unknown>;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

export interface AgentRunResult {
  agent: string;
  provider: ProviderName;
  model: string;
  thinking: ThinkingLevel;
  providerParams: Record<string, unknown>;
  content: string;
  dryRun: boolean;
}

export interface AgentRuntimeDependencies {
  fetchFn?: typeof fetch;
}

const DEFAULT_MODELS: Record<ProviderName, string> = {
  openai: 'gpt-5-mini',
  openrouter: 'openai/gpt-5-mini',
  anthropic: 'claude-sonnet-4-5',
  google: 'gemini-2.5-pro',
};

const DEFAULT_BASE_URLS: Record<ProviderName, string> = {
  openai: 'https://api.openai.com',
  openrouter: 'https://openrouter.ai/api',
  anthropic: 'https://api.anthropic.com',
  google: 'https://generativelanguage.googleapis.com',
};

export function selectAgentForTrigger(trigger: string): string {
  if (trigger.endsWith('.spec.md') || trigger.endsWith('.spec')) {
    return 'speclang-spec-writer';
  }
  if (trigger.startsWith('src/') || trigger.includes('/src/')) {
    return 'speclang-code-gen';
  }
  if (trigger.startsWith('tests/') || trigger.includes('/tests/')) {
    return 'speclang-test-writer';
  }
  return 'speclang-coordinator';
}

function apiKeyForProvider(provider: ProviderName): string | undefined {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'google':
      return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  }
}

function normalizedBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function buildPrompts(
  agent: string,
  trigger: string,
  params?: Record<string, unknown>
): { system: string; user: string } {
  return {
    system: `You are the ${agent} agent in a SpecLang cascade. Respond with the work required by the trigger.`,
    user: [
      `Trigger: ${trigger}`,
      params ? `Parameters: ${JSON.stringify(params)}` : undefined,
    ].filter(Boolean).join('\n'),
  };
}

export function buildAgentRequest(options: AgentRunOptions): ProviderRequest {
  const provider = normalizeProvider(
    options.provider ?? process.env.SPECLANG_PROVIDER ?? 'openai'
  );
  const model = options.model ?? process.env.SPECLANG_MODEL ?? DEFAULT_MODELS[provider];
  const thinking = options.thinking ?? 'medium';
  const agent = options.agent ?? selectAgentForTrigger(options.trigger);
  const providerParams = mapThinkingLevel(provider, thinking);
  const baseUrl = normalizedBaseUrl(
    options.baseUrl ?? process.env.SPECLANG_BASE_URL ?? DEFAULT_BASE_URLS[provider]
  );
  const apiKey = options.apiKey ?? apiKeyForProvider(provider) ?? '';
  const prompts = buildPrompts(agent, options.trigger, options.params);

  if (provider === 'anthropic') {
    return {
      agent,
      provider,
      model,
      thinking,
      providerParams,
      url: `${baseUrl}/v1/messages`,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model,
        max_tokens: 32768,
        system: prompts.system,
        messages: [{ role: 'user', content: prompts.user }],
        ...providerParams,
      },
    };
  }

  if (provider === 'google') {
    const generationConfig = providerParams.generationConfig as Record<string, unknown>;
    const keyQuery = apiKey ? `?key=${encodeURIComponent(apiKey)}` : '';
    return {
      agent,
      provider,
      model,
      thinking,
      providerParams,
      url: `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent${keyQuery}`,
      headers: { 'content-type': 'application/json' },
      body: {
        systemInstruction: { parts: [{ text: prompts.system }] },
        contents: [{ role: 'user', parts: [{ text: prompts.user }] }],
        generationConfig,
      },
    };
  }

  return {
    agent,
    provider,
    model,
    thinking,
    providerParams,
    url: `${baseUrl}/v1/chat/completions`,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: {
      model,
      messages: [
        { role: 'system', content: prompts.system },
        { role: 'user', content: prompts.user },
      ],
      ...providerParams,
    },
  };
}

function extractContent(provider: ProviderName, payload: any): string {
  if (provider === 'anthropic') {
    return Array.isArray(payload.content)
      ? payload.content.map((part: any) => part?.text ?? '').join('')
      : '';
  }
  if (provider === 'google') {
    return payload.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text ?? '')
      .join('') ?? '';
  }
  return payload.choices?.[0]?.message?.content ?? '';
}

export async function runAgent(
  options: AgentRunOptions,
  dependencies: AgentRuntimeDependencies = {}
): Promise<AgentRunResult> {
  const request = buildAgentRequest(options);

  if (options.dryRun) {
    return {
      agent: request.agent,
      provider: request.provider,
      model: request.model,
      thinking: request.thinking,
      providerParams: request.providerParams,
      content: '',
      dryRun: true,
    };
  }

  const apiKey = options.apiKey ?? apiKeyForProvider(request.provider);
  if (!apiKey) {
    throw new Error(
      `Missing API key for ${request.provider}. Set the provider API key environment variable or pass --api-key.`
    );
  }

  const fetchFn = dependencies.fetchFn ?? fetch;
  const response = await fetchFn(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(request.body),
  });
  const payload = await response.json() as any;

  if (!response.ok) {
    const message = payload?.error?.message ?? payload?.error ?? response.statusText;
    throw new Error(`${request.provider} API request failed (${response.status}): ${message}`);
  }

  return {
    agent: request.agent,
    provider: request.provider,
    model: request.model,
    thinking: request.thinking,
    providerParams: request.providerParams,
    content: extractContent(request.provider, payload),
    dryRun: false,
  };
}
