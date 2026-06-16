/**
 * SPECLANG-GENERATED: Main exports for autonomous testing system
 * Source: @speclang/autonomous-validation
 */

// Types - re-export from types.ts
export type {
  ScenarioType,
  ScenarioConfig,
  TestScenario,
  OutcomeMetrics,
  ExpectedOutcome,
  AutonomousTest,
  TestPriority,
  ResultMetrics,
  TestResult,
  TestReport,
  ValidationStatus,
  ValidationCheck,
  ValidationReport,
  AutonomousTestOptions,
  AutonomousValidateOptions,
  AutonomousReportOptions,
  AutonomousVerifyOptions,
  TestRunnerState,
  TestRunnerConfig
} from './types.js';

// Core components
export { AutonomousTestRunner, runAutonomousTests, formatTestReport } from './test-runner.js';
export { AUTONOMOUS_SCENARIOS, getScenarioByName, getCriticalScenarios, getScenariosByType, validateScenarioConfig } from './scenarios.js';
export { AutonomousValidator, validateAutonomousReadiness, formatValidationReport } from './validator.js';
