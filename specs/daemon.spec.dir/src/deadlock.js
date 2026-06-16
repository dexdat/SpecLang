"use strict";
/**
 * Deadlock Prevention for LockManager
 *
 * Generated from: @speclang/mcp.tools.locks
 *
 * Strategies:
 * - All locks have expiration timeouts
 * - Clients implement retry with exponential backoff
 * - Lock ordering: acquire locks in alphabetical file path order
 * - Deadlock detection via timeout; release locks on timeout
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadlockDetector = exports.DeadlockPreventer = void 0;
class DeadlockPreventer {
    lockManager;
    config;
    constructor(lockManager, config) {
        this.lockManager = lockManager;
        this.config = {
            maxRetries: config?.maxRetries ?? 3,
            baseDelayMs: config?.baseDelayMs ?? 100,
            maxDelayMs: config?.maxDelayMs ?? 5000,
            orderingEnabled: config?.orderingEnabled ?? true,
        };
    }
    async acquireWithRetry(filePath, agentId, files) {
        const sortedPaths = this.config.orderingEnabled
            ? this.sortFilePaths([filePath, ...(files ?? [])])
            : [filePath];
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            const lock = await this.lockManager.acquire(filePath, agentId);
            if (lock) {
                return { success: true, lock, attempts: attempt };
            }
            if (attempt < this.config.maxRetries) {
                const delay = this.calculateBackoff(attempt);
                console.log(`[DeadlockPreventer] Retry ${attempt}/${this.config.maxRetries} after ${delay}ms`);
                await this.sleep(delay);
            }
        }
        return {
            success: false,
            error: `Failed to acquire lock after ${this.config.maxRetries} attempts`,
            attempts: this.config.maxRetries,
        };
    }
    async acquireMultiple(filePaths, agentId) {
        const results = new Map();
        const sortedPaths = this.config.orderingEnabled
            ? this.sortFilePaths(filePaths)
            : filePaths;
        const acquiredLocks = [];
        for (const filePath of sortedPaths) {
            const result = await this.acquireWithRetry(filePath, agentId, sortedPaths);
            if (!result.success) {
                for (const acquired of acquiredLocks) {
                    await this.lockManager.release(acquired.path, agentId);
                }
                results.set(filePath, result);
                return results;
            }
            if (result.lock) {
                acquiredLocks.push({ path: filePath, lock: result.lock });
            }
            results.set(filePath, result);
        }
        return results;
    }
    async releaseMultiple(filePaths, agentId) {
        let allSuccess = true;
        for (const filePath of filePaths) {
            const released = await this.lockManager.release(filePath, agentId);
            if (!released) {
                allSuccess = false;
            }
        }
        return allSuccess;
    }
    sortFilePaths(filePaths) {
        return [...filePaths].sort((a, b) => {
            const normalizedA = a.replace(/[\\/:]/g, '-');
            const normalizedB = b.replace(/[\\/:]/g, '-');
            return normalizedA.localeCompare(normalizedB);
        });
    }
    calculateBackoff(attempt) {
        const delay = this.config.baseDelayMs * Math.pow(2, attempt - 1);
        return Math.min(delay, this.config.maxDelayMs);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.DeadlockPreventer = DeadlockPreventer;
class DeadlockDetector {
    lockManager;
    checkInterval = null;
    listeners = [];
    constructor(lockManager) {
        this.lockManager = lockManager;
    }
    start(intervalMs = 5000) {
        if (this.checkInterval) {
            return;
        }
        this.checkInterval = setInterval(async () => {
            await this.checkAndNotify();
        }, intervalMs);
    }
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    onDeadlockDetected(callback) {
        this.listeners.push(callback);
    }
    async checkAndNotify() {
        const activeLocks = await this.lockManager.getActiveLocks();
        const now = Date.now();
        const expiredLocks = activeLocks.filter(lock => {
            const timeUntilExpiry = lock.expiresAt - now;
            return timeUntilExpiry < 0 || timeUntilExpiry < 5000;
        });
        if (expiredLocks.length > 0) {
            console.log(`[DeadlockDetector] Found ${expiredLocks.length} expired/stuck locks`);
            for (const lock of expiredLocks) {
                await this.lockManager.forceRelease(lock.file);
            }
            for (const listener of this.listeners) {
                listener(expiredLocks);
            }
        }
    }
}
exports.DeadlockDetector = DeadlockDetector;
//# sourceMappingURL=deadlock.js.map