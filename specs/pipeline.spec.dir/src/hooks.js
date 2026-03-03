"use strict";
/**
 * Hook Execution System for Pipeline
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/hooks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuiltInHooks = exports.HookExecutor = void 0;
exports.createHookContext = createHookContext;
const child_process_1 = require("child_process");
class HookExecutor {
    verbose;
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    async execute(hook) {
        const startTime = Date.now();
        if (this.verbose) {
            console.log(`[HookExecutor] Executing hook: ${hook.name}`);
        }
        try {
            const output = await this.runScript(hook.script);
            const duration = Date.now() - startTime;
            if (this.verbose) {
                console.log(`[HookExecutor] Hook ${hook.name} completed: SUCCESS (${duration}ms)`);
            }
            return {
                name: hook.name,
                success: true,
                output,
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (this.verbose) {
                console.log(`[HookExecutor] Hook ${hook.name} completed: FAILED (${duration}ms)`);
                console.log(`[HookExecutor] Error: ${errorMessage}`);
            }
            return {
                name: hook.name,
                success: false,
                output: errorMessage,
                duration,
                error: errorMessage,
            };
        }
    }
    async executeMultiple(hooks) {
        const results = [];
        for (const hook of hooks) {
            const result = await this.execute(hook);
            results.push(result);
            // Continue executing even if one fails (non-fatal)
            if (!result.success) {
                console.warn(`[HookExecutor] Hook ${hook.name} failed but continuing...`);
            }
        }
        return results;
    }
    runScript(script) {
        return new Promise((resolve, reject) => {
            const isWindows = process.platform === 'win32';
            const shell = isWindows ? 'cmd.exe' : '/bin/sh';
            const shellArgs = isWindows ? ['/c', script] : ['-c', script];
            if (this.verbose) {
                console.log(`[HookExecutor] Running script: ${script}`);
            }
            const child = (0, child_process_1.spawn)(shell, shellArgs, {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: { ...process.env },
                cwd: process.cwd(),
            });
            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', (data) => {
                const text = data.toString();
                stdout += text;
                if (this.verbose) {
                    process.stdout.write(text);
                }
            });
            child.stderr?.on('data', (data) => {
                const text = data.toString();
                stderr += text;
                if (this.verbose) {
                    process.stderr.write(text);
                }
            });
            child.on('error', (error) => {
                reject(error);
            });
            child.on('close', (code) => {
                if (code === 0 || code === null) {
                    resolve(stdout);
                }
                else {
                    reject(new Error(`Hook script exited with code ${code}: ${stderr}`));
                }
            });
        });
    }
}
exports.HookExecutor = HookExecutor;
// Built-in hook utilities
exports.BuiltInHooks = {
    echo: (message) => `echo "${message}"`,
    notifyDiscord: (webhookUrl, message) => {
        return `curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -d '{"content": "${message}"}'`;
    },
    notifySlack: (webhookUrl, message) => {
        return `curl -X POST -H 'Content-type: application/json' --data '{"text":"${message}"}' "${webhookUrl}"`;
    },
    logToFile: (filePath, message) => {
        return `echo "[$(date)] ${message}" >> ${filePath}`;
    },
    notifyOrchestrator: (message) => {
        // This would integrate with the orchestrator notification system
        return `echo "NOTIFY: ${message}"`;
    },
};
// Helper to create hook context
function createHookContext(stageName, stageSuccess, stageOutput, pipelineResult) {
    return {
        stage_name: stageName,
        stage_success: stageSuccess,
        stage_output: stageOutput,
        pipeline_result: pipelineResult,
        timestamp: Date.now(),
    };
}
//# sourceMappingURL=hooks.js.map