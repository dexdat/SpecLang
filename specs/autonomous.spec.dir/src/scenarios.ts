/**
speclang-header lines:5
id: @specs/autonomous
version: 1.0.0
layer: 5
 */

/**
 * SPECLANG-GENERATED: Pre-defined test scenarios for autonomous testing
 * Source: @speclang/autonomous-validation
 */

import type { AutonomousTest } from './types.js';

/**
 * Pre-defined autonomous test scenarios
 */
export const AUTONOMOUS_SCENARIOS: AutonomousTest[] = [
  {
    name: 'spec_generation_basic',
    description: 'Generate a simple spec from natural language',
    scenario: {
      type: 'spec_generation',
      config: {
        input: 'Create a user authentication system with login and logout',
        target: 'specs/auth.spec.md',
        agent: 'spec-writer'
      }
    },
    expected: {
      success: true,
      metrics: {
        time: 5000,  // 5 seconds max
        memory: 100 * 1024 * 1024,  // 100MB
        accuracy: 0.9  // 90% match to expected
      },
      artifacts: ['specs/auth.spec.md']
    },
    timeout: 30000,  // 30 seconds
    critical: false
  },
  {
    name: 'code_generation_typescript',
    description: 'Generate TypeScript code from spec',
    scenario: {
      type: 'code_generation',
      config: {
        spec: 'specs/auth.spec.md',
        target: 'src/auth/index.ts',
        language: 'typescript'
      }
    },
    expected: {
      success: true,
      metrics: {
        time: 10000,
        memory: 200 * 1024 * 1024,
        accuracy: 1.0  // Must compile
      },
      artifacts: ['src/auth/index.ts']
    },
    timeout: 60000,
    critical: true
  },
  {
    name: 'cascade_trigger',
    description: 'Trigger cascade from spec change',
    scenario: {
      type: 'cascade',
      config: {
        trigger: 'specs/auth.spec.md',
        change: 'add_password_validation',
        expected_depth: 3
      }
    },
    expected: {
      success: true,
      metrics: {
        time: 30000,
        memory: 500 * 1024 * 1024,
        accuracy: 1.0
      },
      artifacts: [
        'specs/auth.spec.md',
        'src/auth/index.ts',
        'tests/auth.test.ts'
      ]
    },
    timeout: 120000,
    critical: true
  },
  {
    name: 'pipeline_execution',
    description: 'Run pipeline after convergence',
    scenario: {
      type: 'pipeline',
      config: {
        stages: ['typecheck', 'test', 'lint'],
        convergence_time: 30  // seconds
      }
    },
    expected: {
      success: true,
      metrics: {
        time: 60000,
        memory: 1000 * 1024 * 1024,
        accuracy: 1.0
      },
      artifacts: [
        '.speclang/pipeline.log',
        'build.yaml'
      ]
    },
    timeout: 180000,
    critical: false
  },
  {
    name: 'self_specifying_bootstrap',
    description: 'Complete self-specifying bootstrap',
    scenario: {
      type: 'self_specifying',
      config: {
        phases: ['generate', 'validate', 'bootstrap'],
        expected_specs: 200
      }
    },
    expected: {
      success: true,
      metrics: {
        time: 300000,  // 5 minutes
        memory: 2000 * 1024 * 1024,
        accuracy: 0.95
      },
      artifacts: [
        'specs/generated/',
        '.speclang/bootstrap.log'
      ]
    },
    timeout: 600000,  // 10 minutes
    critical: true
  }
];

/**
 * Get a test scenario by name
 */
export function getScenarioByName(name: string): AutonomousTest | undefined {
  return AUTONOMOUS_SCENARIOS.find(s => s.name === name);
}

/**
 * Get all critical scenarios
 */
export function getCriticalScenarios(): AutonomousTest[] {
  return AUTONOMOUS_SCENARIOS.filter(s => s.critical);
}

/**
 * Get scenarios by type
 */
export function getScenariosByType(type: string): AutonomousTest[] {
  return AUTONOMOUS_SCENARIOS.filter(s => s.scenario.type === type);
}

/**
 * Validate that a scenario configuration is valid
 */
export function validateScenarioConfig(test: AutonomousTest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!test.name) {
    errors.push('Test name is required');
  }
  
  if (!test.description) {
    errors.push('Test description is required');
  }
  
  if (!test.scenario) {
    errors.push('Test scenario is required');
  }
  
  if (!test.expected) {
    errors.push('Expected outcome is required');
  }
  
  if (!test.timeout || test.timeout <= 0) {
    errors.push('Test timeout must be positive');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
