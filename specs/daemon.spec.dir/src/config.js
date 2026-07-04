"use strict";
/**
 * Configuration management for speclangd
 *
 * Generated from: @speclang/daemon/architecture
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
exports.Config = void 0;
exports.loadConfig = loadConfig;
exports.getConfig = getConfig;
const fs = __importStar(require("fs-extra"));
const yaml = __importStar(require("yaml"));
const DEFAULT_CONFIG = {
    watch: {
        paths: ['specs/', 'tests/', 'generated/'],
        ignore: ['.git/', 'node_modules/', 'generated/', '.speclang/', '*.log'],
        debounce: 100,
    },
    convergence: {
        quietPeriod: 30, // seconds
        maxDepth: 100,
        testOnConverge: true,
        autoCommit: false,
        autoRecascade: true, // ARCH-004: daemon stays armed for the next cascade
    },
    agentApi: {
        port: 7777,
        host: 'localhost',
    },
    locks: {
        dir: '.speclang/locks',
        timeout: 30,
    },
    logging: {
        level: 'info',
        file: '.speclang/daemon.log',
    },
};
class Config {
    config;
    configPath;
    constructor(configPath) {
        this.configPath = configPath || '.speclangrc';
        this.config = { ...DEFAULT_CONFIG };
    }
    async load() {
        try {
            if (await fs.pathExists(this.configPath)) {
                const content = await fs.readFile(this.configPath, 'utf-8');
                const loaded = yaml.parse(content);
                this.config = this.mergeConfig(DEFAULT_CONFIG, loaded);
            }
        }
        catch (error) {
            console.warn(`Failed to load config from ${this.configPath}:`, error);
        }
        return this.config;
    }
    mergeConfig(defaults, loaded) {
        return {
            watch: { ...defaults.watch, ...loaded.watch },
            convergence: { ...defaults.convergence, ...loaded.convergence },
            agentApi: { ...defaults.agentApi, ...loaded.agentApi },
            locks: { ...defaults.locks, ...loaded.locks },
            logging: { ...defaults.logging, ...loaded.logging },
        };
    }
    get() {
        return this.config;
    }
    getWatchPaths() {
        return this.config.watch.paths;
    }
    getIgnorePatterns() {
        return this.config.watch.ignore;
    }
    getQuietPeriod() {
        return this.config.convergence.quietPeriod;
    }
    getMaxDepth() {
        return this.config.convergence.maxDepth;
    }
    getLockDir() {
        return this.config.locks.dir;
    }
    getLockTimeout() {
        return this.config.locks.timeout;
    }
    async save() {
        await fs.ensureFile(this.configPath);
        await fs.writeFile(this.configPath, yaml.stringify(this.config), 'utf-8');
    }
}
exports.Config = Config;
// Singleton instance
let configInstance = null;
async function loadConfig(configPath) {
    if (!configInstance) {
        configInstance = new Config(configPath);
        await configInstance.load();
    }
    return configInstance;
}
function getConfig() {
    return configInstance;
}
//# sourceMappingURL=config.js.map