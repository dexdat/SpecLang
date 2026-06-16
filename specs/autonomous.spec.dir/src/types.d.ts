/**
 * SPECLANG-GENERATED: TypeScript types for autonomous testing
 * Source: @speclang/autonomous-validation
 */
/** Type of test scenario */
export type ScenarioType = 'spec_generation' | 'code_generation' | 'cascade' | 'pipeline' | 'self_specifying';
/** Configuration for a test scenario */
export interface ScenarioConfig {
    input?: string;
    target?: string;
    agent?: string;
    spec?: string;
    language?: string;
    trigger?: string;
    change?: string;
    expected_depth?: number;
    stages?: string[];
    convergence_time?: number;
    phases?: string[];
    expected_specs?: number;
}
/** Test scenario definition */
export interface TestScenario {
    type: ScenarioType;
    config: ScenarioConfig;
}
/** Metrics for expected outcomes */
export interface OutcomeMetrics {
    time: number;
    memory: number;
    accuracy: number;
}
/** Expected outcome of a test */
export interface ExpectedOutcome {
    success: boolean;
    metrics: OutcomeMetrics;
    artifacts: string[];
}
/** A single autonomous test */
export interface AutonomousTest {
    name: string;
    description: string;
    scenario: TestScenario;
    expected: ExpectedOutcome;
    timeout: number;
    critical?: boolean;
}
/** Priority level for tests */
export type TestPriority = 'critical' | 'high' | 'medium' | 'low';
/** Result metrics from test execution */
export interface ResultMetrics {
    time: number;
    memory: number;
    accuracy: number;
}
/** Outcome of a single test execution */
export interface TestResult {
    test: string;
    success: boolean;
    duration: number;
    metrics: ResultMetrics;
    artifacts: string[];
    error?: string;
    timestamp: Date;
}
/** Complete test report */
export interface TestReport {
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
    timestamp: Date;
    duration: number;
}
/** Status of a validation check */
export type ValidationStatus = 'passed' | 'failed' | 'warning' | 'skipped';
/** A single validation check */
export interface ValidationCheck {
    name: string;
    passed: boolean;
    status: ValidationStatus;
    details: Record<string, unknown>;
    error?: string;
}
/** Result of autonomous readiness validation */
export interface ValidationReport {
    autonomous: boolean;
    checks: ValidationCheck[];
    timestamp: Date;
    summary: {
        total: number;
        passed: number;
        failed: number;
    };
}
/** Options for autonomous test CLI commands */
export interface AutonomousTestOptions {
    scenario?: string;
    verbose?: boolean;
    json?: boolean;
}
export interface AutonomousValidateOptions {
    fix?: boolean;
    verbose?: boolean;
    json?: boolean;
}
export interface AutonomousReportOptions {
    format?: 'text' | 'json' | 'html';
    output?: string;
}
export interface AutonomousVerifyOptions {
    verbose?: boolean;
    json?: boolean;
    timeout?: number;
}
/** State of the test runner */
export interface TestRunnerState {
    running: boolean;
    currentTest?: string;
    startTime?: Date;
    results: TestResult[];
}
/** Configuration for the test runner */
export interface TestRunnerConfig {
    parallel?: boolean;
    maxConcurrency?: number;
    stopOnCriticalFailure?: boolean;
    captureMetrics?: boolean;
    setupFn?: () => Promise<void>;
    teardownFn?: () => Promise<void>;
}
//# sourceMappingURL=types.d.ts.map