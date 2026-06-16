/**
 * SPECLANG-GENERATED: Pre-defined test scenarios for autonomous testing
 * Source: @speclang/autonomous-validation
 */
import type { AutonomousTest } from './types.js';
/**
 * Pre-defined autonomous test scenarios
 */
export declare const AUTONOMOUS_SCENARIOS: AutonomousTest[];
/**
 * Get a test scenario by name
 */
export declare function getScenarioByName(name: string): AutonomousTest | undefined;
/**
 * Get all critical scenarios
 */
export declare function getCriticalScenarios(): AutonomousTest[];
/**
 * Get scenarios by type
 */
export declare function getScenariosByType(type: string): AutonomousTest[];
/**
 * Validate that a scenario configuration is valid
 */
export declare function validateScenarioConfig(test: AutonomousTest): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=scenarios.d.ts.map