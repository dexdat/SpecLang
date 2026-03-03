/**
 * SPECLANG-GENERATED: Autonomous testing CLI commands
 * Source: @speclang/autonomous-validation
 */
import { type AutonomousTestOptions, type AutonomousValidateOptions, type AutonomousReportOptions, type AutonomousVerifyOptions } from '../../../autonomous.spec.dir/src/index';
/**
 * Run autonomous tests
 */
export declare function autonomousTestCommand(action: string, options: AutonomousTestOptions): Promise<void>;
/**
 * Validate autonomous readiness
 */
export declare function autonomousValidateCommand(options: AutonomousValidateOptions): Promise<void>;
/**
 * Generate autonomous test report
 */
export declare function autonomousReportCommand(options: AutonomousReportOptions): Promise<void>;
/**
 * Run full autonomous verification
 */
export declare function autonomousVerifyCommand(options: AutonomousVerifyOptions): Promise<void>;
declare const _default: {
    test: typeof autonomousTestCommand;
    validate: typeof autonomousValidateCommand;
    report: typeof autonomousReportCommand;
    verify: typeof autonomousVerifyCommand;
};
export default _default;
export type { AutonomousTestOptions, AutonomousValidateOptions, AutonomousReportOptions, AutonomousVerifyOptions } from '../../../autonomous.spec.dir/src/index';
//# sourceMappingURL=autonomous.d.ts.map