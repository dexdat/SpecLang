"use strict";
/**
 * SPECLANG-GENERATED: Autonomous testing CLI commands
 * Source: @speclang/autonomous-validation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.autonomousTestCommand = autonomousTestCommand;
exports.autonomousValidateCommand = autonomousValidateCommand;
exports.autonomousReportCommand = autonomousReportCommand;
exports.autonomousVerifyCommand = autonomousVerifyCommand;
const index_1 = require("../../../autonomous.spec.dir/src/index");
/**
 * Run autonomous tests
 */
async function autonomousTestCommand(action, options) {
    if (action === 'test') {
        const scenarioName = options.scenario;
        if (!options.json) {
            console.log('Running autonomous tests...\n');
        }
        try {
            const report = await (0, index_1.runAutonomousTests)(scenarioName);
            if (options.json) {
                console.log(JSON.stringify(report, null, 2));
            }
            else {
                console.log((0, index_1.formatTestReport)(report));
            }
            // Exit with error code if tests failed
            if (report.failed > 0) {
                process.exit(1);
            }
        }
        catch (error) {
            if (options.json) {
                console.log(JSON.stringify({
                    error: true,
                    message: error instanceof Error ? error.message : 'Unknown error'
                }));
            }
            else {
                console.error('❌ Test execution failed:', error);
            }
            process.exit(1);
        }
    }
    else {
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
}
/**
 * Validate autonomous readiness
 */
async function autonomousValidateCommand(options) {
    if (!options.json) {
        console.log('Validating autonomous readiness...\n');
    }
    try {
        const report = await (0, index_1.validateAutonomousReadiness)();
        if (options.json) {
            console.log(JSON.stringify(report, null, 2));
        }
        else {
            console.log((0, index_1.formatValidationReport)(report));
        }
        // Exit with error code if validation failed
        if (!report.autonomous) {
            console.log('\n❌ System is NOT ready for autonomous operation');
            process.exit(1);
        }
        else {
            console.log('\n✅ System is ready for autonomous operation');
        }
    }
    catch (error) {
        if (options.json) {
            console.log(JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
        else {
            console.error('❌ Validation failed:', error);
        }
        process.exit(1);
    }
}
/**
 * Generate autonomous test report
 */
async function autonomousReportCommand(options) {
    const format = options.format || 'text';
    try {
        const [testReport, validationReport] = await Promise.all([
            (0, index_1.runAutonomousTests)(),
            (0, index_1.validateAutonomousReadiness)()
        ]);
        const report = {
            test: testReport,
            validation: validationReport,
            timestamp: new Date().toISOString(),
            bootstrap_complete: testReport.failed === 0 && validationReport.autonomous
        };
        if (format === 'json' || options.output?.endsWith('.json')) {
            console.log(JSON.stringify(report, null, 2));
        }
        else {
            console.log('=== Autonomous Test Report ===\n');
            console.log((0, index_1.formatTestReport)(testReport));
            console.log('\n');
            console.log((0, index_1.formatValidationReport)(validationReport));
            console.log('\n=== Bootstrap Status ===');
            console.log(report.bootstrap_complete ? '✅ COMPLETE' : '❌ INCOMPLETE');
        }
        // Write to file if output specified
        if (options.output) {
            const { writeFile } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await writeFile(options.output, JSON.stringify(report, null, 2));
            console.log(`\nReport written to: ${options.output}`);
        }
    }
    catch (error) {
        console.error('❌ Report generation failed:', error);
        process.exit(1);
    }
}
/**
 * Run full autonomous verification
 */
async function autonomousVerifyCommand(options) {
    if (!options.json) {
        console.log('=== Full Autonomous Verification ===\n');
        console.log('This will run all tests and validate autonomous readiness.\n');
    }
    try {
        // Run tests
        if (!options.json) {
            console.log('Step 1: Running autonomous tests...\n');
        }
        const testReport = await (0, index_1.runAutonomousTests)();
        if (!options.json) {
            console.log((0, index_1.formatTestReport)(testReport));
        }
        // Validate
        if (!options.json) {
            console.log('\nStep 2: Validating autonomous readiness...\n');
        }
        const validationReport = await (0, index_1.validateAutonomousReadiness)();
        if (!options.json) {
            console.log((0, index_1.formatValidationReport)(validationReport));
        }
        // Determine overall status
        const testsPassed = testReport.failed === 0;
        const validationPassed = validationReport.autonomous;
        const bootstrapComplete = testsPassed && validationPassed;
        if (options.json) {
            console.log(JSON.stringify({
                verification: {
                    tests: testReport,
                    validation: validationReport,
                    bootstrap_complete: bootstrapComplete
                }
            }, null, 2));
        }
        else {
            console.log('\n=== Verification Result ===');
            console.log(`Tests: ${testsPassed ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`Validation: ${validationPassed ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`\nBootstrap: ${bootstrapComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
            if (bootstrapComplete) {
                console.log('\n🎉 SpecLang bootstrap is complete! The system can operate autonomously.');
            }
            else {
                console.log('\n⚠️  Bootstrap incomplete. Review failures above.');
            }
        }
        process.exit(bootstrapComplete ? 0 : 1);
    }
    catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}
exports.default = {
    test: autonomousTestCommand,
    validate: autonomousValidateCommand,
    report: autonomousReportCommand,
    verify: autonomousVerifyCommand
};
//# sourceMappingURL=autonomous.js.map