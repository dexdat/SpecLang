"use strict";
/**
 * Guard System Types
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GUARD_AGENT_ROLES = exports.DEFAULT_GUARD_CONFIG = void 0;
/**
 * Default guard configuration
 */
exports.DEFAULT_GUARD_CONFIG = {
    enabled: true,
    enforceOnOrchestrator: false,
    logViolations: true,
    strictMode: false,
};
/**
 * Agent roles that can be owners
 */
exports.GUARD_AGENT_ROLES = [
    'north-star',
    'spec-writer',
    'code-gen',
    'test-writer',
    'back-sync',
];
//# sourceMappingURL=types.js.map