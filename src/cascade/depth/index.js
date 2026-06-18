"use strict";
// SPECLANG-GENERATED: Phase 0.20 - Cascade Depth and Cycle Detection
// DO NOT EDIT MANUALLY
// Source: docs/prompts/phase-0.20-cascade-depth.md
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CascadeTerminator = exports.ConvergenceDetector = exports.CycleDetector = exports.DepthTracker = exports.CascadeDepthManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const tracker_js_1 = require("./tracker.js");
const cycle_detection_js_1 = require("./cycle-detection.js");
const convergence_js_1 = require("./convergence.js");
const types_js_1 = require("./types.js");
/**
 * Integrated cascade depth manager
 * Coordinates depth tracking, cycle detection, and convergence
 */
class CascadeDepthManager {
    tracker;
    cycleDetector;
    convergenceDetector;
    stateDir;
    constructor(config = {}) {
        this.tracker = new tracker_js_1.DepthTracker(config);
        this.cycleDetector = new cycle_detection_js_1.CycleDetector();
        this.convergenceDetector = new convergence_js_1.ConvergenceDetector(config.quiet_period_ms || types_js_1.DEFAULT_DEPTH_CONFIG.quiet_period_ms);
        this.stateDir = '.speclang';
        // Connect cycle detector to tracker
        this.tracker.setCycleChecker(() => {
            const cycleResult = this.cycleDetector.checkForCycles();
            return cycleResult.hasCycle;
        });
        // Set up convergence callback
        this.convergenceDetector.onConvergeCallback(() => {
            this.onCascadeComplete();
        });
    }
    /**
     * Start a new cascade
     */
    startCascade(cascadeId) {
        this.tracker.startCascade(cascadeId);
        this.cycleDetector.reset();
        this.convergenceDetector.reset();
        console.log(`[depth] Cascade ${cascadeId} started`);
    }
    /**
     * Handle a file change event
     * Returns whether the cascade should continue
     */
    onFileChange(file, agent) {
        // Record activity for convergence
        this.convergenceDetector.recordActivity();
        // Check for cycles
        const cycleResult = this.cycleDetector.recordEdit(file);
        if (cycleResult.hasCycle) {
            return {
                allowed: false,
                reason: 'cycle_detected',
                details: cycleResult.reasons
            };
        }
        // Increment depth
        const depthResult = this.tracker.increment(file, agent);
        if (depthResult.shouldAbort) {
            return {
                allowed: false,
                reason: 'cycle_detected',
                details: depthResult.warnings
            };
        }
        if (depthResult.shouldPause) {
            return {
                allowed: false,
                reason: 'limit_reached',
                details: depthResult.warnings,
                current_depth: depthResult.depth
            };
        }
        return {
            allowed: true,
            current_depth: depthResult.depth,
            files_changed: depthResult.files_changed
        };
    }
    /**
     * Called when convergence is detected
     */
    onCascadeComplete() {
        const state = this.tracker.getState();
        if (state) {
            console.log(`[convergence] Cascade ${state.cascade_id} converged`);
            console.log(`  Depth: ${state.current_depth}`);
            console.log(`  Files: ${state.files_changed}`);
            // Persist final state
            this.persistState(state);
        }
    }
    /**
     * Persist cascade state to disk
     */
    persistState(state) {
        try {
            // Ensure directory exists
            if (!fs.existsSync(this.stateDir)) {
                fs.mkdirSync(this.stateDir, { recursive: true });
            }
            const stateFile = path.join(this.stateDir, 'cascade_state.json');
            const stateData = {
                ...state,
                started_at: state.started_at.toISOString(),
                last_activity: state.last_activity.toISOString(),
                depth_history: state.depth_history.map(entry => ({
                    ...entry,
                    timestamp: entry.timestamp.toISOString()
                })),
                converged_at: new Date().toISOString()
            };
            fs.writeFileSync(stateFile, JSON.stringify(stateData, null, 2));
            console.log(`[depth] State persisted to ${stateFile}`);
        }
        catch (error) {
            console.error(`[depth] Failed to persist state: ${error}`);
        }
    }
    /**
     * Get the current status of the cascade
     */
    getStatus() {
        const state = this.tracker.getState();
        const convergence = this.convergenceDetector.checkConvergence();
        return {
            active: state !== null && !convergence.converged,
            state,
            convergence
        };
    }
    /**
     * Check if a cascade is currently active
     */
    isActive() {
        return this.tracker.isActive();
    }
    /**
     * Get the cycle detector for external access
     */
    getCycleDetector() {
        return this.cycleDetector;
    }
    /**
     * Get the convergence detector for external access
     */
    getConvergenceDetector() {
        return this.convergenceDetector;
    }
    /**
     * Set the state directory for persistence
     */
    setStateDir(dir) {
        this.stateDir = dir;
    }
    /**
     * Reset all state (for testing or manual reset)
     */
    reset() {
        this.tracker.reset();
        this.cycleDetector.reset();
        this.convergenceDetector.reset();
    }
}
exports.CascadeDepthManager = CascadeDepthManager;
// Re-export types
__exportStar(require("./types.js"), exports);
var tracker_js_2 = require("./tracker.js");
Object.defineProperty(exports, "DepthTracker", { enumerable: true, get: function () { return tracker_js_2.DepthTracker; } });
var cycle_detection_js_2 = require("./cycle-detection.js");
Object.defineProperty(exports, "CycleDetector", { enumerable: true, get: function () { return cycle_detection_js_2.CycleDetector; } });
var convergence_js_2 = require("./convergence.js");
Object.defineProperty(exports, "ConvergenceDetector", { enumerable: true, get: function () { return convergence_js_2.ConvergenceDetector; } });
var termination_js_1 = require("./termination.js");
Object.defineProperty(exports, "CascadeTerminator", { enumerable: true, get: function () { return termination_js_1.CascadeTerminator; } });
//# sourceMappingURL=index.js.map