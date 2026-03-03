/**
 * SPECLANG-GENERATED: Autonomous testing CLI commands
 * Source: @speclang/autonomous-validation
 */

import { 
  runAutonomousTests, 
  formatTestReport,
  validateAutonomousReadiness,
  formatValidationReport,
  type AutonomousTestOptions,
  type AutonomousValidateOptions,
  type AutonomousReportOptions,
  type AutonomousVerifyOptions
} from '../../../autonomous.spec.dir/src/index';

/**
 * Run autonomous tests
 */
export async function autonomousTestCommand(
  action: string,
  options: AutonomousTestOptions
): Promise<void> {
  if (action === 'test') {
    const scenarioName = options.scenario;
    
    if (!options.json) {
      console.log('Running autonomous tests...\n');
    }
    
    try {
      const report = await runAutonomousTests(scenarioName);
      
      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatTestReport(report));
      }
      
      // Exit with error code if tests failed
      if (report.failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({
          error: true,
          message: error instanceof Error ? error.message : 'Unknown error'
        }));
      } else {
        console.error('❌ Test execution failed:', error);
      }
      process.exit(1);
    }
  } else {
    console.error(`Unknown action: ${action}`);
    process.exit(1);
  }
}

/**
 * Validate autonomous readiness
 */
export async function autonomousValidateCommand(
  options: AutonomousValidateOptions
): Promise<void> {
  if (!options.json) {
    console.log('Validating autonomous readiness...\n');
  }
  
  try {
    const report = await validateAutonomousReadiness();
    
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatValidationReport(report));
    }
    
    // Exit with error code if validation failed
    if (!report.autonomous) {
      console.log('\n❌ System is NOT ready for autonomous operation');
      process.exit(1);
    } else {
      console.log('\n✅ System is ready for autonomous operation');
    }
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    } else {
      console.error('❌ Validation failed:', error);
    }
    process.exit(1);
  }
}

/**
 * Generate autonomous test report
 */
export async function autonomousReportCommand(
  options: AutonomousReportOptions
): Promise<void> {
  const format = options.format || 'text';
  
  try {
    const [testReport, validationReport] = await Promise.all([
      runAutonomousTests(),
      validateAutonomousReadiness()
    ]);
    
    const report = {
      test: testReport,
      validation: validationReport,
      timestamp: new Date().toISOString(),
      bootstrap_complete: testReport.failed === 0 && validationReport.autonomous
    };
    
    if (format === 'json' || options.output?.endsWith('.json')) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log('=== Autonomous Test Report ===\n');
      console.log(formatTestReport(testReport));
      console.log('\n');
      console.log(formatValidationReport(validationReport));
      console.log('\n=== Bootstrap Status ===');
      console.log(report.bootstrap_complete ? '✅ COMPLETE' : '❌ INCOMPLETE');
    }
    
    // Write to file if output specified
    if (options.output) {
      const { writeFile } = await import('fs/promises');
      await writeFile(options.output, JSON.stringify(report, null, 2));
      console.log(`\nReport written to: ${options.output}`);
    }
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    process.exit(1);
  }
}

/**
 * Run full autonomous verification
 */
export async function autonomousVerifyCommand(
  options: AutonomousVerifyOptions
): Promise<void> {
  if (!options.json) {
    console.log('=== Full Autonomous Verification ===\n');
    console.log('This will run all tests and validate autonomous readiness.\n');
  }
  
  try {
    // Run tests
    if (!options.json) {
      console.log('Step 1: Running autonomous tests...\n');
    }
    
    const testReport = await runAutonomousTests();
    
    if (!options.json) {
      console.log(formatTestReport(testReport));
    }
    
    // Validate
    if (!options.json) {
      console.log('\nStep 2: Validating autonomous readiness...\n');
    }
    
    const validationReport = await validateAutonomousReadiness();
    
    if (!options.json) {
      console.log(formatValidationReport(validationReport));
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
    } else {
      console.log('\n=== Verification Result ===');
      console.log(`Tests: ${testsPassed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Validation: ${validationPassed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`\nBootstrap: ${bootstrapComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
      
      if (bootstrapComplete) {
        console.log('\n🎉 SpecLang bootstrap is complete! The system can operate autonomously.');
      } else {
        console.log('\n⚠️  Bootstrap incomplete. Review failures above.');
      }
    }
    
    process.exit(bootstrapComplete ? 0 : 1);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

export default {
  test: autonomousTestCommand,
  validate: autonomousValidateCommand,
  report: autonomousReportCommand,
  verify: autonomousVerifyCommand
};

// Re-export types for CLI
export type {
  AutonomousTestOptions,
  AutonomousValidateOptions,
  AutonomousReportOptions,
  AutonomousVerifyOptions
} from '../../../autonomous.spec.dir/src/index';
