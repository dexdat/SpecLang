import { AgentInvocation } from './state.js';
import type { ThinkingLevel } from '../../parser.spec.dir/src/types.js';

export interface InvocationOptions {
  agent: string;
  trigger: string;
  params?: Record<string, unknown>;
  /**
   * THINK-002: reasoning depth for this invocation. When set, the executor
   * appends `--thinking <level>` to the underlying `speclang agent` CLI call
   * so the runtime can gate token usage per cascade phase.
   */
  thinking?: ThinkingLevel;
}

export interface InvocationResult {
  success: boolean;
  agent: string;
  timestamp: string;
  files_modified: string[];
  error?: string;
  /** THINK-002: reasoning depth used for this invocation (if any). */
  thinking?: ThinkingLevel;
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
      const result = await this.executeAgent(
        options.agent,
        options.trigger,
        options.params,
        options.thinking
      );
      files_modified.push(...result.files);

      return {
        success: result.success,
        agent: options.agent,
        timestamp,
        files_modified,
        thinking: options.thinking
      };
    } catch (error) {
      return {
        success: false,
        agent: options.agent,
        timestamp,
        files_modified,
        error: error instanceof Error ? error.message : String(error),
        thinking: options.thinking
      };
    }
  }

  private async executeAgent(
    agent: string,
    trigger: string,
    params?: Record<string, unknown>,
    thinking?: ThinkingLevel
  ): Promise<{ success: boolean; files: string[] }> {
    const { execSync } = await import('child_process');

    try {
      const command = this.buildCommand(agent, trigger, params, thinking);
      const output = execSync(command, { encoding: 'utf-8' });

      return {
        success: true,
        files: this.parseOutputFiles(output)
      };
    } catch {
      return { success: false, files: [] };
    }
  }

  private buildCommand(
    agent: string,
    trigger: string,
    params?: Record<string, unknown>,
    thinking?: ThinkingLevel
  ): string {
    const paramsStr = params ? ` ${JSON.stringify(params)}` : '';
    // THINK-002: forward the reasoning-depth gate to the agent CLI.
    const thinkingStr = thinking ? ` --thinking ${thinking}` : '';
    return `speclang agent ${agent} --trigger ${trigger}${paramsStr}${thinkingStr}`;
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
  if (trigger.startsWith('src/')) {
    return 'speclang-code-gen';
  }
  if (trigger.startsWith('tests/')) {
    return 'speclang-test-writer';
  }
  return 'speclang-coordinator';
}
