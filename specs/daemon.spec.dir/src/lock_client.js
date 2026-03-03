"use strict";
/**
 * Lock Client for agents
 *
 * Generated from: @speclang/mcp.tools.locks
 *
 * Provides a client interface for agents to acquire/release locks
 * with built-in deadlock prevention and retry logic.
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
exports.LockClient = void 0;
exports.createLockClient = createLockClient;
const crypto = __importStar(require("crypto"));
const locks_1 = require("./locks");
const deadlock_1 = require("./deadlock");
class LockClient {
    lockManager;
    deadlockPreventer;
    deadlockDetector;
    agentId;
    heldLocks = new Map();
    constructor(config) {
        this.agentId = config.agentId;
        this.lockManager = new locks_1.LockManager(config.locksDir, config.timeout);
        this.deadlockPreventer = new deadlock_1.DeadlockPreventer(this.lockManager, config.deadlockConfig);
        this.deadlockDetector = new deadlock_1.DeadlockDetector(this.lockManager);
    }
    async initialize() {
        await this.lockManager.initialize();
        this.deadlockDetector.start();
    }
    async acquireLock(filePath) {
        const result = await this.deadlockPreventer.acquireWithRetry(filePath, this.agentId);
        if (!result.success || !result.lock) {
            console.log(`[LockClient] Failed to acquire lock for ${filePath}: ${result.error}`);
            return null;
        }
        const handle = {
            filePath,
            lock: result.lock,
            release: async () => {
                return this.releaseLock(filePath);
            },
        };
        this.heldLocks.set(filePath, handle);
        return handle;
    }
    async acquireMultipleLocks(filePaths) {
        const results = new Map();
        const deadlockResults = await this.deadlockPreventer.acquireMultiple(filePaths, this.agentId);
        for (const [filePath, result] of deadlockResults) {
            if (result.success && result.lock) {
                const handle = {
                    filePath,
                    lock: result.lock,
                    release: async () => {
                        return this.releaseLock(filePath);
                    },
                };
                this.heldLocks.set(filePath, handle);
                results.set(filePath, handle);
            }
            else {
                results.set(filePath, null);
            }
        }
        return results;
    }
    async releaseLock(filePath) {
        const released = await this.lockManager.release(filePath, this.agentId);
        if (released) {
            this.heldLocks.delete(filePath);
        }
        return released;
    }
    async releaseAllLocks() {
        const filePaths = Array.from(this.heldLocks.keys());
        const success = await this.deadlockPreventer.releaseMultiple(filePaths, this.agentId);
        this.heldLocks.clear();
        return success;
    }
    async isLocked(filePath) {
        return this.lockManager.isLocked(filePath);
    }
    async getLock(filePath) {
        return this.lockManager.getLock(filePath);
    }
    async getActiveLocks() {
        return this.lockManager.getActiveLocks();
    }
    generateLockToken() {
        return crypto.randomUUID();
    }
    getHeldLocks() {
        return Array.from(this.heldLocks.values());
    }
    async cleanup() {
        this.deadlockDetector.stop();
        await this.releaseAllLocks();
        await this.lockManager.cleanup();
    }
    getAgentId() {
        return this.agentId;
    }
    onDeadlockDetected(callback) {
        this.deadlockDetector.onDeadlockDetected(callback);
    }
}
exports.LockClient = LockClient;
function createLockClient(config) {
    return new LockClient(config);
}
//# sourceMappingURL=lock_client.js.map