"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidator = void 0;
exports.validateConfig = validateConfig;
class ConfigValidator {
    strict;
    constructor(strict = false) {
        this.strict = strict;
    }
    validate(config) {
        const errors = [];
        const warnings = [];
        this.validateServer(config.server, errors, warnings);
        this.validateAuth(config.auth, errors, warnings);
        this.validateDatabase(config.database, warnings);
        this.validateLimits(config.limits, warnings);
        if (this.strict) {
            this.validateStrict(config, errors, warnings);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    validateServer(server, errors, warnings) {
        const validModes = ['stdio', 'http', 'socket'];
        if (!validModes.includes(server.mode)) {
            errors.push({
                field: 'server.mode',
                message: `Invalid server mode: ${server.mode}. Must be one of: ${validModes.join(', ')}`,
            });
        }
        if (server.mode === 'http' && (!server.port || server.port < 1 || server.port > 65535)) {
            errors.push({
                field: 'server.port',
                message: 'HTTP mode requires a valid port number (1-65535)',
            });
        }
        if (server.host && typeof server.host !== 'string') {
            errors.push({
                field: 'server.host',
                message: 'Server host must be a string',
            });
        }
    }
    validateAuth(auth, errors, warnings) {
        if (!auth) {
            return;
        }
        const validTypes = ['none', 'basic', 'token'];
        if (!validTypes.includes(auth.type)) {
            errors.push({
                field: 'auth.type',
                message: `Invalid auth type: ${auth.type}. Must be one of: ${validTypes.join(', ')}`,
            });
        }
        if (auth.type === 'basic') {
            if (!auth.users || auth.users.length === 0) {
                errors.push({
                    field: 'auth.users',
                    message: 'Basic auth requires at least one user',
                });
            }
            else {
                for (let i = 0; i < auth.users.length; i++) {
                    const user = auth.users[i];
                    if (!user.user) {
                        errors.push({
                            field: `auth.users[${i}].user`,
                            message: 'User must have a username',
                        });
                    }
                    if (!user.pass && !user.hash) {
                        warnings.push(`User "${user.user}" has no password or hash set`);
                    }
                }
            }
        }
        if (auth.type === 'token') {
            if (!auth.tokens || auth.tokens.length === 0) {
                errors.push({
                    field: 'auth.tokens',
                    message: 'Token auth requires at least one token',
                });
            }
        }
    }
    validateDatabase(database, warnings) {
        if (!database.path) {
            return;
        }
        if (database.wal_mode && !database.path.endsWith('.db')) {
            warnings.push('WAL mode is recommended with .db file extension');
        }
        if (database.path.includes('..')) {
            warnings.push('Database path contains ".." which may be a security concern');
        }
    }
    validateLimits(limits, warnings) {
        if (!limits) {
            return;
        }
        if (limits.max_connections < 1) {
            warnings.push('max_connections should be at least 1');
        }
        if (limits.query_timeout_ms < 100) {
            warnings.push('query_timeout_ms below 100ms may be too short');
        }
        if (limits.max_results > 10000) {
            warnings.push('max_results above 10000 may impact memory usage');
        }
    }
    validateStrict(config, errors, warnings) {
        if (config.server.mode === 'socket' && !config.server.host) {
            errors.push({
                field: 'server.host',
                message: 'Socket mode requires a host to be specified in strict mode',
            });
        }
        if (config.logging?.level === 'debug' && config.server.mode === 'http') {
            warnings.push('Debug logging with HTTP server may expose sensitive data');
        }
    }
}
exports.ConfigValidator = ConfigValidator;
function validateConfig(config, strict = false) {
    const validator = new ConfigValidator(strict);
    return validator.validate(config);
}
//# sourceMappingURL=validator.js.map