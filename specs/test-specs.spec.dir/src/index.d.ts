/**
 * Test Specs Module
 *
 * Tests written as natural language specifications. First-class citizens.
 * TestWriter agent converts to executable tests.
 */
export type { TestSpec, TestScenario, ExampleTable, TestResult, TestReport, SupportedLanguage, TestSpecHeader } from './types';
export { TestSpecParser, parseTestSpecFile } from './parser';
export { TestGenerator, generateTestCode } from './generator';
export { TestRunner, runTestSpec, runAllTestSpecs } from './runner';
export { TestSpecReporter, defaultReporter, formatReport, formatSummary } from './reporter';
export { TestResultSync, testResultSync, syncResultsToSpec, updateAllSpecs } from './sync';
//# sourceMappingURL=index.d.ts.map