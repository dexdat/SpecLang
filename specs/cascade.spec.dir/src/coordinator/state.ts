/**
speclang-header lines:5
id: @specs/cascade
version: 1.0.0
layer: 5
 */

export interface CascadeState {
  cascade_id: string;
  depth: number;
  max_depth: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
  trigger_file: string;
  current_agent: string;
  agents_invoked: AgentInvocation[];
  verification_results: VerificationResult[];
  depth_by_tree: Record<string, number>;
}

export interface AgentInvocation {
  agent: string;
  timestamp: string;
  result: 'success' | 'failure';
  files_modified: string[];
}

export interface VerificationResult {
  step: number;
  timestamp: string;
  checks: {
    compilation: { status: string; files_checked: number };
    references: { status: string; broken_refs: number };
    tests: { status: string; passed: number; failed: number };
  };
}

export type CascadeStatus = 'running' | 'paused' | 'completed' | 'failed';

export function createInitialState(
  triggerFile: string,
  maxDepth: number = 5
): CascadeState {
  return {
    cascade_id: `cascade-${Date.now()}`,
    depth: 0,
    max_depth: maxDepth,
    status: 'running',
    trigger_file: triggerFile,
    current_agent: '',
    agents_invoked: [],
    verification_results: [],
    depth_by_tree: { specs: 0, src: 0, tests: 0, docs: 0 }
  };
}
