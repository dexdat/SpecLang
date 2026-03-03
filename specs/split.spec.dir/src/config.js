"use strict";
/**
 * SPECLANG-GENERATED: Configuration for dynamic splitting
 * Source: @speclang/dynamic-split/strategy @block:split/config
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
exports.SplitConfigLoader = void 0;
exports.getConfigLoader = getConfigLoader;
exports.loadSplitConfig = loadSplitConfig;
exports.getAgentConfig = getAgentConfig;
const fs = __importStar(require("fs"));
const types_1 = require("./types");
/**
 * Load split configuration from project.scl
 */
class SplitConfigLoader {
    configPath;
    cache = null;
    constructor(configPath = 'project.scl') {
        this.configPath = configPath;
    }
    /**
     * Load configuration from file
     */
    load() {
        if (this.cache) {
            return this.cache;
        }
        if (!fs.existsSync(this.configPath)) {
            // Return defaults if no config file
            return { split: types_1.DEFAULT_SPLIT_CONFIG };
        }
        try {
            const content = fs.readFileSync(this.configPath, 'utf-8');
            const config = this.parseConfig(content);
            this.cache = config;
            return config;
        }
        catch (error) {
            console.warn(`Failed to load config from ${this.configPath}:`, error);
            return { split: types_1.DEFAULT_SPLIT_CONFIG };
        }
    }
    /**
     * Parse YAML config content
     */
    parseConfig(content) {
        // Simple YAML parsing for config
        const config = { split: { ...types_1.DEFAULT_SPLIT_CONFIG } };
        // Extract split config
        const splitMatch = content.match(/config:\s*split:\s*([\s\S]*?)(?:\n\w|$)/);
        if (splitMatch) {
            const splitContent = splitMatch[1];
            const maxTokensMatch = splitContent.match(/max_tokens:\s*(\d+)/);
            if (maxTokensMatch) {
                config.split.max_tokens = parseInt(maxTokensMatch[1], 10);
            }
            const maxLinesMatch = splitContent.match(/max_lines:\s*(\d+)/);
            if (maxLinesMatch) {
                config.split.max_lines = parseInt(maxLinesMatch[1], 10);
            }
            const maxCharsMatch = splitContent.match(/max_chars:\s*(\d+)/);
            if (maxCharsMatch) {
                config.split.max_chars = parseInt(maxCharsMatch[1], 10);
            }
            const budgetOverheadMatch = splitContent.match(/budget_overhead:\s*(\d+)/);
            if (budgetOverheadMatch) {
                config.split.budget_overhead = parseInt(budgetOverheadMatch[1], 10);
            }
            const strategyMatch = splitContent.match(/strategy:\s*(\w+)/);
            if (strategyMatch) {
                config.split.strategy = strategyMatch[1];
            }
        }
        // Extract agent overrides
        const agentsMatch = content.match(/agents:\s*([\s\S]*?)(?:\n\w|$)/);
        if (agentsMatch) {
            config.agents = this.parseAgentConfig(agentsMatch[1]);
        }
        return config;
    }
    /**
     * Parse agent-specific configuration
     */
    parseAgentConfig(agentsContent) {
        const agents = {};
        // Simple extraction of agent configs
        const agentMatches = Array.from(agentsContent.matchAll(/(\w+):\s*([\s\S]*?)(?=\n\s*\w+:|$)/g));
        for (const match of agentMatches) {
            const agentName = match[1];
            const agentConfig = match[2];
            const agent = {};
            const maxTokensMatch = agentConfig.match(/max_tokens:\s*(\d+)/);
            if (maxTokensMatch) {
                agent.max_tokens = parseInt(maxTokensMatch[1], 10);
            }
            const maxLinesMatch = agentConfig.match(/max_lines:\s*(\d+)/);
            if (maxLinesMatch) {
                agent.max_lines = parseInt(maxLinesMatch[1], 10);
            }
            const maxCharsMatch = agentConfig.match(/max_chars:\s*(\d+)/);
            if (maxCharsMatch) {
                agent.max_chars = parseInt(maxCharsMatch[1], 10);
            }
            const budgetOverheadMatch = agentConfig.match(/budget_overhead:\s*(\d+)/);
            if (budgetOverheadMatch) {
                agent.budget_overhead = parseInt(budgetOverheadMatch[1], 10);
            }
            const strategyMatch = agentConfig.match(/strategy:\s*(\w+)/);
            if (strategyMatch) {
                agent.strategy = strategyMatch[1];
            }
            if (Object.keys(agent).length > 0) {
                agents[agentName] = agent;
            }
        }
        return agents;
    }
    /**
     * Get split config
     */
    getSplitConfig() {
        return this.load().split;
    }
    /**
     * Get agent-specific config
     */
    getAgentConfig(agentName) {
        return this.load().agents?.[agentName];
    }
    /**
     * Merge agent config with defaults
     */
    getMergedConfig(agentName) {
        const base = this.getSplitConfig();
        if (!agentName) {
            return base;
        }
        const agent = this.getAgentConfig(agentName);
        if (!agent) {
            return base;
        }
        return {
            max_tokens: agent.max_tokens ?? base.max_tokens,
            max_lines: agent.max_lines ?? base.max_lines,
            max_chars: agent.max_chars ?? base.max_chars,
            budget_overhead: agent.budget_overhead ?? base.budget_overhead,
            strategy: agent.strategy ?? base.strategy,
        };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache = null;
    }
}
exports.SplitConfigLoader = SplitConfigLoader;
/**
 * Default config loader instance
 */
let defaultLoader = null;
/**
 * Get default config loader
 */
function getConfigLoader(configPath) {
    if (!defaultLoader) {
        defaultLoader = new SplitConfigLoader(configPath || 'project.scl');
    }
    return defaultLoader;
}
/**
 * Load split config with defaults
 */
function loadSplitConfig(configPath) {
    const loader = new SplitConfigLoader(configPath || 'project.scl');
    return loader.getSplitConfig();
}
/**
 * Get agent-specific config
 */
function getAgentConfig(agentName, configPath) {
    const loader = new SplitConfigLoader(configPath || 'project.scl');
    return loader.getMergedConfig(agentName);
}
//# sourceMappingURL=config.js.map