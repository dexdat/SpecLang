"use strict";
/**
 * Pipeline Configuration Management
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/build
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
exports.PipelineConfigManager = void 0;
exports.loadPipelineConfig = loadPipelineConfig;
exports.getPipelineConfig = getPipelineConfig;
const fs = __importStar(require("fs-extra"));
const yaml = __importStar(require("yaml"));
const DEFAULT_PIPELINE_CONFIG = {
    convergence: {
        quiet_period: 30,
        max_iterations: 100,
    },
    pipeline: {
        on_converge: [],
        on_success: [],
    },
    recovery: {
        max_attempts: 3,
        on_fail: [],
    },
};
class PipelineConfigManager {
    config;
    configPath;
    constructor(configPath) {
        this.configPath = configPath || 'build.yaml';
        this.config = { ...DEFAULT_PIPELINE_CONFIG };
    }
    async load() {
        try {
            if (await fs.pathExists(this.configPath)) {
                const content = await fs.readFile(this.configPath, 'utf-8');
                const loaded = yaml.parse(content);
                this.config = this.mergeConfig(DEFAULT_PIPELINE_CONFIG, loaded);
                console.log(`[Pipeline] Loaded config from ${this.configPath}`);
            }
            else {
                console.log(`[Pipeline] No config file found at ${this.configPath}, using defaults`);
            }
        }
        catch (error) {
            console.warn(`[Pipeline] Failed to load config from ${this.configPath}:`, error);
        }
        return this.config;
    }
    mergeConfig(defaults, loaded) {
        return {
            convergence: { ...defaults.convergence, ...loaded.convergence },
            pipeline: {
                on_converge: loaded.pipeline?.on_converge || defaults.pipeline.on_converge,
                on_success: loaded.pipeline?.on_success || defaults.pipeline.on_success,
            },
            recovery: {
                max_attempts: loaded.recovery?.max_attempts ?? defaults.recovery.max_attempts,
                on_fail: loaded.recovery?.on_fail || defaults.recovery.on_fail,
            },
        };
    }
    get() {
        return this.config;
    }
    getPipelineStages() {
        return this.config.pipeline.on_converge;
    }
    getSuccessActions() {
        return this.config.pipeline.on_success;
    }
    getRecoveryActions() {
        return this.config.recovery.on_fail;
    }
    getMaxRecoveryAttempts() {
        return this.config.recovery.max_attempts;
    }
    async save(config) {
        const toSave = config ? this.mergeConfig(DEFAULT_PIPELINE_CONFIG, config) : this.config;
        await fs.ensureFile(this.configPath);
        await fs.writeFile(this.configPath, yaml.stringify(toSave), 'utf-8');
    }
    validate() {
        const errors = [];
        const stages = this.config.pipeline.on_converge;
        // Validate stage dependencies
        const stageNames = new Set(stages.map(s => s.name));
        for (const stage of stages) {
            if (stage.depends_on) {
                for (const dep of stage.depends_on) {
                    if (!stageNames.has(dep)) {
                        errors.push(`Stage '${stage.name}' depends on non-existent stage '${dep}'`);
                    }
                }
            }
        }
        // Check for circular dependencies
        if (this.hasCircularDependency(stages)) {
            errors.push('Circular dependency detected in stage depends_on');
        }
        return { valid: errors.length === 0, errors };
    }
    hasCircularDependency(stages) {
        const graph = new Map();
        for (const stage of stages) {
            graph.set(stage.name, stage.depends_on || []);
        }
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (node) => {
            visited.add(node);
            recursionStack.add(node);
            const neighbors = graph.get(node) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (dfs(neighbor))
                        return true;
                }
                else if (recursionStack.has(neighbor)) {
                    return true;
                }
            }
            recursionStack.delete(node);
            return false;
        };
        for (const stage of stages) {
            if (!visited.has(stage.name)) {
                if (dfs(stage.name))
                    return true;
            }
        }
        return false;
    }
}
exports.PipelineConfigManager = PipelineConfigManager;
// Singleton instance
let configInstance = null;
async function loadPipelineConfig(configPath) {
    if (!configInstance) {
        configInstance = new PipelineConfigManager(configPath);
        await configInstance.load();
    }
    return configInstance;
}
function getPipelineConfig() {
    return configInstance;
}
//# sourceMappingURL=config.js.map