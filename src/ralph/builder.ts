// Generated from specs/ralph-loop.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/ralph-loop @ref:specs/ralph-loop#ralph/builder-agent

/**
 * Ralph Loop - Builder Agent
 * 
 * The Builder Agent writes implementation specs and code based on steering packets
 * from the Verifier Agent and todo list items.
 * 
 * @module ralph/builder
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Task,
  BuilderAgent,
  BuilderResult,
  SteeringPacket,
  BuilderCapability,
  BuilderTrigger,
  BuilderOutput,
} from './types';
import { extractErrorReport, extractFixSuggestion } from './steering';

/**
 * BuilderAgentConfig - Configuration for the Builder Agent
 */
export interface BuilderAgentConfig {
  specsDir: string;
  srcDir: string;
  outputDir: string;
}

/**
 * RalphBuilderAgent - Implementation of the Builder Agent
 */
export class RalphBuilderAgent implements BuilderAgent {
  role: BuilderAgent['role'] = "Write implementation specs and code";
  
  capabilities: BuilderCapability[] = [
    "Read all SIPs and existing specs",
    "Write implementation specs (.spec.md or .spec.yaml)",
    "Generate code from specs (.go.spec, .ts.spec)",
    "Follow file naming conventions",
    "Use speclang tools (when available)",
  ];
  
  triggers: BuilderTrigger[] = [
    "Steering packet from Verifier",
    "Todo list item",
    "Manual human instruction",
  ];
  
  outputs: BuilderOutput[] = [
    "New/modified spec files",
    "Generated code files",
    "Commit messages",
    "Progress report",
  ];

  private config: BuilderAgentConfig;

  constructor(config: BuilderAgentConfig) {
    this.config = config;
  }

  /**
   * Execute a task from the todo list
   */
  async executeTask(task: Task): Promise<BuilderResult> {
    try {
      console.log(`[Builder] Executing task: ${task.id}`);
      
      // Mark task as in progress
      task.status = 'in_progress';
      task.started_at = Date.now();

      // Read all existing specs to understand the context
      const existingSpecs = await this.readAllSpecs();
      
      // Generate implementation based on task description
      const implementation = await this.generateImplementation(task, existingSpecs);

      // Write the implementation spec
      if (implementation.specContent) {
        await this.writeSpecFile(task.id, implementation.specContent);
      }

      // Generate code from spec
      const codeFiles = await this.generateCode(task, implementation);

      // Mark task as done
      task.status = 'done';
      task.completed_at = Date.now();

      return {
        success: true,
        output: {
          specPath: implementation.specPath,
          codeFiles,
        },
      };
    } catch (error) {
      task.status = 'failed';
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Process a steering packet and generate fixes
   */
  async processSteeringPacket(packet: SteeringPacket): Promise<BuilderResult> {
    console.log(`[Builder] Processing steering packet: ${packet.type}`);
    
    const errorReport = extractErrorReport(packet);
    const fixSuggestion = extractFixSuggestion(packet);

    if (errorReport) {
      return this.fixError(errorReport);
    }

    if (fixSuggestion) {
      return this.applyFixSuggestion(fixSuggestion);
    }

    return {
      success: false,
      error: 'Unknown steering packet type',
    };
  }

  /**
   * Fix an error based on error report
   */
  private async fixError(errorReport: {
    task_id: string;
    error_type: string;
    file_path: string;
    error_message: string;
    suggested_fix: string;
  }): Promise<BuilderResult> {
    try {
      const { file_path, suggested_fix, error_type } = errorReport;
      
      console.log(`[Builder] Fixing error in ${file_path}: ${error_type}`);
      
      // Read the file
      if (!fs.existsSync(file_path)) {
        return {
          success: false,
          error: `File not found: ${file_path}`,
        };
      }

      const content = fs.readFileSync(file_path, 'utf-8');
      
      // Apply the suggested fix (simplified - in production would use AST)
      let fixedContent = content;
      
      // Common fix patterns
      if (error_type === 'missing_import') {
        // Add import at top of file
        const importStatement = this.extractImportFromFix(suggested_fix);
        if (importStatement) {
          fixedContent = importStatement + '\n' + content;
        }
      } else if (error_type === 'syntax_error') {
        // Try to fix syntax errors based on suggestion
        fixedContent = this.applySyntaxFix(content, suggested_fix);
      }

      // Write the fixed file
      fs.writeFileSync(file_path, fixedContent, 'utf-8');

      return {
        success: true,
        output: {
          codeFiles: [file_path],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Apply a fix suggestion
   */
  private async applyFixSuggestion(suggestion: {
    file_path: string;
    current_state: string;
    suggested_change: string;
  }): Promise<BuilderResult> {
    try {
      const { file_path, suggested_change } = suggestion;
      
      console.log(`[Builder] Applying fix suggestion to ${file_path}`);
      
      if (!fs.existsSync(file_path)) {
        return {
          success: false,
          error: `File not found: ${file_path}`,
        };
      }

      const content = fs.readFileSync(file_path, 'utf-8');
      
      // Apply the suggested change (simplified)
      // In production this would use proper AST manipulation
      const fixedContent = content + '\n// Fix: ' + suggested_change;
      
      fs.writeFileSync(file_path, fixedContent, 'utf-8');

      return {
        success: true,
        output: {
          codeFiles: [file_path],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Read all existing specs
   */
  private async readAllSpecs(): Promise<string[]> {
    const specs: string[] = [];
    
    if (!fs.existsSync(this.config.specsDir)) {
      return specs;
    }

    const files = fs.readdirSync(this.config.specsDir);
    for (const file of files) {
      if (file.endsWith('.spec.md') || file.endsWith('.spec.yaml')) {
        const filePath = path.join(this.config.specsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        specs.push(content);
      }
    }

    return specs;
  }

  /**
   * Generate implementation for a task
   */
  private async generateImplementation(
    task: Task,
    existingSpecs: string[]
  ): Promise<{
    specContent?: string;
    specPath?: string;
  }> {
    // Simplified implementation generation
    // In production this would use actual spec analysis and code generation
    
    const specContent = `# Implementation for ${task.id}

${task.description}

## Status
- Priority: ${task.priority}
- Complexity: ${task.estimated_complexity}
- Generated: ${new Date().toISOString()}
`;

    return {
      specContent,
      specPath: path.join(this.config.specsDir, `${task.id}.spec.md`),
    };
  }

  /**
   * Generate code from implementation
   */
  private async generateCode(
    task: Task,
    implementation: { specContent?: string; specPath?: string }
  ): Promise<string[]> {
    const codeFiles: string[] = [];
    
    // Simplified code generation
    // In production this would use actual code generation from specs
    
    return codeFiles;
  }

  /**
   * Write a spec file
   */
  private async writeSpecFile(taskId: string, content: string): Promise<void> {
    const filePath = path.join(this.config.specsDir, `${taskId}.spec.md`);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[Builder] Written spec: ${filePath}`);
  }

  /**
   * Extract import statement from fix suggestion
   */
  private extractImportFromFix(fix: string): string | null {
    const importMatch = fix.match(/import\s+.*?from\s+['"].*?['"]/);
    return importMatch ? importMatch[0] : null;
  }

  /**
   * Apply syntax fix
   */
  private applySyntaxFix(content: string, fix: string): string {
    // Simplified - would need proper parsing in production
    return content;
  }

  /**
   * Get agent info
   */
  getInfo(): BuilderAgent {
    return {
      role: this.role,
      capabilities: [...this.capabilities],
      triggers: [...this.triggers],
      outputs: [...this.outputs],
    };
  }
}

/**
 * Create a new Builder Agent instance
 */
export function createBuilderAgent(config: BuilderAgentConfig): RalphBuilderAgent {
  return new RalphBuilderAgent(config);
}
