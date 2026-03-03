"use strict";
/**
 * Type definitions for Agent Session Manager
 *
 * Generated from: @speclang/agent-protocol
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONCURRENCY_CONFIG = exports.AGENT_DESCRIPTIONS = exports.AGENT_DISPLAY_NAMES = exports.DEFAULT_OWNERSHIP_RULES = void 0;
// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================
/** Default ownership rules */
exports.DEFAULT_OWNERSHIP_RULES = [
    { agent: 'north-star', patterns: ['project.scl'], priority: 100 },
    { agent: 'spec-writer', patterns: ['specs/**/*.scl', 'specs/**/*.spec.*'], priority: 50 },
    { agent: 'code-gen', patterns: ['src/**/*.{ts,js,go,py,rs,java}'], priority: 40 },
    { agent: 'test-writer', patterns: ['tests/**/*'], priority: 30 },
    { agent: 'back-sync', patterns: ['generated/**/*', 'src/**/*.{ts,js,go,py,rs,java}'], priority: 20 },
    { agent: 'pipeline', patterns: ['.github/**/*', 'Dockerfile*', '*.yml', '*.yaml'], priority: 10 },
];
/** Agent role to display name */
exports.AGENT_DISPLAY_NAMES = {
    'north-star': 'North Star',
    'spec-writer': 'Spec Writer',
    'code-gen': 'Code Generator',
    'test-writer': 'Test Writer',
    'back-sync': 'Back Sync',
    'pipeline': 'Pipeline',
};
/** Agent role descriptions */
exports.AGENT_DESCRIPTIONS = {
    'north-star': 'Coordinates overall project direction and intent',
    'spec-writer': 'Expands high-level specs into detailed specifications',
    'code-gen': 'Generates implementation code from specs',
    'test-writer': 'Writes and maintains test specifications',
    'back-sync': 'Synchronizes code changes back to specs',
    'pipeline': 'Executes build, test, and deployment workflows',
};
/** Default concurrency limits */
exports.DEFAULT_CONCURRENCY_CONFIG = {
    maxConcurrentAgents: 50,
    maxFileChangesPerCascade: 100,
    lockTimeoutMs: 5000,
    agentIdleTimeoutMs: 60000,
};
//# sourceMappingURL=types.js.map