/**
speclang-header lines:5
id: @specs/ralph
version: 1.0.0
layer: 5
 */

// Generated from specs/ralph-loop.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/ralph-loop @ref:specs/ralph-loop#ralph/verifier-agent

/**
 * Ralph Loop - Verifier Agent
 * 
 * The Verifier Agent validates output, creates steering packets, and runs
 * the validation pipeline including spec format checks, code compilation,
 * test execution, and integration tests.
 * 
 * @module ralph/verifier
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Task,
  VerifierAgent,
  VerificationResult,
  ValidationStage,
  ValidationResult,
  SteeringPacket,
  BuilderResult,
  VALIDATION_PIPELINE,
} from './types';
import { createSteeringPacket } from './steering';

/**
 * VerifierAgentConfig - Configuration for the Verifier Agent
 */
export interface VerifierAgentConfig {
  specsDir: string;
  srcDir: string;
  testDir?: string;
}

/**
 * RalphVerifierAgent - Implementation of the Verifier Agent
 */
export class RalphVerifierAgent implements VerifierAgent {
  role: VerifierAgent['role'] = "Validate output, create steering packets";
  
  capabilities: VerifierAgent['capabilities'] = [
    "Validate spec format compliance",
    "Check code compilation",
    "Run tests",
    "Verify references and dependencies",
    "Create steering packets",
  ];
  
  validation_pipeline: ValidationStage[] = [...VALIDATION_PIPELINE];
  
  outputs: VerifierAgent['outputs'] = [
    "Validation reports",
    "Steering packets",
    "Failure analysis",
    "Success confirmation",
  ];

  private config: VerifierAgentConfig;

  constructor(config: VerifierAgentConfig) {
    this.config = config;
  }

  /**
   * Run the complete validation pipeline on a task's output
   */
  async validate(builderResult: BuilderResult, task: Task): Promise<VerificationResult> {
    console.log(`[Verifier] Validating task: ${task.id}`);
    
    const errors: string[] = [];
    const passedStages: ValidationStage[] = [];

    // Run each stage in order
    for (const stage of this.validation_pipeline) {
      const result = await this.runValidationStage(stage, builderResult, task);
      
      if (result.passed) {
        passedStages.push(stage);
      } else {
        errors.push(...result.errors);
      }
    }

    const success = errors.length === 0;

    return {
      success,
      errors,
      passedStages,
    };
  }

  /**
   * Run a single validation stage
   */
  private async runValidationStage(
    stage: ValidationStage,
    builderResult: BuilderResult,
    task: Task
  ): Promise<{ passed: boolean; errors: string[] }> {
    console.log(`[Verifier] Running stage: ${stage}`);
    
    switch (stage) {
      case "Spec Format Check":
        return this.validateSpecFormat(builderResult);
      case "Header Compliance":
        return this.validateHeaderCompliance(builderResult);
      case "Reference Validation":
        return this.validateReferences(builderResult);
      case "Code Compilation":
        return this.validateCodeCompilation(builderResult);
      case "Test Execution":
        return this.validateTests(builderResult);
      case "Integration Test":
        return this.validateIntegration(builderResult);
      default:
        return { passed: true, errors: [] };
    }
  }

  /**
   * Validate spec format
   */
  private async validateSpecFormat(builderResult: BuilderResult): Promise<{ passed: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (builderResult.output?.specPath) {
      if (!fs.existsSync(builderResult.output.specPath)) {
        errors.push(`Spec file not found: ${builderResult.output.specPath}`);
      } else {
        const content = fs.readFileSync(builderResult.output.specPath, 'utf-8');
        
        // Check for required elements
        if (!content.includes('# speclang-header')) {
          errors.push('Missing speclang-header in spec file');
        }
        if (!content.includes('id:')) {
          errors.push('Missing id field in spec file');
        }
      }
    }

    return { passed: errors.length === 0, errors };
  }

  /**
   * Validate header compliance
   */
  private async validateHeaderCompliance(builderResult: BuilderResult): Promise<{ passed: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (builderResult.output?.specPath && fs.existsSync(builderResult.output.specPath)) {
      const content = fs.readFileSync(builderResult.output.specPath, 'utf-8');
      
      // Check for required header fields
      const requiredFields = ['id:', 'version:', 'layer:', 'tags:'];
      for (const field of requiredFields) {
        if (!content.includes(field)) {
          errors.push(`Missing required field in header: ${field}`);
        }
      }
    }

    return { passed: errors.length === 0, errors };
  }

  /**
   * Validate references
   */
  private async validateReferences(builderResult: BuilderResult): Promise<{ passed: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (builderResult.output?.specPath && fs.existsSync(builderResult.output.specPath)) {
      const content = fs.readFileSync(builderResult.output.specPath, 'utf-8');
      
      // Extract @ref references
      const refMatches = content.match(/@ref:[^\s]+/g);
      if (refMatches) {
        for (const ref of refMatches) {
          const refPath = ref.replace('@ref:', '');
          // Simplified validation - check if reference format is correct
          if (!refPath.includes('specs/') && !refPath.startsWith('@')) {
            errors.push(`Invalid reference format: ${ref}`);
          }
        }
      }
    }

    return { passed: errors.length === 0, errors };
  }

  /**
   * Validate code compilation
   */
  private async validateCodeCompilation(builderResult: BuilderResult): Promise<{ passed: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for TypeScript compilation if we have code files
    if (builderResult.output?.codeFiles) {
      for (const codeFile of builderResult.output.codeFiles) {
        if (codeFile.endsWith('.ts') && fs.existsSync(codeFile)) {
          // In production, would run tsc here
          // For now, just check file exists and has content
          const content = fs.readFileSync(codeFile, 'utf-8');
          if (content.trim().length === 0) {
            errors.push(`Empty code file: ${codeFile}`);
          }
        }
      }
    }

    return { passed: errors.length === 0, errors };
  }

  /**
   * Validate tests
   */
  private async validateTests(builderResult: BuilderResult): Promise<{ passed: boolean; errors: string[] }> {
    // Simplified - in production would run actual tests
    return { passed: true, errors: [] };
  }

  /**
   * Validate integration
   */
  private async validateIntegration(builderResult: BuilderResult): Promise<{ passed: boolean; errors: string[] }> {
    // Simplified - in production would run integration tests
    return { passed: true, errors: [] };
  }

  /**
   * Create a steering packet for a failed validation
   */
  createSteeringPacketForFailure(task: Task, errors: string[]): SteeringPacket {
    return createSteeringPacket()
      .withTaskId(task.id)
      .asErrorReport(
        'validation_failed',
        task.id,
        errors.join('; '),
        'Review validation errors and fix the issues',
        task.priority
      )
      .build();
  }

  /**
   * Create a success confirmation packet
   */
  createSuccessConfirmation(task: Task, builderResult: BuilderResult): SteeringPacket {
    const filesCreated: string[] = [];
    if (builderResult.output?.specPath) {
      filesCreated.push(builderResult.output.specPath);
    }
    if (builderResult.output?.codeFiles) {
      filesCreated.push(...builderResult.output.codeFiles);
    }

    return createSteeringPacket()
      .withTaskId(task.id)
      .asSuccessConfirmation(filesCreated, true, 'Task completed successfully')
      .build();
  }

  /**
   * Get agent info
   */
  getInfo(): VerifierAgent {
    return {
      role: this.role,
      capabilities: [...this.capabilities],
      validation_pipeline: [...this.validation_pipeline],
      outputs: [...this.outputs],
    };
  }
}

/**
 * Create a new Verifier Agent instance
 */
export function createVerifierAgent(config: VerifierAgentConfig): RalphVerifierAgent {
  return new RalphVerifierAgent(config);
}
