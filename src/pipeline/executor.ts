/**
 * Pipeline Executor
 * 
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/build
 */

import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { PipelineConfig, PipelineResult, Stage, StageResult, ExecutorOptions, PipelineEvent, ConditionContext, RecoveryAction, RecoveryContext } from './types';
import { PipelineConfigManager } from './config';
import { StageExecutor, orderStages, areDependenciesMet } from './stages';
import { RecoveryExecutor } from './recovery';
import { ConvergenceResult } from '../daemon/types';

export class PipelineExecutor extends EventEmitter {
  private configManager: PipelineConfigManager;
  private stageExecutor: StageExecutor;
  private recoveryExecutor: RecoveryExecutor;
  private options: ExecutorOptions;
  private stageStates: Map<string, 'pending' | 'running' | 'completed' | 'failed' | 'skipped'>;

  constructor(options: ExecutorOptions = {}) {
    super();
    this.options = options;
    this.configManager = new PipelineConfigManager(options.configPath);
    this.stageExecutor = new StageExecutor(options.verbose);
    this.recoveryExecutor = new RecoveryExecutor('.speclang/errors', options.verbose);
    this.stageStates = new Map();
  }

  /**
   * Execute the full pipeline
   */
  async execute(convergence?: ConvergenceResult): Promise<PipelineResult> {
    const startTime = Date.now();
    const config = await this.configManager.load();

    // Validate config
    const validation = this.configManager.validate();
    if (!validation.valid) {
      return {
        success: false,
        stages: [],
        duration: Date.now() - startTime,
        startTime,
        endTime: Date.now(),
        error: `Configuration validation failed: ${validation.errors.join(', ')}`,
        recoveryAttempts: 0,
      };
    }

    const stages = config.pipeline.on_converge;
    const orderedStages = orderStages(stages);
    const stageResults: StageResult[] = [];
    const completedStages = new Set<string>();
    let recoveryAttempts = 0;
    let currentAttempt = 1;
    const maxAttempts = config.recovery.max_attempts;

    if (this.options.verbose) {
      console.log(`[PipelineExecutor] Starting pipeline with ${orderedStages.length} stages`);
      console.log(`[PipelineExecutor] Max recovery attempts: ${maxAttempts}`);
    }

    // Main execution loop with recovery
    while (currentAttempt <= maxAttempts) {
      if (this.options.verbose) {
        console.log(`[PipelineExecutor] Attempt ${currentAttempt}/${maxAttempts}`);
      }

      // Reset stage states for retry
      this.stageStates.clear();
      
      // Execute stages in order
      for (const stage of orderedStages) {
        // Check if dependencies are met
        if (!areDependenciesMet(stage, completedStages)) {
          const failedDeps = stage.depends_on?.filter(d => !completedStages.has(d)) || [];
          if (this.options.verbose) {
            console.log(`[PipelineExecutor] Skipping stage ${stage.name} - dependencies not met: ${failedDeps.join(', ')}`);
          }
          this.stageStates.set(stage.name, 'skipped');
          continue;
        }

        // Evaluate condition if present
        if (stage.condition) {
          const conditionMet = await this.evaluateCondition(stage.condition, {
            changed_files: [],
            previous_convergence: convergence,
            stage_results: stageResults,
          });

          if (!conditionMet) {
            if (this.options.verbose) {
              console.log(`[PipelineExecutor] Skipping stage ${stage.name} - condition not met`);
            }
            this.stageStates.set(stage.name, 'skipped');
            const skippedResult: StageResult = {
              name: stage.name,
              success: true,
              output: 'Skipped due to condition',
              duration: 0,
            };
            stageResults.push(skippedResult);
            completedStages.add(stage.name);
            continue;
          }
        }

        // Execute the stage
        this.stageStates.set(stage.name, 'running');
        this.emitEvent('stage_start', { stage: stage.name, attempt: currentAttempt });

        const context = {
          timestamp: Date.now(),
          stage_name: stage.name,
          stage_success: undefined,
          stage_output: undefined,
          pipeline_result: undefined,
        };

        const result = await this.stageExecutor.execute(stage, context, this.options.dryRun);
        stageResults.push(result);

        if (result.success) {
          this.stageStates.set(stage.name, 'completed');
          completedStages.add(stage.name);
          this.emitEvent('stage_complete', { stage: result });
        } else {
          this.stageStates.set(stage.name, 'failed');
          this.emitEvent('stage_fail', { stage: result, attempt: currentAttempt });

          // Execute recovery
          const recoveryContext: RecoveryContext = {
            error: new Error(result.error || 'Stage failed'),
            stage: stage.name,
            attempt: currentAttempt,
          };

          const recoveryActions = config.recovery.on_fail;
          if (recoveryActions.length > 0) {
            this.emitEvent('recovery_start', { stage: stage.name, attempt: currentAttempt });
            
            const recoveryResult = await this.recoveryExecutor.executeAll(recoveryActions, recoveryContext);
            recoveryAttempts++;
            
            this.emitEvent('recovery_complete', { recoveryResult });

            if (!recoveryResult.success && currentAttempt === maxAttempts) {
              // Last attempt failed
              const endTime = Date.now();
              return {
                success: false,
                stages: stageResults,
                duration: endTime - startTime,
                startTime,
                endTime,
                error: `Pipeline failed after ${maxAttempts} attempts. Last error: ${result.error}`,
                recoveryAttempts,
                convergence,
              };
            }
          }

          // Break out of stage loop to retry
          break;
        }
      }

      // Check if all required stages completed
      const requiredStages = orderedStages.filter(s => !s.condition);
      const allRequiredCompleted = requiredStages.every(s => completedStages.has(s.name));

      if (allRequiredCompleted) {
        // Pipeline succeeded!
        const endTime = Date.now();
        
        // Execute success actions
        await this.executeSuccessActions(config.pipeline.on_success);
        
        const pipelineResult: PipelineResult = {
          success: true,
          stages: stageResults,
          duration: endTime - startTime,
          startTime,
          endTime,
          recoveryAttempts,
          convergence,
        };

        this.emitEvent('pipeline_complete', { result: pipelineResult });
        
        if (this.options.verbose) {
          console.log(`[PipelineExecutor] Pipeline succeeded! Duration: ${pipelineResult.duration}ms`);
        }

        return pipelineResult;
      }

      // Prepare for retry
      currentAttempt++;
      
      if (currentAttempt <= maxAttempts) {
        // Reset completed stages for retry (but keep failures)
        const failedStages = orderedStages.filter(s => 
          stageResults.find(r => r.name === s.name && !r.success)
        );
        completedStages.clear();
        
        // Only keep successful stages
        for (const result of stageResults) {
          if (result.success) {
            completedStages.add(result.name);
          }
        }

        if (this.options.verbose) {
          console.log(`[PipelineExecutor] Retrying failed stages...`);
        }
      }
    }

    // Should not reach here, but handle case
    const endTime = Date.now();
    return {
      success: false,
      stages: stageResults,
      duration: endTime - startTime,
      startTime,
      endTime,
      error: `Pipeline failed after ${maxAttempts} attempts`,
      recoveryAttempts,
      convergence,
    };
  }

  /**
   * Execute a single stage by name
   */
  async executeStage(stageName: string): Promise<StageResult | null> {
    const config = await this.configManager.load();
    const stage = config.pipeline.on_converge.find(s => s.name === stageName);

    if (!stage) {
      return null;
    }

    const context = {
      timestamp: Date.now(),
      stage_name: stageName,
    };

    return this.stageExecutor.execute(stage, context, this.options.dryRun);
  }

  /**
   * Evaluate a condition for stage execution
   */
  private async evaluateCondition(condition: string, context: ConditionContext): Promise<boolean> {
    // Simple condition evaluation
    // Supports: "file changed", "stage succeeded", etc.
    
    const conditionLower = condition.toLowerCase().trim();

    // Check for file change patterns
    if (conditionLower.includes('changed') || conditionLower.includes('package.json')) {
      try {
        // Simple check - in a real implementation, this would check git status or file hashes
        if (conditionLower.includes('package.json') && await fs.pathExists('package.json')) {
          return true;
        }
      } catch {
        return false;
      }
    }

    // Default: execute stage
    return true;
  }

  /**
   * Execute success actions (like git commit)
   */
  private async executeSuccessActions(actions: string[]): Promise<void> {
    if (this.options.dryRun) {
      console.log('[PipelineExecutor] DRY RUN - Would execute success actions:');
      for (const action of actions) {
        console.log(`  - ${action}`);
      }
      return;
    }

    for (const action of actions) {
      try {
        if (this.options.verbose) {
          console.log(`[PipelineExecutor] Executing success action: ${action}`);
        }

        // Handle git commands specially
        if (action.startsWith('git ')) {
          const result = await this.runGitCommand(action);
          if (this.options.verbose) {
            console.log(`[PipelineExecutor] Git result: ${result}`);
          }
        } else {
          // Run as shell command
          await this.runShellCommand(action);
        }
      } catch (error) {
        console.warn(`[PipelineExecutor] Success action failed: ${action}`, error);
      }
    }
  }

  private runGitCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = command.slice(4).split(' '); // Remove 'git ' prefix
      const child = spawn('git', args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => { stdout += data.toString(); });
      child.stderr?.on('data', (data) => { stderr += data.toString(); });

      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Git command failed: ${stderr}`));
        }
      });
    });
  }

  private runShellCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'cmd.exe' : '/bin/sh';
      const shellArgs = isWindows ? ['/c', command] : ['-c', command];

      const child = spawn(shell, shellArgs, { stdio: 'pipe' });

      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0 || code === null) {
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Emit pipeline event
   */
  private emitEvent(type: PipelineEvent['type'], data: unknown): void {
    const event: PipelineEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    
    this.emit(type, event);
    
    if (this.options.onEvent) {
      this.options.onEvent(event);
    }
  }

  /**
   * Get current stage states
   */
  getStageStates(): Map<string, 'pending' | 'running' | 'completed' | 'failed' | 'skipped'> {
    return new Map(this.stageStates);
  }

  /**
   * Get configuration
   */
  async getConfig(): Promise<PipelineConfig> {
    return this.configManager.load();
  }
}

// Factory function
export async function createPipelineExecutor(options?: ExecutorOptions): Promise<PipelineExecutor> {
  return new PipelineExecutor(options);
}
