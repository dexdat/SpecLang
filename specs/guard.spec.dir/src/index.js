"use strict";
/**
 * Guard System - Main Exports
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 *
 * The Guard System enforces file ownership rules to prevent agents
 * from writing to files they don't own.
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWriteInterceptor = exports.WriteInterceptor = exports.createViolationTracker = exports.ViolationTracker = exports.createOverride = exports.createOwnershipRegistry = exports.OwnershipRegistry = void 0;
exports.getGuard = getGuard;
exports.initGuard = initGuard;
exports.resetGuard = resetGuard;
exports.checkOwnership = checkOwnership;
exports.interceptWrite = interceptWrite;
exports.getFileOwner = getFileOwner;
exports.getViolations = getViolations;
exports.getGuardStats = getGuardStats;
// Types
__exportStar(require("./types"), exports);
// Rules
__exportStar(require("./rules"), exports);
// Registry
var registry_1 = require("./registry");
Object.defineProperty(exports, "OwnershipRegistry", { enumerable: true, get: function () { return registry_1.OwnershipRegistry; } });
Object.defineProperty(exports, "createOwnershipRegistry", { enumerable: true, get: function () { return registry_1.createOwnershipRegistry; } });
Object.defineProperty(exports, "createOverride", { enumerable: true, get: function () { return registry_1.createOverride; } });
// Violations
var violations_1 = require("./violations");
Object.defineProperty(exports, "ViolationTracker", { enumerable: true, get: function () { return violations_1.ViolationTracker; } });
Object.defineProperty(exports, "createViolationTracker", { enumerable: true, get: function () { return violations_1.createViolationTracker; } });
// Interceptor
var interceptor_1 = require("./interceptor");
Object.defineProperty(exports, "WriteInterceptor", { enumerable: true, get: function () { return interceptor_1.WriteInterceptor; } });
Object.defineProperty(exports, "createWriteInterceptor", { enumerable: true, get: function () { return interceptor_1.createWriteInterceptor; } });
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
const registry_2 = require("./registry");
const violations_2 = require("./violations");
const interceptor_2 = require("./interceptor");
const rules_1 = require("./rules");
/**
 * Default singleton guard instance
 */
let _guardInstance = null;
/**
 * Get the default guard instance (singleton)
 */
function getGuard() {
    if (!_guardInstance) {
        const registry = new registry_2.OwnershipRegistry(rules_1.DEFAULT_RULES);
        const violations = new violations_2.ViolationTracker();
        _guardInstance = new interceptor_2.WriteInterceptor(registry, violations);
    }
    return _guardInstance;
}
/**
 * Initialize or reset the guard instance
 */
function initGuard(rules, config) {
    const registry = new registry_2.OwnershipRegistry(rules || rules_1.DEFAULT_RULES);
    const violations = new violations_2.ViolationTracker();
    _guardInstance = new interceptor_2.WriteInterceptor(registry, violations, config);
    return _guardInstance;
}
/**
 * Reset the guard instance
 */
function resetGuard() {
    _guardInstance = null;
}
/**
 * Quick ownership check
 */
function checkOwnership(agent, filepath) {
    return getGuard().checkOwnership(agent, filepath).allowed;
}
/**
 * Quick write interception
 */
async function interceptWrite(agent, filepath, content) {
    return getGuard().interceptWrite(agent, filepath, content);
}
/**
 * Get ownership info for a file
 */
function getFileOwner(filepath) {
    return getGuard().getRegistry().getOwner(filepath);
}
/**
 * Get all violations
 */
function getViolations() {
    return getGuard().getViolations();
}
/**
 * Export guard stats
 */
function getGuardStats() {
    return getGuard().getStats();
}
//# sourceMappingURL=index.js.map