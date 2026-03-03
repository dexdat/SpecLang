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
exports.ConfigLoader = void 0;
exports.applyEnvOverrides = applyEnvOverrides;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("./types");
class ConfigLoader {
    configPath;
    constructor(configPath) {
        this.configPath = configPath || this.findConfigFile();
    }
    getConfigPath() {
        return this.configPath;
    }
    findConfigFile() {
        const candidates = [
            '.speclang/mcp.json',
            '.speclang/mcp.yaml',
            'mcp.json',
            'mcp.yaml',
        ];
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }
        return '.speclang/mcp.json';
    }
    load() {
        if (!fs.existsSync(this.configPath)) {
            return { ...types_1.DEFAULT_CONFIG };
        }
        const content = fs.readFileSync(this.configPath, 'utf-8');
        let parsed;
        if (this.configPath.endsWith('.yaml') || this.configPath.endsWith('.yml')) {
            const yaml = require('js-yaml');
            parsed = yaml.load(content);
        }
        else {
            parsed = JSON.parse(content);
        }
        return this.mergeWithDefaults(parsed);
    }
    mergeWithDefaults(partial) {
        return {
            database: {
                ...types_1.DEFAULT_CONFIG.database,
                ...partial.database,
            },
            server: {
                ...types_1.DEFAULT_CONFIG.server,
                ...partial.server,
            },
            auth: partial.auth
                ? {
                    type: partial.auth.type || 'none',
                    ...partial.auth,
                }
                : undefined,
            logging: {
                ...types_1.DEFAULT_CONFIG.logging,
                ...partial.logging,
            },
            limits: {
                ...types_1.DEFAULT_CONFIG.limits,
                ...partial.limits,
            },
        };
    }
    save(config) {
        const dir = path.dirname(this.configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const content = JSON.stringify(config, null, 2);
        fs.writeFileSync(this.configPath, content);
    }
    validate(config) {
        const errors = [];
        const warnings = [];
        if (config.server.mode === 'http' && !config.server.port) {
            errors.push('HTTP mode requires port to be specified');
        }
        if (config.auth?.type === 'basic' && !config.auth.users?.length) {
            errors.push('Basic auth requires at least one user');
        }
        if (config.auth?.type === 'token' && !config.auth.tokens?.length) {
            errors.push('Token auth requires at least one token');
        }
        if (config.database.wal_mode && !config.database.path.endsWith('.db')) {
            warnings.push('WAL mode recommended with .db extension');
        }
        if (config.limits && config.limits.max_results > 10000) {
            warnings.push('Large max_results may impact memory usage');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
}
exports.ConfigLoader = ConfigLoader;
function applyEnvOverrides(config) {
    const env = process.env;
    if (env.MCP_DB_PATH) {
        config.database.path = env.MCP_DB_PATH;
    }
    if (env.MCP_SERVER_MODE) {
        config.server.mode = env.MCP_SERVER_MODE;
    }
    if (env.MCP_SERVER_PORT) {
        config.server.port = parseInt(env.MCP_SERVER_PORT, 10);
    }
    if (env.MCP_SERVER_HOST) {
        config.server.host = env.MCP_SERVER_HOST;
    }
    if (env.MCP_LOG_LEVEL) {
        config.logging = config.logging || { level: 'info' };
        config.logging.level = env.MCP_LOG_LEVEL;
    }
    if (env.MCP_AUTH_TOKEN) {
        config.auth = { type: 'token', tokens: [env.MCP_AUTH_TOKEN] };
    }
    return config;
}
//# sourceMappingURL=loader.js.map