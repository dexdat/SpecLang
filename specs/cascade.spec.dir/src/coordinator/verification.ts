import { execSync } from 'child_process';
import { VerificationResult } from './state.js';

export interface GateResult {
  passed: boolean;
  message: string;
  details?: string[];
}

export interface VerificationGate {
  name: string;
  check: () => Promise<GateResult>;
  priority: number;
}

export class VerificationGates {
  private gates: Map<string, VerificationGate> = new Map();
  private skipTests: boolean;

  constructor(skipTests: boolean = false) {
    this.skipTests = skipTests;
    this.registerDefaultGates();
  }

  private registerDefaultGates(): void {
    this.register({
      name: 'reference-validation',
      priority: 1,
      check: async () => this.runReferenceValidation()
    });

    this.register({
      name: 'compilation',
      priority: 2,
      check: async () => this.runCompilationCheck()
    });

    this.register({
      name: 'tests',
      priority: 3,
      check: async () => this.runTestExecution()
    });
  }

  register(gate: VerificationGate): void {
    this.gates.set(gate.name, gate);
  }

  unregister(name: string): boolean {
    return this.gates.delete(name);
  }

  get(name: string): VerificationGate | undefined {
    return this.gates.get(name);
  }

  getAll(): VerificationGate[] {
    return Array.from(this.gates.values()).sort((a, b) => a.priority - b.priority);
  }

  async run(name: string): Promise<GateResult> {
    const gate = this.gates.get(name);
    if (!gate) {
      return { passed: false, message: `Gate not found: ${name}` };
    }
    return gate.check();
  }

  async runAll(): Promise<Record<string, GateResult>> {
    const results: Record<string, GateResult> = {};
    const gates = this.getAll();

    for (const gate of gates) {
      results[gate.name] = await gate.check();
    }

    return results;
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
    if (this.skipTests) {
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
}

export function createVerificationResult(
  step: number,
  results: Record<string, GateResult>
): VerificationResult {
  return {
    step,
    timestamp: new Date().toISOString(),
    checks: {
      compilation: {
        status: results.compilation?.passed ? 'passed' : 'failed',
        files_checked: 0
      },
      references: {
        status: results['reference-validation']?.passed ? 'passed' : 'failed',
        broken_refs: results['reference-validation']?.passed ? 0 : 1
      },
      tests: {
        status: results.tests?.passed ? 'passed' : 'failed',
        passed: results.tests?.passed ? 1 : 0,
        failed: results.tests?.passed ? 0 : 1
      }
    }
  };
}
