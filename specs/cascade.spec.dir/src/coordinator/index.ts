import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { DependencyTracker, CascadeState, TreeNode } from './dependency.js';

export interface VerificationGate {
  name: string;
  check: () => Promise<GateResult>;
}

export interface GateResult {
  passed: boolean;
  message: string;
  details?: string[];
}

export interface CoordinatorOptions {
  maxDepth?: number;
  verbose?: boolean;
  skipTests?: boolean;
}

export class CascadeCoordinator {
  private tracker: DependencyTracker;
  private state: CascadeState;
  private options: CoordinatorOptions;
  private gates: VerificationGate[] = [];

  constructor(
    indexPath: string = '_index.json',
    options: CoordinatorOptions = {}
  ) {
    this.tracker = new DependencyTracker(indexPath);
    this.options = { maxDepth: 5, verbose: false, ...options };
    this.state = this.tracker.createInitialState('', this.options.maxDepth);
    
    this.setupGates();
  }

  private setupGates(): void {
    this.gates = [
      {
        name: 'reference-validation',
        check: async () => this.runReferenceValidation()
      },
      {
        name: 'compilation',
        check: async () => this.runCompilationCheck()
      },
      {
        name: 'tests',
        check: async () => this.runTestExecution()
      }
    ];
  }

  private async runReferenceValidation(): Promise<GateResult> {
    try {
      execSync('python3 scripts/validate_refs.py', { stdio: 'pipe' });
      return { passed: true, message: 'All references valid' };
    } catch {
      return { 
        passed: false, 
        message: 'Reference validation failed',
        details: ['Run: python3 scripts/validate_refs.py for details']
      };
    }
  }

  private async runCompilationCheck(): Promise<GateResult> {
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
      return { passed: true, message: 'Code compiles successfully' };
    } catch {
      return { 
        passed: false, 
        message: 'Compilation failed',
        details: ['Run: npx tsc --noEmit --skipLibCheck for details']
      };
    }
  }

  private async runTestExecution(): Promise<GateResult> {
    if (this.options.skipTests) {
      return { passed: true, message: 'Tests skipped' };
    }

    try {
      const output = execSync('python3 -m pytest tests/ -v --tb=short 2>&1 || true', { 
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024 
      });
      
      const passed = output.includes('passed');
      const failed = output.includes('failed');
      
      return { 
        passed: !failed, 
        message: passed ? 'Tests passed' : 'Some tests failed',
        details: [output.slice(-500)]
      };
    } catch {
      return { passed: false, message: 'Test execution failed' };
    }
  }

  async runGate(gateName: string): Promise<GateResult> {
    const gate = this.gates.find(g => g.name === gateName);
    if (!gate) {
      return { passed: false, message: `Gate not found: ${gateName}` };
    }
    return gate.check();
  }

  async runAllGates(): Promise<Record<string, GateResult>> {
    const results: Record<string, GateResult> = {};
    
    for (const gate of this.gates) {
      results[gate.name] = await gate.check();
    }
    
    return results;
  }

  start(triggerFile: string): void {
    this.state = this.tracker.createInitialState(triggerFile, this.options.maxDepth);
    this.state.status = 'running';
    this.saveState();
    
    if (this.options.verbose) {
      console.log(`[Coordinator] Started cascade: ${this.state.cascade_id}`);
    }
  }

  async processTree(
    treeType: 'spec' | 'code' | 'test' | 'doc',
    onNode?: (node: TreeNode) => Promise<void>
  ): Promise<{ processed: number; failed: number }> {
    const nodes = this.tracker.getTree(treeType);
    let processed = 0;
    let failed = 0;

    for (const node of nodes) {
      try {
        if (onNode) {
          await onNode(node);
        }
        processed++;
        this.state.depth_by_tree[treeType]++;
      } catch {
        failed++;
      }
    }

    return { processed, failed };
  }

  async cascadeFrom(triggerId: string): Promise<CascadeResult> {
    const result: CascadeResult = {
      success: false,
      stepsCompleted: 0,
      gatesPassed: 0,
      gatesFailed: 0,
      errors: []
    };

    try {
      this.start(triggerId);
      
      const orderedNodes = this.tracker.getOrderedForCascade(triggerId);
      
      for (const node of orderedNodes) {
        if (this.state.depth >= this.state.max_depth) {
          result.errors.push('Max depth reached');
          break;
        }

        this.state.depth++;
        result.stepsCompleted++;

        if (this.options.verbose) {
          console.log(`[Coordinator] Processing: ${node.id} (depth ${node.layer})`);
        }

        const gateResults = await this.runAllGates();
        
        for (const [gate, res] of Object.entries(gateResults)) {
          if (res.passed) {
            result.gatesPassed++;
          } else {
            result.gatesFailed++;
            result.errors.push(`${gate}: ${res.message}`);
          }
        }
      }

      result.success = result.gatesFailed === 0;
      this.state.status = result.success ? 'completed' : 'failed';
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      this.state.status = 'failed';
    }

    this.saveState();
    return result;
  }

  canContinue(): boolean {
    return this.state.status === 'running' && 
           this.state.depth < this.state.max_depth;
  }

  pause(): void {
    this.state.status = 'paused';
    this.saveState();
  }

  resume(): void {
    this.state.status = 'running';
    this.saveState();
  }

  getState(): CascadeState {
    return { ...this.state };
  }

  saveState(): void {
    this.tracker.saveState(this.state);
  }

  loadState(): boolean {
    const state = this.tracker.loadState();
    if (state) {
      this.state = state;
      return true;
    }
    return false;
  }
}

export interface CascadeResult {
  success: boolean;
  stepsCompleted: number;
  gatesPassed: number;
  gatesFailed: number;
  errors: string[];
}
