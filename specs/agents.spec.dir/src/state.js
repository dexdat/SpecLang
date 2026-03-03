"use strict";
/**
 * State persistence for agents
 *
 * Generated from: @speclang/agent-protocol
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
exports.StateManager = void 0;
exports.sessionToState = sessionToState;
exports.createStateManager = createStateManager;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * State Manager - persists agent state to disk
 */
class StateManager {
    stateDir;
    constructor(stateDir) {
        this.stateDir = stateDir || path.join(os.homedir(), '.speclang', 'sessions');
    }
    /**
     * Ensure state directory exists
     */
    async ensureDir() {
        await fs.ensureDir(this.stateDir);
    }
    /**
     * Get path for session state file
     */
    getStatePath(sessionId) {
        return path.join(this.stateDir, `${sessionId}.json`);
    }
    /**
     * Save agent state
     */
    async save(sessionId, state) {
        await this.ensureDir();
        const statePath = this.getStatePath(sessionId);
        const data = {
            ...state,
            last_updated: Date.now(),
        };
        await fs.writeJson(statePath, data, { spaces: 2 });
        console.log(`[StateManager] Saved state for ${sessionId}`);
    }
    /**
     * Load agent state
     */
    async load(sessionId) {
        const statePath = this.getStatePath(sessionId);
        try {
            const data = await fs.readJson(statePath);
            return data;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            console.error(`[StateManager] Error loading state for ${sessionId}:`, error.message);
            return null;
        }
    }
    /**
     * List all persisted session IDs
     */
    async list() {
        await this.ensureDir();
        try {
            const files = await fs.readdir(this.stateDir);
            return files
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('.json', ''));
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Delete persisted state
     */
    async delete(sessionId) {
        const statePath = this.getStatePath(sessionId);
        try {
            await fs.remove(statePath);
            console.log(`[StateManager] Deleted state for ${sessionId}`);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`[StateManager] Error deleting state for ${sessionId}:`, error.message);
            }
        }
    }
    /**
     * Garbage collect old sessions
     */
    async gc(maxAgeMs) {
        const sessions = await this.list();
        let deleted = 0;
        const now = Date.now();
        for (const sessionId of sessions) {
            const state = await this.load(sessionId);
            if (state && (now - state.last_updated) > maxAgeMs) {
                await this.delete(sessionId);
                deleted++;
            }
        }
        console.log(`[StateManager] GC: deleted ${deleted} old sessions`);
        return deleted;
    }
    /**
     * Check if session state exists
     */
    async exists(sessionId) {
        const statePath = this.getStatePath(sessionId);
        return fs.pathExists(statePath);
    }
    /**
     * Get state file info
     */
    async getInfo(sessionId) {
        const statePath = this.getStatePath(sessionId);
        try {
            const stat = await fs.stat(statePath);
            return {
                created: stat.birthtime,
                modified: stat.mtime,
                size: stat.size,
            };
        }
        catch (error) {
            return null;
        }
    }
}
exports.StateManager = StateManager;
/**
 * Convert session to persistable state
 */
function sessionToState(sessionId, agentRole, workingOn, pendingTasks, completedTasks, errors) {
    return {
        session_id: sessionId,
        agent_role: agentRole,
        working_on: workingOn,
        pending_tasks: pendingTasks,
        completed_tasks: completedTasks.slice(-50), // Keep last 50
        errors: errors.slice(-20), // Keep last 20
        last_updated: Date.now(),
    };
}
/**
 * Create a new state manager
 */
function createStateManager(stateDir) {
    return new StateManager(stateDir);
}
//# sourceMappingURL=state.js.map