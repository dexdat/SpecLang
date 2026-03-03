import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
export interface OpenAPIGenerateInput {
    input: string;
    output: string;
    transport?: 'stdio' | 'web' | 'streamable-http';
    port?: number;
    serverName?: string;
    baseUrl?: string;
    force?: boolean;
    register?: boolean;
}
export interface OpenAPIGenerateResult {
    success: boolean;
    serverPath?: string;
    toolsGenerated?: number;
    message: string;
}
export interface OpenAPIValidateInput {
    spec: string;
}
export interface OpenAPIValidateResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    info?: {
        title?: string;
        version?: string;
        operations?: number;
    };
}
export interface OpenAPIRegisterInput {
    serverPath: string;
    transport?: 'stdio' | 'web' | 'streamable-http';
    port?: number;
}
export interface OpenAPIRegisterResult {
    success: boolean;
    serverId?: string;
    tools?: string[];
    message: string;
}
export declare class OpenAPIToolHandler {
    private db;
    private config;
    constructor(db: SpecLangDB, config?: Partial<{
        outputBase: string;
        transport: string;
        port: number;
    }>);
    handleValidate(args: OpenAPIValidateInput): Promise<OpenAPIValidateResult>;
    handleGenerate(args: OpenAPIGenerateInput): Promise<OpenAPIGenerateResult>;
    private createLocalMCPServer;
    handleRegister(args: OpenAPIRegisterInput): Promise<OpenAPIRegisterResult>;
    handleListServers(): Promise<{
        servers: Array<{
            id: string;
            path: string;
            transport: string;
            port: number;
            status: string;
        }>;
    }>;
    handleUnregister(args: {
        serverId: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=openapi.d.ts.map