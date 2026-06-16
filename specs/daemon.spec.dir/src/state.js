"use strict";
/**
 * State persistence for speclangd
 *
 * Generated from: @speclang/daemon/architecture
 *
 * Persists daemon state to .speclang/daemon-state.json
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
exports.State = void 0;
const fs = __importStar(require("fs-extra"));
const types_1 = require("./types");
const STATE_FILE = '.speclang/daemon-state.json';
class State {
    state;
    statePath;
    constructor(statePath) {
        this.statePath = statePath || STATE_FILE;
        this.state = this.createInitialState();
    }
    /**
     * Create initial state
     */
    createInitialState() {
        return {
            cascadeDepth: 0,
            filesChanged: [],
            activeAgents: [],
            startedAt: Date.now(),
            status: types_1.DaemonStatusKind.Idle,
        };
    }
    /**
     * Load state from disk
     */
    async load() {
        try {
            if (await fs.pathExists(this.statePath)) {
                const content = await fs.readFile(this.statePath, 'utf-8');
                const loaded = JSON.parse(content);
                this.state = { ...this.createInitialState(), ...loaded };
                console.log(`[State] Loaded state from ${this.statePath}`);
            }
        }
        catch (error) {
            console.warn(`[State] Failed to load state:`, error);
            this.state = this.createInitialState();
        }
        return this.state;
    }
    /**
     * Save state to disk
     */
    async save() {
        try {
            await fs.ensureFile(this.statePath);
            await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), 'utf-8');
        }
        catch (error) {
            console.error(`[State] Failed to save state:`, error);
        }
    }
    /**
     * Get current state
     */
    get() {
        return { ...this.state };
    }
    /**
     * Update status
     */
    setStatus(status) {
        this.state.status = status;
        this.save().catch(console.error);
    }
    /**
     * Update cascade depth
     */
    setCascadeDepth(depth) {
        this.state.cascadeDepth = depth;
        this.save().catch(console.error);
    }
    /**
     * Add a changed file
     */
    addChangedFile(file) {
        if (!this.state.filesChanged.includes(file)) {
            this.state.filesChanged.push(file);
        }
        this.state.lastEventAt = Date.now();
        this.save().catch(console.error);
    }
    /**
     * Add an active agent
     */
    addActiveAgent(agentId) {
        if (!this.state.activeAgents.includes(agentId)) {
            this.state.activeAgents.push(agentId);
        }
        this.save().catch(console.error);
    }
    /**
     * Remove an active agent
     */
    removeActiveAgent(agentId) {
        this.state.activeAgents = this.state.activeAgents.filter((a) => a !== agentId);
        this.save().catch(console.error);
    }
    /**
     * Set quiet since timestamp
     */
    setQuietSince(timestamp) {
        this.state.quietSince = timestamp;
        this.save().catch(console.error);
    }
    /**
     * Clear quiet since
     */
    clearQuietSince() {
        this.state.quietSince = undefined;
        this.save().catch(console.error);
    }
    /**
     * Get status for API
     */
    getStatus() {
        return {
            status: this.state.status,
            cascadeDepth: this.state.cascadeDepth,
            filesChanged: this.state.filesChanged.length,
            activeAgents: this.state.activeAgents.length,
            startedAt: this.state.startedAt,
            lastEventAt: this.state.lastEventAt,
            quietSince: this.state.quietSince,
        };
    }
    /**
     * Reset state
     */
    async reset() {
        this.state = this.createInitialState();
        await this.save();
    }
    /**
     * Clear changed files
     */
    clearChangedFiles() {
        this.state.filesChanged = [];
        this.save().catch(console.error);
    }
}
exports.State = State;
//# sourceMappingURL=state.js.map