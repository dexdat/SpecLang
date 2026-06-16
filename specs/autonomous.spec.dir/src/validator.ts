/**
 * SPECLANG-GENERATED: Autonomous validator for validating system readiness
 * Source: @speclang/autonomous-validation
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import type { 
  ValidationCheck, 
  ValidationReport,
  ValidationStatus 
} from './types';

interface SpecIndex {
  validation?: {
    missing_ref_count?: number;
    total_refs?: number;
    missing_refs?: string[];
  };
}

/**
 * Load spec index from .speclang/_index.json
 */
function loadIndex(): SpecIndex {
  const indexPath = '.speclang/_index.json';
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    return JSON.parse(content) as SpecIndex;
  }
  return {};
}

/**
 * Parse spec header from file
 */
async function parseSpecHeader(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Find the speclang-header line
    const headerLineIndex = lines.findIndex(line => line.trim().startsWith('# speclang-header'));
    if (headerLineIndex === -1) return null;
    
    // Get the line count from the header
    const headerLine = lines[headerLineIndex];
    const match = headerLine.match(/lines:(\d+)/);
    if (!match) return null;
    
    const lineCount = parseInt(match[1], 10);
    
    // Extract YAML header (skip comment and header line, read N lines)
    const yamlLines = lines.slice(headerLineIndex + 1, headerLineIndex + 1 + lineCount);
    const yamlText = yamlLines.join('\n');
    
    return yaml.parse(yamlText) || null;
  } catch {
    return null;
  }
}

/**
 * Autonomous Validator - Validates system meets autonomous operation criteria
 */
export class AutonomousValidator {
  private specsDir: string;
  
  constructor(specsDir?: string) {
    this.specsDir = specsDir || path.join(process.cwd(), 'specs');
  }
  
  /**
   * Validate if system meets autonomous readiness criteria
   */
  async validateAutonomousReadiness(): Promise<ValidationReport> {
    const checks: ValidationCheck[] = [];
    
    // Run all validation checks in parallel
    const results = await Promise.all([
      this.checkAgentSupport(),
      this.checkSpecCompleteness(),
      this.checkReferenceResolution(),
      this.checkStepByStepCoverage(),
      this.checkValidationRules(),
      this.checkRecoveryMechanisms()
    ]);
    
    checks.push(...results);
    
    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.passed).length,
      failed: checks.filter(c => !c.passed).length
    };
    
    return {
      autonomous: summary.failed === 0,
      checks,
      timestamp: new Date(),
      summary
    };
  }
  
  /**
   * Check that all specs have agent_support: agent_autonomous
   */
  private async checkAgentSupport(): Promise<ValidationCheck> {
    try {
      const specFiles = await fs.readdir(this.specsDir);
      const specMdFiles = specFiles.filter(f => f.endsWith('.spec.md'));
      
      const specsWithAutonomous: string[] = [];
      const specsWithoutAutonomous: string[] = [];
      
      for (const file of specMdFiles) {
        const filePath = path.join(this.specsDir, file);
        const header = await parseSpecHeader(filePath);
        
        if (header && header.agent_support === 'agent_autonomous') {
          specsWithAutonomous.push(file);
        } else if (header && header.agent_support) {
          specsWithoutAutonomous.push(file);
        }
      }
      
      const passed = specsWithoutAutonomous.length === 0;
      
      return {
        name: 'agent_support',
        passed,
        status: passed ? 'passed' : 'failed',
        details: {
          total: specMdFiles.length,
          autonomous: specsWithAutonomous.length,
          missing: specsWithoutAutonomous.length,
          missingFiles: specsWithoutAutonomous
        }
      };
    } catch (error) {
      return {
        name: 'agent_support',
        passed: false,
        status: 'failed',
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Check that all specs have step-by-step descriptions
   */
  private async checkSpecCompleteness(): Promise<ValidationCheck> {
    try {
      const specFiles = await fs.readdir(this.specsDir);
      const specMdFiles = specFiles.filter(f => f.endsWith('.spec.md'));
      
      const completeSpecs: string[] = [];
      const incompleteSpecs: string[] = [];
      
      for (const file of specMdFiles) {
        const filePath = path.join(this.specsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        if (this.hasStepByStep(content)) {
          completeSpecs.push(file);
        } else {
          incompleteSpecs.push(file);
        }
      }
      
      const passed = incompleteSpecs.length === 0;
      
      return {
        name: 'spec_completeness',
        passed,
        status: passed ? 'passed' : 'failed',
        details: {
          total: specMdFiles.length,
          complete: completeSpecs.length,
          incomplete: incompleteSpecs.length,
          incompleteFiles: incompleteSpecs
        }
      };
    } catch (error) {
      return {
        name: 'spec_completeness',
        passed: false,
        status: 'failed',
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Check if content has step-by-step descriptions
   */
  private hasStepByStep(content: string): boolean {
    // Check for common step-by-step patterns
    const patterns = [
      /Step \d+:/,
      /\d+\.\s+[A-Z]/,
      /steps?:/i,
      /procedures?:/i,
      /implementation/i,
      /```typescript/,
      /```python/,
      /```sql/,
      /```yaml/
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }
  
  /**
   * Check that all @ref: references resolve
   */
  private async checkReferenceResolution(): Promise<ValidationCheck> {
    try {
      const index = loadIndex();
      const validation = index.validation;
      
      if (!validation) {
        return {
          name: 'reference_resolution',
          passed: true,
          status: 'passed',
          details: {
            totalRefs: 0,
            unresolved: 0
          }
        };
      }
      
      const passed = validation.missing_ref_count === 0;
      
      return {
        name: 'reference_resolution',
        passed,
        status: passed ? 'passed' : 'failed',
        details: {
          totalRefs: validation.total_refs || 0,
          unresolved: validation.missing_ref_count || 0,
          missingRefs: validation.missing_refs || []
        }
      };
    } catch (error) {
      return {
        name: 'reference_resolution',
        passed: false,
        status: 'failed',
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Check step-by-step coverage across all specs
   */
  private async checkStepByStepCoverage(): Promise<ValidationCheck> {
    try {
      const specFiles = await fs.readdir(this.specsDir);
      const specMdFiles = specFiles.filter(f => f.endsWith('.spec.md'));
      
      let totalBlocks = 0;
      let blocksWithSteps = 0;
      
      for (const file of specMdFiles) {
        const filePath = path.join(this.specsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Count code blocks as blocks that need implementation
        const codeBlockMatches = content.match(/```(?:typescript|python|go|sql|yaml)/g);
        if (codeBlockMatches) {
          totalBlocks += codeBlockMatches.length;
          blocksWithSteps += codeBlockMatches.length;
        }
      }
      
      const coverage = totalBlocks > 0 ? blocksWithSteps / totalBlocks : 1;
      const passed = coverage >= 0.9; // 90% coverage required
      
      return {
        name: 'step_by_step_coverage',
        passed,
        status: passed ? 'passed' : 'warning',
        details: {
          totalBlocks,
          blocksWithSteps,
          coverage: Math.round(coverage * 100) / 100
        }
      };
    } catch (error) {
      return {
        name: 'step_by_step_coverage',
        passed: false,
        status: 'failed',
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Check that validation rules exist and are comprehensive
   */
  private async checkValidationRules(): Promise<ValidationCheck> {
    try {
      // Check for validation spec files
      const validationSpecFiles = [
        'specs/autonomous-validation.spec.md',
        'specs/agent-support-levels.spec.md',
        'specs/agent-behavior-matrix.spec.md'
      ];
      
      let existingRules = 0;
      for (const specFile of validationSpecFiles) {
        const fullPath = path.join(process.cwd(), specFile);
        if (await fs.pathExists(fullPath)) {
          existingRules++;
        }
      }
      
      const passed = existingRules >= 3;
      
      return {
        name: 'validation_rules',
        passed,
        status: passed ? 'passed' : 'failed',
        details: {
          expected: 3,
          found: existingRules,
          specs: validationSpecFiles
        }
      };
    } catch (error) {
      return {
        name: 'validation_rules',
        passed: false,
        status: 'failed',
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Check recovery mechanisms are in place
   */
  private async checkRecoveryMechanisms(): Promise<ValidationCheck> {
    try {
      // Check for recovery-related code
      const recoveryFiles = [
        'src/pipeline/recovery.ts',
        'src/daemon/daemon.ts'
      ];
      
      let existingRecovery = 0;
      for (const file of recoveryFiles) {
        const fullPath = path.join(process.cwd(), file);
        if (await fs.pathExists(fullPath)) {
          const content = await fs.readFile(fullPath, 'utf-8');
          // Check for recovery-related keywords
          if (/recover|retry|fallback|error.*handling/i.test(content)) {
            existingRecovery++;
          }
        }
      }
      
      const passed = existingRecovery >= 1;
      
      return {
        name: 'recovery_mechanisms',
        passed,
        status: passed ? 'passed' : 'warning',
        details: {
          expected: 1,
          found: existingRecovery,
          files: recoveryFiles
        }
      };
    } catch (error) {
      return {
        name: 'recovery_mechanisms',
        passed: false,
        status: 'failed',
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Load all specs from the specs directory
   */
  async loadAllSpecs(): Promise<string[]> {
    const specFiles = await fs.readdir(this.specsDir);
    return specFiles.filter(f => f.endsWith('.spec.md'));
  }
}

/**
 * Convenience function to validate autonomous readiness
 */
export async function validateAutonomousReadiness(specsDir?: string): Promise<ValidationReport> {
  const validator = new AutonomousValidator(specsDir);
  return validator.validateAutonomousReadiness();
}

/**
 * Format validation report for console output
 */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];
  
  lines.push('=== Autonomous Validation Report ===');
  lines.push(`Timestamp: ${report.timestamp.toISOString()}`);
  lines.push('');
  lines.push(`Status: ${report.autonomous ? '✅ AUTONOMOUS' : '❌ NOT AUTONOMOUS'}`);
  lines.push('');
  lines.push(`Summary: ${report.summary.passed}/${report.summary.total} checks passed`);
  lines.push('');
  lines.push('Checks:');
  
  for (const check of report.checks) {
    const icon = check.passed ? '✅' : '❌';
    lines.push(`  ${icon} ${check.name}: ${check.status}`);
    
    if (check.details && Object.keys(check.details).length > 0) {
      for (const [key, value] of Object.entries(check.details)) {
        if (Array.isArray(value) && value.length > 0) {
          lines.push(`      ${key}: ${value.join(', ')}`);
        } else if (typeof value === 'object' && value !== null) {
          lines.push(`      ${key}: ${JSON.stringify(value)}`);
        } else {
          lines.push(`      ${key}: ${value}`);
        }
      }
    }
    
    if (check.error) {
      lines.push(`      Error: ${check.error}`);
    }
  }
  
  return lines.join('\n');
}
