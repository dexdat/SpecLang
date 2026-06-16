"use strict";
/**
 * Pipeline Executor
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/build
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
exports.PipelineExecutor = void 0;
exports.createPipelineExecutor = createPipelineExecutor;
const events_1 = require("events");
const fs = __importStar(require("fs-extra"));
const child_process_1 = require("child_process");
const config_1 = require("./config");
const stages_1 = require("./stages");
const recovery_1 = require("./recovery");
class PipelineExecutor extends events_1.EventEmitter {
    configManager;
    stageExecutor;
    recoveryExecutor;
    options;
    stageStates;
    constructor(options = {}) {
        super();
        this.options = options;
        this.configManager = new config_1.PipelineConfigManager(options.configPath);
        this.stageExecutor = new stages_1.StageExecutor(options.verbose);
        this.recoveryExecutor = new recovery_1.RecoveryExecutor('.speclang/errors', options.verbose);
        this.stageStates = new Map();
    }
    /**
     * Execute the full pipeline
     */
    async execute(convergence) {
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
        const orderedStages = (0, stages_1.orderStages)(stages);
        const stageResults = [];
        const completedStages = new Set();
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
                if (!(0, stages_1.areDependenciesMet)(stage, completedStages)) {
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
                        const skippedResult = {
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
                }
                else {
                    this.stageStates.set(stage.name, 'failed');
                    this.emitEvent('stage_fail', { stage: result, attempt: currentAttempt });
                    // Execute recovery
                    const recoveryContext = {
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
                const pipelineResult = {
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
                const failedStages = orderedStages.filter(s => stageResults.find(r => r.name === s.name && !r.success));
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
    async executeStage(stageName) {
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
    async evaluateCondition(condition, context) {
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
            }
            catch {
                return false;
            }
        }
        // Default: execute stage
        return true;
    }
    /**
     * Execute success actions (like git commit)
     */
    async executeSuccessActions(actions) {
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
                }
                else {
                    // Run as shell command
                    await this.runShellCommand(action);
                }
            }
            catch (error) {
                console.warn(`[PipelineExecutor] Success action failed: ${action}`, error);
            }
        }
    }
    runGitCommand(command) {
        return new Promise((resolve, reject) => {
            const args = command.slice(4).split(' '); // Remove 'git ' prefix
            const child = (0, child_process_1.spawn)('git', args, { stdio: 'pipe' });
            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', (data) => { stdout += data.toString(); });
            child.stderr?.on('data', (data) => { stderr += data.toString(); });
            child.on('error', reject);
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                }
                else {
                    reject(new Error(`Git command failed: ${stderr}`));
                }
            });
        });
    }
    runShellCommand(command) {
        return new Promise((resolve, reject) => {
            const isWindows = process.platform === 'win32';
            const shell = isWindows ? 'cmd.exe' : '/bin/sh';
            const shellArgs = isWindows ? ['/c', command] : ['-c', command];
            const child = (0, child_process_1.spawn)(shell, shellArgs, { stdio: 'pipe' });
            child.on('error', reject);
            child.on('close', (code) => {
                if (code === 0 || code === null) {
                    resolve();
                }
                else {
                    reject(new Error(`Command exited with code ${code}`));
                }
            });
        });
    }
    /**
     * Emit pipeline event
     */
    emitEvent(type, data) {
        const event = {
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
    getStageStates() {
        return new Map(this.stageStates);
    }
    /**
     * Get configuration
     */
    async getConfig() {
        return this.configManager.load();
    }
}
exports.PipelineExecutor = PipelineExecutor;
// Factory function
async function createPipelineExecutor(options) {
    return new PipelineExecutor(options);
}
//# sourceMappingURL=executor.js.map