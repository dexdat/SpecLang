// SPECLANG-GENERATED
// CLI command for meta operations
// Source: @speclang/meta-cli

import { executeMetaCommand } from "../../../meta.spec.dir/src/index.js";

export interface MetaCLIOptions {
  dryRun?: boolean;
  verbose?: boolean;
  force?: boolean;
  output?: string;
  json?: boolean;
}

/**
 * Execute meta generate command
 */
export async function metaGenerateCommand(options: MetaCLIOptions): Promise<void> {
  const result = await executeMetaCommand("generate", options);
  
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Generated ${result.specsGenerated} specs`);
  }
}

/**
 * Execute meta validate command
 */
export async function metaValidateCommand(options: MetaCLIOptions): Promise<void> {
  const result = await executeMetaCommand("validate", options);
  
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Validation: ${result.passed ? "PASSED" : "FAILED"}`);
    console.log(`Total specs: ${result.totalSpecs}`);
    console.log(`Passed: ${result.passed}`);
    console.log(`Failed: ${result.failed}`);
    
    if (options.verbose && result.issues?.length > 0) {
      console.log("\nIssues:");
      for (const issue of result.issues) {
        console.log(`  - [${issue.severity}] ${issue.message}`);
      }
    }
  }
}

/**
 * Execute meta bootstrap command
 */
export async function metaBootstrapCommand(options: MetaCLIOptions): Promise<void> {
  const result = await executeMetaCommand("bootstrap", options);
  
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Bootstrap: ${result.success ? "SUCCESS" : "FAILED"}`);
    console.log(`Specs generated: ${result.specsGenerated}`);
    console.log(`Validation passed: ${result.validationPassed}`);
    console.log(`Code generated: ${result.codeGenerated}`);
    console.log(`Equivalence verified: ${result.equivalenceVerified}`);
    console.log(`Duration: ${result.duration}ms`);
    
    if (result.errors.length > 0) {
      console.log("\nErrors:");
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }
  }
}

/**
 * Execute meta check command
 */
export async function metaCheckCommand(options: MetaCLIOptions): Promise<void> {
  const result = await executeMetaCommand("check", options);
  
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Self-specifying: ${result.isSelfSpecifying ? "YES" : "NO"}`);
    console.log("\nDetails:");
    for (const detail of result.details) {
      console.log(`  ${detail}`);
    }
  }
}
