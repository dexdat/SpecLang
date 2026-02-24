/**
 * Recovery System for Pipeline
 * 
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/recovery
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import { RecoveryAction, RecoveryContext, RecoveryResult, RecoveryActionType } from './types';

export class RecoveryExecutor {
  private errorLogDir: string;
  private verbose: boolean;

  constructor(errorLogDir: string = '.speclang/errors', verbose: boolean = false) {
    this.errorLogDir = errorLogDir;
    this.verbose = verbose;
  }

  async execute(action: RecoveryAction, context: RecoveryContext): Promise<{ success: boolean; error?: string }> {
    if (this.verbose) {
      console.log(`[RecoveryExecutor] Executing recovery action: ${action.type}`);
    }

    try {
      switch (action.type) {
        case 'rollback':
          return await this.rollback(action, context);
        
        case 'notify':
          return await this.notify(action, context);
        
        case 'retry':
          return await this.retry(action, context);
        
        case 'pause':
          return await this.pause(action, context);
        
        default:
          return { success: false, error: `Unknown recovery action type: ${action.type}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[RecoveryExecutor] Recovery action failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  async executeAll(actions: RecoveryAction[], context: RecoveryContext): Promise<RecoveryResult> {
    const results: Array<{ type: RecoveryActionType; success: boolean; error?: string }> = [];

    for (const action of actions) {
      const result = await this.execute(action, context);
      results.push({
        type: action.type,
        success: result.success,
        error: result.error,
      });

      // Log the error before recovery
      await this.logError(context, action);
    }

    const allSucceeded = results.every(r => r.success);
    return {
      success: allSucceeded,
      actions: results,
    };
  }

  private async rollback(action: RecoveryAction, context: RecoveryContext): Promise<{ success: boolean; error?: string }> {
    const target = action.rollback?.target || 'last_spec_change';

    if (this.verbose) {
      console.log(`[RecoveryExecutor] Rolling back: ${target}`);
    }

    try {
      switch (target) {
        case 'last_spec_change':
          // Get last git commit
          try {
            execSync('git log -1 --pretty=format:"%H" -- specs/', { encoding: 'utf-8' });
            execSync('git checkout HEAD -- specs/', { stdio: 'pipe' });
            if (this.verbose) {
              console.log('[RecoveryExecutor] Rolled back spec changes');
            }
            return { success: true };
          } catch {
            // No spec changes to rollback
            return { success: true };
          }

        case 'last_pipeline':
          // Reset to last commit
          execSync('git checkout HEAD -- .', { stdio: 'pipe' });
          if (this.verbose) {
            console.log('[RecoveryExecutor] Rolled back all changes');
          }
          return { success: true };

        case 'all':
          // Hard reset to last known good state
          execSync('git reset --hard HEAD', { stdio: 'pipe' });
          if (this.verbose) {
            console.log('[RecoveryExecutor] Hard reset complete');
          }
          return { success: true };

        default:
          return { success: false, error: `Unknown rollback target: ${target}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Rollback failed: ${errorMessage}` };
    }
  }

  private async notify(action: RecoveryAction, context: RecoveryContext): Promise<{ success: boolean; error?: string }> {
    const target = action.notify?.target || 'orchestrator';
    const message = action.notify?.message || this.formatNotificationMessage(context);

    if (this.verbose) {
      console.log(`[RecoveryExecutor] Notifying: ${target}`);
    }

    try {
      switch (target) {
        case 'orchestrator':
          // Write to notification file for orchestrator to pick up
          await this.writeNotificationMessage(message, context);
          return { success: true };

        case 'log':
          console.log(`[Recovery] ${message}`);
          return { success: true };

        case 'file':
          const logPath = action.notify?.message || '.speclang/notifications.log';
          await fs.ensureFile(logPath);
          await fs.appendFile(logPath, `[${new Date().toISOString()}] ${message}\n`, 'utf-8');
          return { success: true };

        default:
          return { success: false, error: `Unknown notify target: ${target}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Notification failed: ${errorMessage}` };
    }
  }

  private async retry(action: RecoveryAction, context: RecoveryContext): Promise<{ success: boolean; error?: string }> {
    const stage = action.retry?.stage;
    const fullPipeline = action.retry?.full_pipeline;

    if (this.verbose) {
      console.log(`[RecoveryExecutor] Retry requested: stage=${stage}, full=${fullPipeline}`);
    }

    // The actual retry is handled by the PipelineExecutor
    // This just confirms the retry action is valid
    return { success: true };
  }

  private async pause(action: RecoveryAction, context: RecoveryContext): Promise<{ success: boolean; error?: string }> {
    const duration = action.pause?.duration || 5000; // Default 5 seconds
    const reason = action.pause?.reason || 'Recovery pause';

    if (this.verbose) {
      console.log(`[RecoveryExecutor] Pausing for ${duration}ms: ${reason}`);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.verbose) {
          console.log('[RecoveryExecutor] Pause complete');
        }
        resolve({ success: true });
      }, duration);
    });
  }

  private formatNotificationMessage(context: RecoveryContext): string {
    const stageInfo = context.stage ? `Stage: ${context.stage}` : 'Pipeline level';
    const attemptInfo = `Attempt: ${context.attempt}`;
    const errorInfo = `Error: ${context.error.message}`;
    
    return `[Speclang Recovery] ${stageInfo} | ${attemptInfo} | ${errorInfo}`;
  }

  private async writeNotificationMessage(message: string, context: RecoveryContext): Promise<void> {
    const dir = '.speclang/notifications';
    await fs.ensureDir(dir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `notify-${timestamp}.json`;
    
    const notification = {
      id: filename.replace('.json', ''),
      timestamp: new Date().toISOString(),
      severity: 'error',
      failure: {
        type: context.error.name || 'unknown',
        stage: context.stage || 'unknown',
        message: context.error.message,
      },
      suggestion: this.generateSuggestions(context),
    };
    
    await fs.writeFile(path.join(dir, filename), JSON.stringify(notification, null, 2), 'utf-8');
  }

  private generateSuggestions(context: RecoveryContext): string[] {
    const message = context.error.message.toLowerCase();
    const suggestions: string[] = [];

    if (message.includes('typescript') || message.includes('tsc')) {
      suggestions.push('Check TypeScript compilation errors');
      suggestions.push('Run: bun run tsc to see detailed errors');
    }

    if (message.includes('test') || message.includes('fail')) {
      suggestions.push('Check test output for failures');
      suggestions.push('Run: bun test to see detailed test results');
    }

    if (message.includes('not found') || message.includes('import')) {
      suggestions.push('Check import statements');
      suggestions.push('Verify all dependencies are installed');
    }

    if (suggestions.length === 0) {
      suggestions.push('Review error details and fix accordingly');
    }

    return suggestions;
  }

  private async logError(context: RecoveryContext, action: RecoveryAction): Promise<void> {
    try {
      await fs.ensureDir(this.errorLogDir);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `error-${timestamp}.json`;
      
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
          name: context.error.name,
          message: context.error.message,
          stack: context.error.stack,
        },
        stage: context.stage,
        attempt: context.attempt,
        recovery: {
          action: action.type,
          details: action,
        },
      };
      
      await fs.writeFile(
        path.join(this.errorLogDir, filename), 
        JSON.stringify(errorLog, null, 2), 
        'utf-8'
      );
    } catch (logError) {
      console.error('[RecoveryExecutor] Failed to log error:', logError);
    }
  }
}

// Recovery action factories
export const RecoveryActions = {
  rollbackLastSpecChange(): RecoveryAction {
    return {
      type: 'rollback',
      rollback: { target: 'last_spec_change' },
    };
  },

  notifyOrchestrator(message?: string): RecoveryAction {
    return {
      type: 'notify',
      notify: { target: 'orchestrator', message },
    };
  },

  retryPipeline(): RecoveryAction {
    return {
      type: 'retry',
      retry: { full_pipeline: true },
    };
  },

  pauseAndWait(duration: number, reason?: string): RecoveryAction {
    return {
      type: 'pause',
      pause: { duration, reason },
    };
  },
};
