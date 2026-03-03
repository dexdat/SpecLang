/**
 * SPECLANG-GENERATED: Autonomous test runner
 * Source: @speclang/autonomous-validation
 */
import type { AutonomousTest, TestResult, TestReport, TestRunnerConfig, TestRunnerState, ScenarioType } from './types.js';
/**
 * Autonomous Test Runner - Executes autonomous tests without human intervention
 */
export declare class AutonomousTestRunner {
    private config;
    private state;
    constructor(config?: Partial<TestRunnerConfig>);
    /**
     * Run all autonomous tests
     */
    runAll(): Promise<TestReport>;
    /**
     * Run a specific test by name
     */
    runByName(name: string): Promise<TestResult | null>;
    /**
     * Run tests by scenario type
     */
    runByType(type: ScenarioType): Promise<TestReport>;
    /**
     * Run a single test
     */
    runTest(test: AutonomousTest): Promise<TestResult>;
    /**
     * Execute a test scenario
     */
    private executeTest;
    /**
     * Execute spec generation scenario
     */
    private executeSpecGeneration;
    /**
     * Execute code generation scenario
     */
    private executeCodeGeneration;
    /**
     * Execute cascade scenario
     */
    private executeCascade;
    /**
     * Execute pipeline scenario
     */
    private executePipeline;
    /**
     * Execute self-specifying bootstrap scenario
     */
    private executeSelfSpecifying;
    /**
     * Simulate an async operation
     */
    private simulateOperation;
    /**
     * Execute a function with timeout
     */
    private executeWithTimeout;
    /**
     * Load all tests
     */
    loadTests(): AutonomousTest[];
    /**
     * Stop the test runner
     */
    stop(): void;
    /**
     * Get current state
     */
    getState(): TestRunnerState;
}
/**
 * Run all tests and return report
 */
export declare function runAutonomousTests(scenarioName?: string, config?: Partial<TestRunnerConfig>): Promise<TestReport>;
/**
 * Format test report for console output
 */
export declare function formatTestReport(report: TestReport): string;
//# sourceMappingURL=test-runner.d.ts.map