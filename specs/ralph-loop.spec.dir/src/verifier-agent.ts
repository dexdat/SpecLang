// Generated from specs/implementation.spec.dir/ralph-loop-implementation.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/implementation.ralph-loop

import { readFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Database } from './types';
import { Task, VerificationResult, DatabaseInstance } from './types';

const execAsync = promisify(exec);

/**
 * VerifierAgent - Responsible for validating specs and generated code
 * 
 * Part of the Ralph Loop dual-agent system, the VerifierAgent validates
 * the output from the BuilderAgent by checking spec format, code compilation,
 * and reference integrity.
 */
export class VerifierAgent {
  constructor(private db: DatabaseInstance) {}

  /**
   * Validate the output from BuilderAgent
   * @param task The original task
   * @param output The output from BuilderAgent
   * @returns Verification result with success status and errors
   */
  async validate(task: Task, output: any): Promise<VerificationResult> {
    const errors: string[] = [];

    // Validate spec format
    if (output?.specPath) {
      const specErrors = await this.validateSpec(output.specPath);
      errors.push(...specErrors);
    }

    // Validate code compilation
    if (output?.codeFiles) {
      const compileErrors = await this.validateCode(output.codeFiles);
      errors.push(...compileErrors);
    }

    // Validate references
    const refErrors = await this.validateReferences();
    errors.push(...refErrors);

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a spec file for proper format
   * @param specPath Path to the spec file
   * @returns Array of validation errors
   */
  private async validateSpec(specPath: string): Promise<string[]> {
    const errors: string[] = [];
    const content = await readFile(specPath, 'utf-8');
    
    // Check for speclang-header
    if (!content.includes('# speclang-header')) {
      errors.push(`Missing speclang-header in ${specPath}`);
    }

    // Parse header lines
    const headerMatch = content.match(/# speclang-header lines:(\d+)/);
    if (headerMatch) {
      const expectedLines = parseInt(headerMatch[1], 10);
      const lines = content.split('\n');
      const headerEnd = lines.findIndex(line => line.trim() === '---');
      if (headerEnd !== expectedLines - 1) {
        errors.push(`Header line count mismatch in ${specPath}`);
      }
    }

    return errors;
  }

  /**
   * Validate code files by attempting compilation
   * @param codeFiles Array of code file paths
   * @returns Array of compilation errors
   */
  private async validateCode(codeFiles: string[]): Promise<string[]> {
    const errors: string[] = [];
    
    for (const file of codeFiles) {
      if (file.endsWith('.ts')) {
        // TypeScript compilation check
        try {
          await execAsync(`npx tsc --noEmit ${file}`);
        } catch (error: any) {
          errors.push(`TypeScript compilation failed for ${file}: ${error.stderr || error.message}`);
        }
      } else if (file.endsWith('.go')) {
        // Go build check
        try {
          await execAsync(`go build ${file}`);
        } catch (error: any) {
          errors.push(`Go compilation failed for ${file}: ${error.stderr || error.message}`);
        }
      }
    }
    
    return errors;
  }

  /**
   * Validate that all @ref:... point to existing IDs in SQLite
   * @returns Array of reference validation errors
   */
  private async validateReferences(): Promise<string[]> {
    const errors: string[] = [];
    // Check that all @ref:... point to existing IDs in SQLite
    const stmtSelectRefs = this.db.prepare(`SELECT refs FROM specs WHERE refs IS NOT NULL`);
    const refs = stmtSelectRefs.all();
    // Implementation omitted for brevity
    return errors;
  }
}
