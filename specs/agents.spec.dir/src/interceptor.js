"use strict";
/**
 * Write Interceptor - Guard system for agent file writes
 *
 * Generated from: @speclang/agent-protocol @block:writeinterceptor
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
exports.WriteInterceptor = void 0;
exports.createWriteInterceptor = createWriteInterceptor;
exports.initGuard = initGuard;
exports.getGuard = getGuard;
exports.resetGuard = resetGuard;
exports.checkOwnership = checkOwnership;
exports.interceptWrite = interceptWrite;
exports.getFileOwner = getFileOwner;
exports.getViolations = getViolations;
exports.getGuardStats = getGuardStats;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const ownership_1 = require("./ownership");
const violations_1 = require("./violations");
const DEFAULT_CONFIG = {
    enabled: true,
    allowUserWrites: true,
    whitelistRoles: new Set(['pipeline']),
    projectRoot: process.cwd(),
};
let globalInterceptor = null;
let globalOwnership = null;
let globalViolations = null;
let globalConfig = { ...DEFAULT_CONFIG };
class WriteInterceptor {
    ownership;
    violations;
    config;
    constructor(ownership, violations, config) {
        this.ownership = ownership;
        this.violations = violations;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Check if a write is allowed
     */
    checkWrite(agentId, agentRole, filepath) {
        if (!this.config.enabled) {
            return { allowed: true };
        }
        if (this.config.allowUserWrites && this.isUserSession(agentRole)) {
            return { allowed: true, owner: agentRole };
        }
        const check = this.ownership.canWrite(agentId, agentRole, filepath);
        if (!check.allowed) {
            this.violations.record({
                agentId,
                agentRole,
                filepath,
                action: 'write_attempt_denied',
                reason: check.reason || 'Ownership check failed',
                timestamp: Date.now(),
            });
        }
        return check;
    }
    /**
     * Intercept a write operation
     */
    async interceptWrite(agentId, agentRole, filepath, content) {
        const check = this.checkWrite(agentId, agentRole, filepath);
        if (!check.allowed) {
            return {
                success: false,
                filepath,
                error: check.reason,
            };
        }
        try {
            await fs.ensureDir(path.dirname(filepath));
            await fs.writeFile(filepath, content, 'utf-8');
            return { success: true, filepath };
        }
        catch (error) {
            return {
                success: false,
                filepath,
                error: error.message,
            };
        }
    }
    /**
     * Check if role is whitelisted (user sessions)
     */
    isUserSession(role) {
        return !this.config.whitelistRoles.has(role);
    }
    /**
     * Get current config
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get stats
     */
    getStats() {
        const stats = this.violations.getStats();
        return {
            totalAttempts: stats.total,
            denied: stats.unresolved,
            allowed: stats.total - stats.unresolved,
        };
    }
}
exports.WriteInterceptor = WriteInterceptor;
function createWriteInterceptor(ownership, violations, config) {
    return new WriteInterceptor(ownership, violations, config);
}
function initGuard(ownership, violations, config) {
    globalOwnership = ownership || new ownership_1.OwnershipRegistry();
    globalViolations = violations || new violations_1.ViolationTracker();
    globalInterceptor = new WriteInterceptor(globalOwnership, globalViolations, config);
}
function getGuard() {
    if (!globalInterceptor) {
        initGuard();
    }
    return globalInterceptor;
}
function resetGuard() {
    globalInterceptor = null;
    globalOwnership = null;
    globalViolations = null;
    globalConfig = { ...DEFAULT_CONFIG };
}
function checkOwnership(agent, filepath) {
    const guard = getGuard();
    const check = guard.checkWrite('', agent, filepath);
    return check.allowed;
}
async function interceptWrite(agentId, agentRole, filepath, content) {
    const guard = getGuard();
    return guard.interceptWrite(agentId, agentRole, filepath, content);
}
function getFileOwner(filepath) {
    const ownership = globalOwnership || new ownership_1.OwnershipRegistry();
    return ownership.getOwner(filepath);
}
function getViolations() {
    return globalViolations?.getViolations() || [];
}
function getGuardStats() {
    return globalInterceptor?.getStats() || { totalAttempts: 0, denied: 0, allowed: 0 };
}
//# sourceMappingURL=interceptor.js.map