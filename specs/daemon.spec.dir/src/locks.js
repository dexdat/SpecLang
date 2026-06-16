"use strict";
/**
 * Lock Manager for speclangd
 *
 * Generated from: @speclang/daemon/architecture
 *
 * Prevents concurrent write conflicts between agents
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
exports.LockManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class LockManager {
    locksDir;
    timeout;
    locks;
    constructor(locksDir = '.speclang/locks', timeout = 30) {
        this.locksDir = locksDir;
        this.timeout = timeout;
        this.locks = new Map();
    }
    async initialize() {
        await fs.ensureDir(this.locksDir);
    }
    lockPath(filePath) {
        const normalized = filePath.replace(/[\\/:]/g, '-').replace(/^-/, '');
        return path.join(this.locksDir, `${normalized}.lock`);
    }
    async acquire(filePath, agentId) {
        const lockPath = this.lockPath(filePath);
        const now = Date.now();
        try {
            if (await fs.pathExists(lockPath)) {
                const content = await fs.readFile(lockPath, 'utf-8');
                const existingLock = JSON.parse(content);
                if (!this.isExpired(existingLock)) {
                    console.log(`[LockManager] Lock held by ${existingLock.agentId}`);
                    return null;
                }
                console.log(`[LockManager] Forcing expired lock from ${existingLock.agentId}`);
            }
            const fileContent = await this.getFileHash(filePath);
            const newLock = {
                agentId,
                file: filePath,
                acquiredAt: now,
                expiresAt: now + this.timeout * 1000,
                contentHash: fileContent,
            };
            await fs.writeFile(lockPath, JSON.stringify(newLock, null, 2));
            this.locks.set(filePath, newLock);
            console.log(`[LockManager] Acquired lock for ${filePath} by ${agentId}`);
            return newLock;
        }
        catch (error) {
            console.error(`[LockManager] Failed to acquire lock:`, error);
            return null;
        }
    }
    async release(filePath, agentId) {
        const lockPath = this.lockPath(filePath);
        try {
            if (!(await fs.pathExists(lockPath))) {
                console.warn(`[LockManager] Lock not found for ${filePath}`);
                return false;
            }
            const content = await fs.readFile(lockPath, 'utf-8');
            const lock = JSON.parse(content);
            if (lock.agentId !== agentId) {
                console.error(`[LockManager] Cannot release lock owned by ${lock.agentId}`);
                return false;
            }
            await fs.remove(lockPath);
            this.locks.delete(filePath);
            console.log(`[LockManager] Released lock for ${filePath}`);
            return true;
        }
        catch (error) {
            console.error(`[LockManager] Failed to release lock:`, error);
            return false;
        }
    }
    async forceRelease(filePath) {
        const lockPath = this.lockPath(filePath);
        try {
            if (await fs.pathExists(lockPath)) {
                await fs.remove(lockPath);
                this.locks.delete(filePath);
                console.log(`[LockManager] Force released lock for ${filePath}`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`[LockManager] Failed to force release:`, error);
            return false;
        }
    }
    async isLocked(filePath) {
        const lockPath = this.lockPath(filePath);
        try {
            if (!(await fs.pathExists(lockPath))) {
                return false;
            }
            const content = await fs.readFile(lockPath, 'utf-8');
            const lock = JSON.parse(content);
            if (this.isExpired(lock)) {
                await fs.remove(lockPath);
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    async getLock(filePath) {
        const lockPath = this.lockPath(filePath);
        try {
            if (!(await fs.pathExists(lockPath))) {
                return null;
            }
            const content = await fs.readFile(lockPath, 'utf-8');
            const lock = JSON.parse(content);
            if (this.isExpired(lock)) {
                await fs.remove(lockPath);
                return null;
            }
            return lock;
        }
        catch {
            return null;
        }
    }
    isExpired(lock) {
        return Date.now() > lock.expiresAt;
    }
    async getFileHash(filePath) {
        try {
            if (await fs.pathExists(filePath)) {
                const content = await fs.readFile(filePath);
                return crypto.createHash('md5').update(content).digest('hex');
            }
        }
        catch {
            // File doesn't exist or can't be read
        }
        return undefined;
    }
    async getActiveLocks() {
        const locks = [];
        try {
            const files = await fs.readdir(this.locksDir);
            for (const file of files) {
                if (file.endsWith('.lock')) {
                    const lockPath = path.join(this.locksDir, file);
                    const content = await fs.readFile(lockPath, 'utf-8');
                    const lock = JSON.parse(content);
                    if (!this.isExpired(lock)) {
                        locks.push(lock);
                    }
                    else {
                        await fs.remove(lockPath);
                    }
                }
            }
        }
        catch {
            // Directory doesn't exist or can't be read
        }
        return locks;
    }
    async cleanup() {
        const locks = await this.getActiveLocks();
        for (const lock of locks) {
            await this.forceRelease(lock.file);
        }
    }
    setTimeout(timeout) {
        this.timeout = timeout;
    }
    getTimeout() {
        return this.timeout;
    }
    async claimEvent(workerId) {
        const eventsDir = path.join(this.locksDir, 'events');
        await fs.ensureDir(eventsDir);
        try {
            const files = await fs.readdir(eventsDir);
            const pendingFiles = files.filter(f => f.endsWith('.event'));
            for (const file of pendingFiles.sort()) {
                const eventPath = path.join(eventsDir, file);
                const content = await fs.readFile(eventPath, 'utf-8');
                const event = JSON.parse(content);
                if (event.claimedBy) {
                    continue;
                }
                event.claimedBy = workerId;
                await fs.writeFile(eventPath, JSON.stringify(event, null, 2));
                console.log(`[LockManager] Claimed event ${file} for ${workerId}`);
                return event;
            }
            return null;
        }
        catch (error) {
            console.error(`[LockManager] Failed to claim event:`, error);
            return null;
        }
    }
    async releaseEvent(eventPath, workerId) {
        const eventsDir = path.join(this.locksDir, 'events');
        try {
            const fullPath = path.join(eventsDir, `${eventPath}.event`);
            if (!(await fs.pathExists(fullPath))) {
                return false;
            }
            const content = await fs.readFile(fullPath, 'utf-8');
            const event = JSON.parse(content);
            if (event.claimedBy !== workerId) {
                console.error(`[LockManager] Cannot release event claimed by ${event.claimedBy}`);
                return false;
            }
            await fs.remove(fullPath);
            console.log(`[LockManager] Released event ${eventPath}`);
            return true;
        }
        catch (error) {
            console.error(`[LockManager] Failed to release event:`, error);
            return false;
        }
    }
    async getClaimedEvents(workerId) {
        const eventsDir = path.join(this.locksDir, 'events');
        const events = [];
        try {
            const files = await fs.readdir(eventsDir);
            for (const file of files) {
                if (file.endsWith('.event')) {
                    const eventPath = path.join(eventsDir, file);
                    const content = await fs.readFile(eventPath, 'utf-8');
                    const event = JSON.parse(content);
                    if (!workerId || event.claimedBy === workerId) {
                        events.push(event);
                    }
                }
            }
        }
        catch {
            // Directory doesn't exist
        }
        return events;
    }
}
exports.LockManager = LockManager;
//# sourceMappingURL=locks.js.map