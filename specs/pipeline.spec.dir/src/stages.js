"use strict";
/**
 * Stage Execution for Pipeline
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/build
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageExecutor = void 0;
exports.areDependenciesMet = areDependenciesMet;
exports.orderStages = orderStages;
const child_process_1 = require("child_process");
const hooks_1 = require("./hooks");
class StageExecutor {
    hookExecutor;
    verbose;
    constructor(verbose = false) {
        this.hookExecutor = new hooks_1.HookExecutor();
        this.verbose = verbose;
    }
    async execute(stage, context, dryRun = false) {
        const startTime = Date.now();
        const stageName = stage.name;
        if (this.verbose) {
            console.log(`[StageExecutor] Executing stage: ${stageName}`);
        }
        try {
            // Run pre-hook if defined
            if (stage.hooks?.pre) {
                await this.hookExecutor.execute({
                    name: `${stageName}_pre`,
                    script: stage.hooks.pre,
                    context: { ...context, stage_name: stageName, stage_success: undefined },
                });
            }
            // Execute the stage command(s)
            let output = '';
            let exitCode = 0;
            if (!dryRun) {
                const commands = Array.isArray(stage.run) ? stage.run : [stage.run];
                for (const command of commands) {
                    const result = await this.runCommand(command);
                    output += result.stdout + result.stderr;
                    exitCode = result.code;
                    if (exitCode !== 0) {
                        break;
                    }
                }
            }
            else {
                output = `[DRY RUN] Would execute: ${Array.isArray(stage.run) ? stage.run.join(' && ') : stage.run}`;
                exitCode = 0;
            }
            const duration = Date.now() - startTime;
            const success = exitCode === 0;
            // Run post hooks
            if (stage.hooks?.post) {
                await this.hookExecutor.execute({
                    name: `${stageName}_post`,
                    script: stage.hooks.post,
                    context: { ...context, stage_name: stageName, stage_success: success, stage_output: output },
                });
            }
            if (success && stage.hooks?.post_success) {
                await this.hookExecutor.execute({
                    name: `${stageName}_post_success`,
                    script: stage.hooks.post_success,
                    context: { ...context, stage_name: stageName, stage_success: true, stage_output: output },
                });
            }
            if (!success && stage.hooks?.post_fail) {
                await this.hookExecutor.execute({
                    name: `${stageName}_post_fail`,
                    script: stage.hooks.post_fail,
                    context: { ...context, stage_name: stageName, stage_success: false, stage_output: output },
                });
            }
            if (this.verbose) {
                console.log(`[StageExecutor] Stage ${stageName} completed: ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`);
            }
            return {
                name: stageName,
                success,
                output,
                duration,
                exitCode,
                error: success ? undefined : `Exit code: ${exitCode}`,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Run post_fail hook
            if (stage.hooks?.post_fail) {
                try {
                    await this.hookExecutor.execute({
                        name: `${stageName}_post_fail`,
                        script: stage.hooks.post_fail,
                        context: { ...context, stage_name: stageName, stage_success: false, stage_output: errorMessage },
                    });
                }
                catch (hookError) {
                    console.error(`[StageExecutor] Post-fail hook error:`, hookError);
                }
            }
            if (this.verbose) {
                console.log(`[StageExecutor] Stage ${stageName} failed: ${errorMessage}`);
            }
            return {
                name: stageName,
                success: false,
                output: errorMessage,
                duration,
                error: errorMessage,
                exitCode: 1,
            };
        }
    }
    async runCommand(command) {
        return new Promise((resolve, reject) => {
            const isWindows = process.platform === 'win32';
            const shell = isWindows ? 'cmd.exe' : '/bin/sh';
            const shellArgs = isWindows ? ['/c', command] : ['-c', command];
            if (this.verbose) {
                console.log(`[StageExecutor] Running command: ${command}`);
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
                resolve({
                    code: code ?? 1,
                    stdout,
                    stderr,
                });
            });
        });
    }
}
exports.StageExecutor = StageExecutor;
// Utility function to check if stage dependencies are met
function areDependenciesMet(stage, completedStages) {
    if (!stage.depends_on || stage.depends_on.length === 0) {
        return true;
    }
    return stage.depends_on.every((dep) => completedStages.has(dep));
}
// Topological sort for stage execution order
function orderStages(stages) {
    const stageMap = new Map();
    const inDegree = new Map();
    const graph = new Map();
    // Build graph
    for (const stage of stages) {
        stageMap.set(stage.name, stage);
        inDegree.set(stage.name, 0);
        graph.set(stage.name, []);
    }
    // Calculate in-degrees
    for (const stage of stages) {
        if (stage.depends_on) {
            for (const dep of stage.depends_on) {
                if (stageMap.has(dep)) {
                    graph.get(dep)?.push(stage.name);
                    inDegree.set(stage.name, (inDegree.get(stage.name) || 0) + 1);
                }
            }
        }
    }
    // Kahn's algorithm
    const queue = [];
    const result = [];
    for (const [name, degree] of Array.from(inDegree.entries())) {
        if (degree === 0) {
            queue.push(name);
        }
    }
    while (queue.length > 0) {
        const current = queue.shift();
        const stage = stageMap.get(current);
        if (stage) {
            result.push(stage);
        }
        const neighbors = graph.get(current) || [];
        for (const neighbor of neighbors) {
            const newDegree = (inDegree.get(neighbor) || 1) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) {
                queue.push(neighbor);
            }
        }
    }
    // Check for cycles (if result doesn't contain all stages)
    if (result.length !== stages.length) {
        throw new Error('Circular dependency detected in stage configuration');
    }
    return result;
}
//# sourceMappingURL=stages.js.map