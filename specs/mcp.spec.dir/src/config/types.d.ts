export interface MCPConfig {
    database: DatabaseConfig;
    server: ServerConfig;
    auth?: AuthConfig;
    logging?: LoggingConfig;
    limits?: LimitsConfig;
}
export interface DatabaseConfig {
    path: string;
    wal_mode: boolean;
}
export interface ServerConfig {
    mode: 'stdio' | 'http' | 'socket';
    port?: number;
    host: string;
}
export interface AuthConfig {
    type: 'none' | 'basic' | 'token';
    users?: AuthUser[];
    tokens?: string[];
}
export interface AuthUser {
    user: string;
    pass?: string;
    hash?: string;
    permissions: string[];
}
export interface LoggingConfig {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
}
export interface LimitsConfig {
    max_connections: number;
    query_timeout_ms: number;
    max_results: number;
}
export declare const DEFAULT_CONFIG: MCPConfig;
//# sourceMappingURL=types.d.ts.map