/**
 * Event router for speclangd - Maps file changes to responsible agents
 * 
 * Generated from: @speclang/daemon/routing
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import {
  FileEvent,
  AgentTask,
  AgentTaskKind,
  AgentId,
  RouteRule,
} from './types';

export class Router extends EventEmitter {
  private rules: RouteRule[];
  private agentSessions: Map<AgentId, AgentSession>;
  private cascadeDepth: number;

  constructor() {
    super();
    this.rules = this.initializeRules();
    this.agentSessions = new Map();
    this.cascadeDepth = 0;
  }

  /**
   * Initialize routing rules from spec
   */
  private initializeRules(): RouteRule[] {
    return [
      {
        // project.scl → NorthStarAgent
        pattern: /project\.scl$/,
        agent: 'northstar',
        taskKind: AgentTaskKind.SpecWriter,
      },
      {
        // specs/**/*.scl → SpecAgent
        pattern: /specs\/.*\.scl$/,
        agent: 'spec-agent',
        taskKind: AgentTaskKind.SpecWriter,
      },
      {
        // specs/**/*.spec.md → SpecAgent
        pattern: /specs\/.*\.spec\.md$/,
        agent: 'spec-agent',
        taskKind: AgentTaskKind.SpecWriter,
      },
      {
        // specs/**/*.spec.yaml → SpecAgent
        pattern: /specs\/.*\.spec\.(yaml|yml)$/,
        agent: 'spec-agent',
        taskKind: AgentTaskKind.SpecWriter,
      },
      {
        // tests/**/*.test.spec.scl → TestAgent
        pattern: /tests\/.*\.test\.spec\.scl$/,
        agent: 'test-agent',
        taskKind: AgentTaskKind.TestWriter,
      },
      {
        // generated/**/*.go → CodeAgent-Go
        pattern: /generated\/.*\.go$/,
        agent: 'code-agent-go',
        taskKind: AgentTaskKind.CodeGen,
      },
      {
        // generated/**/*.ts → CodeAgent-TS
        pattern: /generated\/.*\.ts$/,
        agent: 'code-agent-ts',
        taskKind: AgentTaskKind.CodeGen,
      },
      {
        // generated/**/*.js → CodeAgent-JS
        pattern: /generated\/.*\.js$/,
        agent: 'code-agent-js',
        taskKind: AgentTaskKind.CodeGen,
      },
      {
        // generated/**/*.py → CodeAgent-Python
        pattern: /generated\/.*\.py$/,
        agent: 'code-agent-python',
        taskKind: AgentTaskKind.CodeGen,
      },
      {
        // generated/**/*.rs → CodeAgent-Rust
        pattern: /generated\/.*\.rs$/,
        agent: 'code-agent-rust',
        taskKind: AgentTaskKind.CodeGen,
      },
    ];
  }

  /**
   * Route a file event to the responsible agent
   */
  route(event: FileEvent): AgentTask | null {
    const filePath = event.path.replace(/\\/g, '/');
    
    // Find matching rule
    for (const rule of this.rules) {
      if (rule.pattern.test(filePath)) {
        const task: AgentTask = {
          kind: rule.taskKind,
          trigger: event.path,
          spec: this.extractSpecPath(event.path),
          target: this.extractTargetPath(event.path),
        };

        // Increment cascade depth for non-spec files
        if (event.path.includes('generated/')) {
          this.cascadeDepth++;
        }

        this.emit('route', {
          event,
          task,
          agent: rule.agent,
        });

        return task;
      }
    }

    // No matching rule - check if it's a human edit in generated/
    if (filePath.includes('generated/')) {
      return {
        kind: AgentTaskKind.BackSync,
        trigger: event.path,
        code: event.path,
      };
    }

    return null;
  }

  /**
   * Extract spec path from file path
   */
  private extractSpecPath(filePath: string): string {
    // For generated files, find corresponding spec
    const normalized = filePath.replace(/\\/g, '/');
    
    // Look for .spec.* in path
    const specMatch = normalized.match(/(.*)\.(spec\.[^.]+)$/);
    if (specMatch) {
      return specMatch[1];
    }

    // Look in specs/ directory
    if (normalized.includes('generated/')) {
      const baseName = path.basename(normalized, path.extname(normalized));
      return `specs/${baseName}`;
    }

    return filePath;
  }

  /**
   * Extract target path from file path
   */
  private extractTargetPath(filePath: string): string {
    // For specs, determine output location
    const normalized = filePath.replace(/\\/g, '/');
    
    if (normalized.startsWith('specs/')) {
      return normalized.replace('specs/', 'generated/');
    }

    return filePath;
  }

  /**
   * Register an agent session
   */
  registerAgent(agentId: AgentId, session: AgentSession): void {
    this.agentSessions.set(agentId, session);
    console.log(`[Router] Registered agent: ${agentId}`);
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: AgentId): void {
    this.agentSessions.delete(agentId);
    console.log(`[Router] Unregistered agent: ${agentId}`);
  }

  /**
   * Get current cascade depth
   */
  getCascadeDepth(): number {
    return this.cascadeDepth;
  }

  /**
   * Reset cascade depth
   */
  resetCascadeDepth(): void {
    this.cascadeDepth = 0;
  }

  /**
   * Get agent for a task
   */
  getAgentForTask(task: AgentTask): AgentId {
    switch (task.kind) {
      case AgentTaskKind.SpecWriter:
        return 'spec-agent';
      case AgentTaskKind.CodeGen:
        return this.getCodeAgentForTarget(task.target || '');
      case AgentTaskKind.TestWriter:
        return 'test-agent';
      case AgentTaskKind.BackSync:
        return 'backsync-agent';
      default:
        return 'unknown';
    }
  }

  private getCodeAgentForTarget(target: string): AgentId {
    if (target.endsWith('.go')) return 'code-agent-go';
    if (target.endsWith('.ts')) return 'code-agent-ts';
    if (target.endsWith('.js')) return 'code-agent-js';
    if (target.endsWith('.py')) return 'code-agent-python';
    if (target.endsWith('.rs')) return 'code-agent-rust';
    return 'code-agent';
  }
}

// Agent session interface
export interface AgentSession {
  id: AgentId;
  status: 'idle' | 'busy' | 'error';
  currentTask?: AgentTask;
  notify(event: FileEvent, task: AgentTask): Promise<boolean>;
}
