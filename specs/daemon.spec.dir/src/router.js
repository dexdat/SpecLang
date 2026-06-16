"use strict";
/**
 * Event router for speclangd - Maps file changes to responsible agents
 *
 * Generated from: @speclang/daemon/routing
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
exports.Router = void 0;
const events_1 = require("events");
const path = __importStar(require("path"));
const types_1 = require("./types");
class Router extends events_1.EventEmitter {
    rules;
    agentSessions;
    cascadeDepth;
    constructor() {
        super();
        this.rules = this.initializeRules();
        this.agentSessions = new Map();
        this.cascadeDepth = 0;
    }
    /**
     * Initialize routing rules from spec
     */
    initializeRules() {
        return [
            {
                // project.scl → NorthStarAgent
                pattern: /project\.scl$/,
                agent: 'northstar',
                taskKind: types_1.AgentTaskKind.SpecWriter,
            },
            {
                // specs/**/*.scl → SpecAgent
                pattern: /specs\/.*\.scl$/,
                agent: 'spec-agent',
                taskKind: types_1.AgentTaskKind.SpecWriter,
            },
            {
                // specs/**/*.spec.md → SpecAgent
                pattern: /specs\/.*\.spec\.md$/,
                agent: 'spec-agent',
                taskKind: types_1.AgentTaskKind.SpecWriter,
            },
            {
                // specs/**/*.spec.yaml → SpecAgent
                pattern: /specs\/.*\.spec\.(yaml|yml)$/,
                agent: 'spec-agent',
                taskKind: types_1.AgentTaskKind.SpecWriter,
            },
            {
                // tests/**/*.test.spec.scl → TestAgent
                pattern: /tests\/.*\.test\.spec\.scl$/,
                agent: 'test-agent',
                taskKind: types_1.AgentTaskKind.TestWriter,
            },
            {
                // generated/**/*.go → CodeAgent-Go
                pattern: /generated\/.*\.go$/,
                agent: 'code-agent-go',
                taskKind: types_1.AgentTaskKind.CodeGen,
            },
            {
                // generated/**/*.ts → CodeAgent-TS
                pattern: /generated\/.*\.ts$/,
                agent: 'code-agent-ts',
                taskKind: types_1.AgentTaskKind.CodeGen,
            },
            {
                // generated/**/*.js → CodeAgent-JS
                pattern: /generated\/.*\.js$/,
                agent: 'code-agent-js',
                taskKind: types_1.AgentTaskKind.CodeGen,
            },
            {
                // generated/**/*.py → CodeAgent-Python
                pattern: /generated\/.*\.py$/,
                agent: 'code-agent-python',
                taskKind: types_1.AgentTaskKind.CodeGen,
            },
            {
                // generated/**/*.rs → CodeAgent-Rust
                pattern: /generated\/.*\.rs$/,
                agent: 'code-agent-rust',
                taskKind: types_1.AgentTaskKind.CodeGen,
            },
        ];
    }
    /**
     * Route a file event to the responsible agent
     */
    route(event) {
        const filePath = event.path.replace(/\\/g, '/');
        // Find matching rule
        for (const rule of this.rules) {
            if (rule.pattern.test(filePath)) {
                const task = {
                    kind: rule.taskKind,
                    trigger: event.path,
                    spec: this.extractSpecPath(event.path),
                    target: this.extractTargetPath(event.path),
                };
                // Increment cascade depth for non-spec files
                if (event.path.includes('generated/')) {
                    this.cascadeDepth++;
                }
                this.emit('route', {
                    event,
                    task,
                    agent: rule.agent,
                });
                return task;
            }
        }
        // No matching rule - check if it's a human edit in generated/
        if (filePath.includes('generated/')) {
            return {
                kind: types_1.AgentTaskKind.BackSync,
                trigger: event.path,
                code: event.path,
            };
        }
        return null;
    }
    /**
     * Extract spec path from file path
     */
    extractSpecPath(filePath) {
        // For generated files, find corresponding spec
        const normalized = filePath.replace(/\\/g, '/');
        // Look for .spec.* in path
        const specMatch = normalized.match(/(.*)\.(spec\.[^.]+)$/);
        if (specMatch) {
            return specMatch[1];
        }
        // Look in specs/ directory
        if (normalized.includes('generated/')) {
            const baseName = path.basename(normalized, path.extname(normalized));
            return `specs/${baseName}`;
        }
        return filePath;
    }
    /**
     * Extract target path from file path
     */
    extractTargetPath(filePath) {
        // For specs, determine output location
        const normalized = filePath.replace(/\\/g, '/');
        if (normalized.startsWith('specs/')) {
            return normalized.replace('specs/', 'generated/');
        }
        return filePath;
    }
    /**
     * Register an agent session
     */
    registerAgent(agentId, session) {
        this.agentSessions.set(agentId, session);
        console.log(`[Router] Registered agent: ${agentId}`);
    }
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId) {
        this.agentSessions.delete(agentId);
        console.log(`[Router] Unregistered agent: ${agentId}`);
    }
    /**
     * Get current cascade depth
     */
    getCascadeDepth() {
        return this.cascadeDepth;
    }
    /**
     * Reset cascade depth
     */
    resetCascadeDepth() {
        this.cascadeDepth = 0;
    }
    /**
     * Get agent for a task
     */
    getAgentForTask(task) {
        switch (task.kind) {
            case types_1.AgentTaskKind.SpecWriter:
                return 'spec-agent';
            case types_1.AgentTaskKind.CodeGen:
                return this.getCodeAgentForTarget(task.target || '');
            case types_1.AgentTaskKind.TestWriter:
                return 'test-agent';
            case types_1.AgentTaskKind.BackSync:
                return 'backsync-agent';
            default:
                return 'unknown';
        }
    }
    getCodeAgentForTarget(target) {
        if (target.endsWith('.go'))
            return 'code-agent-go';
        if (target.endsWith('.ts'))
            return 'code-agent-ts';
        if (target.endsWith('.js'))
            return 'code-agent-js';
        if (target.endsWith('.py'))
            return 'code-agent-python';
        if (target.endsWith('.rs'))
            return 'code-agent-rust';
        return 'code-agent';
    }
}
exports.Router = Router;
//# sourceMappingURL=router.js.map