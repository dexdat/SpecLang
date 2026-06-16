"use strict";
/**
 * SPECLANG-GENERATED: MCP Server Authentication
 * Source: @speclang/mcp
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
exports.MCPAuth = void 0;
exports.createAuth = createAuth;
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
/**
 * Authentication middleware for MCP server
 */
class MCPAuth {
    config;
    apiKeys;
    constructor(config) {
        this.config = config;
        this.apiKeys = new Set(config.apiKeys || []);
        if (config.token) {
            this.apiKeys.add(config.token);
        }
    }
    /**
     * Create Express middleware for authentication
     */
    middleware() {
        if (!this.config.enabled) {
            return (_req, _res, next) => next();
        }
        switch (this.config.type) {
            case 'basic':
                return this.basicAuthMiddleware();
            case 'token':
                return this.tokenAuthMiddleware();
            case 'config_file':
                return this.configFileAuthMiddleware();
            case 'tls_client_cert':
                return this.tlsClientCertAuthMiddleware();
            default:
                return (_req, _res, next) => next();
        }
    }
    /**
     * Basic authentication middleware
     */
    basicAuthMiddleware() {
        const expected = 'Basic ' + Buffer.from(`${this.config.user}:${this.config.pass}`).toString('base64');
        return (req, res, next) => {
            const auth = req.headers.authorization;
            if (auth !== expected) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
                return;
            }
            next();
        };
    }
    /**
     * Token/Bearer authentication middleware
     */
    tokenAuthMiddleware() {
        return (req, res, next) => {
            const auth = req.headers.authorization;
            if (!auth) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing authorization header' });
                return;
            }
            if (!auth.startsWith('Bearer ')) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid authorization format' });
                return;
            }
            const token = auth.slice(7);
            if (!this.apiKeys.has(token)) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
                return;
            }
            next();
        };
    }
    /**
     * Config file based authentication middleware
     */
    configFileAuthMiddleware() {
        const configPath = this.config.configPath || '/etc/speclang/mcp-auth.json';
        let usersConfig = null;
        try {
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf-8');
                usersConfig = JSON.parse(content);
            }
        }
        catch (error) {
            console.error(`Failed to load auth config from ${configPath}:`, error);
        }
        const users = new Map();
        if (usersConfig?.users) {
            for (const user of usersConfig.users) {
                users.set(user.user, { hash: user.hash, permissions: user.permissions });
            }
        }
        return (req, res, next) => {
            const auth = req.headers.authorization;
            if (!auth) {
                res.status(401).json({ error: 'Unauthorized', message: 'Missing authorization header' });
                return;
            }
            if (!auth.startsWith('Basic ')) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid authorization format' });
                return;
            }
            const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
            const [user, pass] = decoded.split(':');
            const userData = users.get(user);
            if (!userData) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
                return;
            }
            const hash = crypto.createHash('sha256').update(pass).digest('hex');
            if (hash !== userData.hash) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
                return;
            }
            req.authUser = user;
            req.authPermissions = userData.permissions;
            next();
        };
    }
    /**
     * TLS client certificate authentication middleware
     */
    tlsClientCertAuthMiddleware() {
        return (req, res, next) => {
            const cert = req.socket?.getPeerCertificate();
            if (!cert || typeof cert !== 'object' || !('subject' in cert)) {
                res.status(401).json({ error: 'Unauthorized', message: 'Client certificate required' });
                return;
            }
            const cn = cert.subject.CN?.[0];
            if (!cn) {
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid certificate subject' });
                return;
            }
            req.authUser = cn;
            next();
        };
    }
    /**
     * Validate API key (for MCP protocol)
     */
    validateApiKey(key) {
        if (!this.config.enabled) {
            return true;
        }
        return this.apiKeys.has(key);
    }
    /**
     * Check if auth is enabled
     */
    isEnabled() {
        return this.config.enabled;
    }
    /**
     * Get auth type
     */
    getType() {
        return this.config.type;
    }
}
exports.MCPAuth = MCPAuth;
/**
 * Create auth instance from config
 */
function createAuth(config) {
    return new MCPAuth(config);
}
//# sourceMappingURL=auth.js.map