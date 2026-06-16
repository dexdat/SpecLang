"use strict";
// Generated from specs/ralph-loop.spec.md
// DO NOT EDIT MANUALLY
// Source: @speclang/ralph-loop @ref:specs/ralph-loop#ralph/control
Object.defineProperty(exports, "__esModule", { value: true });
exports.RalphLoop = void 0;
exports.createRalphLoop = createRalphLoop;
/**
 * Ralph Loop - Main Loop Controller
 *
 * Controls the dual-agent Ralph Loop process:
 * 1. Load complete backing specifications
 * 2. Generate todo list
 * 3. Spawn Builder and Verifier agents
 * 4. While todo list has pending tasks:
 *    a. Get next task
 *    b. Assign task to Builder
 *    c. Builder executes task
 *    d. Verifier validates output
 *    e. If validation succeeds, mark task done
 *    f. If validation fails, create steering packet, send to Builder, retry task
 * 5. When all tasks done, run system verification, final validation, and success report
 *
 * @module ralph/loop
 */
const types_1 = require("./types");
const builder_1 = require("./builder");
const verifier_1 = require("./verifier");
/**
 * RalphLoop - Main controller for the dual-agent Ralph Loop
 */
class RalphLoop {
    state;
    config;
    builder;
    verifier;
    steeringPackets = [];
    currentPhase = 'phase_1_manual_emulation';
    constructor(builderConfig, verifierConfig, config = {}) {
        this.config = { ...types_1.DEFAULT_LOOP_CONFIG, ...config };
        this.builder = new builder_1.RalphBuilderAgent(builderConfig);
        this.verifier = new verifier_1.RalphVerifierAgent(verifierConfig);
        this.state = {
            isRunning: false,
            currentTask: null,
            todoList: [],
            iteration: 0,
        };
    }
    /**
     * Load complete backing specifications
     */
    async loadSpecifications() {
        console.log('[RalphLoop] Loading specifications...');
        // In production, would load all specs from the specs directory
        console.log('[RalphLoop] Specifications loaded');
    }
    /**
     * Generate todo list from spec analysis
     */
    async generateTodoList() {
        console.log('[RalphLoop] Generating todo list...');
        // In production, would analyze specs and generate actual tasks
        const tasks = [
            {
                id: 'ralph-001',
                description: 'Initialize Ralph Loop system',
                depends_on: [],
                estimated_complexity: 'low',
                priority: 1,
                assigned_to: null,
                status: 'pending',
                created_at: Date.now(),
            },
            {
                id: 'ralph-002',
                description: 'Implement Builder Agent',
                depends_on: ['ralph-001'],
                estimated_complexity: 'medium',
                priority: 2,
                assigned_to: null,
                status: 'pending',
                created_at: Date.now(),
            },
            {
                id: 'ralph-003',
                description: 'Implement Verifier Agent',
                depends_on: ['ralph-001'],
                estimated_complexity: 'medium',
                priority: 2,
                assigned_to: null,
                status: 'pending',
                created_at: Date.now(),
            },
        ];
        const todoList = {
            tasks,
            generated_at: Date.now(),
        };
        this.state.todoList = tasks;
        console.log(`[RalphLoop] Generated ${tasks.length} tasks`);
        return todoList;
    }
    /**
     * Run the Ralph Loop
     */
    async run() {
        console.log('[RalphLoop] Starting Ralph Loop...');
        this.state.isRunning = true;
        try {
            // Step 1: Load specifications
            await this.loadSpecifications();
            // Step 2: Generate todo list
            await this.generateTodoList();
            // Step 3-4: Process tasks in loop
            while (this.hasPendingTasks() && this.state.iteration < this.config.maxIterations) {
                await this.processNextTask();
                this.state.iteration++;
            }
            // Step 5: Final verification
            await this.runSystemVerification();
            console.log('[RalphLoop] Ralph Loop completed successfully');
        }
        catch (error) {
            console.error('[RalphLoop] Error:', error);
            throw error;
        }
        finally {
            this.state.isRunning = false;
        }
    }
    /**
     * Check if there are pending tasks
     */
    hasPendingTasks() {
        return this.state.todoList.some(task => task.status === 'pending');
    }
    /**
     * Get next pending task
     */
    getNextTask() {
        // Get highest priority pending task
        const pending = this.state.todoList
            .filter(task => task.status === 'pending')
            .sort((a, b) => a.priority - b.priority);
        return pending[0] || null;
    }
    /**
     * Process next task in the loop
     */
    async processNextTask() {
        const task = this.getNextTask();
        if (!task) {
            console.log('[RalphLoop] No pending tasks');
            return;
        }
        console.log(`[RalphLoop] Processing task: ${task.id}`);
        this.state.currentTask = task;
        // Assign to builder
        task.assigned_to = 'builder';
        // Builder executes task
        const builderResult = await this.builder.executeTask(task);
        // Verifier validates output
        const verificationResult = await this.verifier.validate(builderResult, task);
        if (verificationResult.success) {
            // Validation passed - mark task done
            task.status = 'done';
            task.completed_at = Date.now();
            console.log(`[RalphLoop] Task ${task.id} completed successfully`);
            // Create success confirmation
            const successPacket = this.verifier.createSuccessConfirmation(task, builderResult);
            this.steeringPackets.push(successPacket);
        }
        else {
            // Validation failed - create steering packet and retry
            console.log(`[RalphLoop] Task ${task.id} failed validation`);
            const steeringPacket = this.verifier.createSteeringPacketForFailure(task, verificationResult.errors);
            this.steeringPackets.push(steeringPacket);
            // Process steering packet with builder
            await this.builder.processSteeringPacket(steeringPacket);
            // Retry the task
            await this.builder.executeTask(task);
            // Re-validate
            const retryResult = await this.verifier.validate(builderResult, task);
            if (retryResult.success) {
                task.status = 'done';
                task.completed_at = Date.now();
            }
            else {
                task.status = 'failed';
                console.error(`[RalphLoop] Task ${task.id} failed after retry`);
            }
        }
    }
    /**
     * Run system verification when all tasks are done
     */
    async runSystemVerification() {
        console.log('[RalphLoop] Running system verification...');
        // Check all tasks completed
        const allDone = this.state.todoList.every(task => task.status === 'done' || task.status === 'failed');
        if (!allDone) {
            console.warn('[RalphLoop] Warning: Not all tasks completed');
        }
        // Summary
        const completed = this.state.todoList.filter(t => t.status === 'done').length;
        const failed = this.state.todoList.filter(t => t.status === 'failed').length;
        console.log(`[RalphLoop] Verification complete: ${completed} done, ${failed} failed`);
    }
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get steering packets
     */
    getSteeringPackets() {
        return [...this.steeringPackets];
    }
    /**
     * Set implementation phase
     */
    setPhase(phase) {
        this.currentPhase = phase;
        console.log(`[RalphLoop] Phase set to: ${phase}`);
    }
    /**
     * Stop the loop
     */
    stop() {
        console.log('[RalphLoop] Stopping...');
        this.state.isRunning = false;
    }
    /**
     * Get builder agent
     */
    getBuilder() {
        return this.builder;
    }
    /**
     * Get verifier agent
     */
    getVerifier() {
        return this.verifier;
    }
}
exports.RalphLoop = RalphLoop;
/**
 * Create a new Ralph Loop instance
 */
function createRalphLoop(builderConfig, verifierConfig, config) {
    return new RalphLoop(builderConfig, verifierConfig, config);
}
//# sourceMappingURL=loop.js.map