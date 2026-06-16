"use strict";
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
exports.AgentInvoker = void 0;
exports.getAgentForTrigger = getAgentForTrigger;
class AgentInvoker {
    verbose;
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    async invoke(options) {
        const timestamp = new Date().toISOString();
        const files_modified = [];
        if (this.verbose) {
            console.log(`[AgentInvoker] Invoking agent: ${options.agent} for trigger: ${options.trigger}`);
        }
        try {
            const result = await this.executeAgent(options.agent, options.trigger, options.params);
            files_modified.push(...result.files);
            return {
                success: result.success,
                agent: options.agent,
                timestamp,
                files_modified
            };
        }
        catch (error) {
            return {
                success: false,
                agent: options.agent,
                timestamp,
                files_modified,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async executeAgent(agent, trigger, params) {
        const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
        try {
            const command = this.buildCommand(agent, trigger, params);
            const output = execSync(command, { encoding: 'utf-8' });
            return {
                success: true,
                files: this.parseOutputFiles(output)
            };
        }
        catch {
            return { success: false, files: [] };
        }
    }
    buildCommand(agent, trigger, params) {
        const paramsStr = params ? ` ${JSON.stringify(params)}` : '';
        return `speclang agent ${agent} --trigger ${trigger}${paramsStr}`;
    }
    parseOutputFiles(output) {
        const files = [];
        const lines = output.split('\n');
        for (const line of lines) {
            const match = line.match(/Created: (.+)/);
            if (match) {
                files.push(match[1]);
            }
        }
        return files;
    }
    createInvocationRecord(result, files) {
        return {
            agent: result.agent,
            timestamp: result.timestamp,
            result: result.success ? 'success' : 'failure',
            files_modified: files
        };
    }
}
exports.AgentInvoker = AgentInvoker;
function getAgentForTrigger(trigger) {
    if (trigger.endsWith('.spec.md') || trigger.endsWith('.spec')) {
        return 'speclang-spec-writer';
    }
    if (trigger.startsWith('src/')) {
        return 'speclang-code-gen';
    }
    if (trigger.startsWith('tests/')) {
        return 'speclang-test-writer';
    }
    return 'speclang-coordinator';
}
//# sourceMappingURL=invocation.js.map