import { AgentInvocation } from './state.js';

export interface InvocationOptions {
  agent: string;
  trigger: string;
  params?: Record<string, unknown>;
}

export interface InvocationResult {
  success: boolean;
  agent: string;
  timestamp: string;
  files_modified: string[];
  error?: string;
}

export class AgentInvoker {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  async invoke(options: InvocationOptions): Promise<InvocationResult> {
    const timestamp = new Date().toISOString();
    const files_modified: string[] = [];

    if (this.verbose) {
      console.log(`[AgentInvoker] Invoking agent: ${options.agent} for trigger: ${options.trigger}`);
    }

    try {
      const result = await this.executeAgent(options.agent, options.trigger, options.params);
      files_modified.push(...result.files);

      return {
        success: result.success,
        agent: options.agent,
        timestamp,
        files_modified
      };
    } catch (error) {
      return {
        success: false,
        agent: options.agent,
        timestamp,
        files_modified,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeAgent(
    agent: string,
    trigger: string,
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; files: string[] }> {
    const { execSync } = await import('child_process');

    try {
      const command = this.buildCommand(agent, trigger, params);
      const output = execSync(command, { encoding: 'utf-8' });

      return {
        success: true,
        files: this.parseOutputFiles(output)
      };
    } catch {
      return { success: false, files: [] };
    }
  }

  private buildCommand(agent: string, trigger: string, params?: Record<string, unknown>): string {
    const paramsStr = params ? ` ${JSON.stringify(params)}` : '';
    return `speclang agent ${agent} --trigger ${trigger}${paramsStr}`;
  }

  private parseOutputFiles(output: string): string[] {
    const files: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const match = line.match(/Created: (.+)/);
      if (match) {
        files.push(match[1]);
      }
    }

    return files;
  }

  createInvocationRecord(
    result: InvocationResult,
    files: string[]
  ): AgentInvocation {
    return {
      agent: result.agent,
      timestamp: result.timestamp,
      result: result.success ? 'success' : 'failure',
      files_modified: files
    };
  }
}

export function getAgentForTrigger(trigger: string): string {
  if (trigger.endsWith('.spec.md') || trigger.endsWith('.spec')) {
    return 'speclang-spec-writer';
  }
  if (trigger.endsWith('.spec.py')) {
    return 'speclang-code-gen-python';
  }
  if (trigger.endsWith('.spec.ts')) {
    return 'speclang-code-gen-typescript';
  }
  if (trigger.endsWith('.spec.go')) {
    return 'speclang-code-gen-go';
  }
  if (trigger.startsWith('src/')) {
    return 'speclang-code-gen';
  }
  if (trigger.startsWith('tests/')) {
    return 'speclang-test-writer';
  }
  return 'speclang-coordinator';
}
