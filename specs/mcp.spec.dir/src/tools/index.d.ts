/**
 * SPECLANG-GENERATED: MCP Tools Index
 * Source: @speclang/mcp
 */
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import type { MCPServerConfig } from '../types.js';
import { SearchToolHandler } from './search.js';
import { SpecsToolHandler } from './specs.js';
import { LocksToolHandler } from './locks.js';
import { CascadeToolHandler } from './cascade.js';
import { IndexToolHandler } from './index-tools.js';
import { DashboardToolHandler } from './dashboard.js';
import { CommandsToolHandler } from './commands.js';
/**
 * MCP Tool Registry
 * Registers all MCP tools and handles tool requests
 */
export declare class MCPToolRegistry {
    private db;
    private config;
    search: SearchToolHandler;
    specs: SpecsToolHandler;
    locks: LocksToolHandler;
    cascade: CascadeToolHandler;
    index: IndexToolHandler;
    dashboard: DashboardToolHandler;
    commands: CommandsToolHandler;
    constructor(db: SpecLangDB, config: MCPServerConfig);
    /**
     * Register all tools with the MCP server
     */
    registerTools(server: Server): void;
    /**
     * Handle speclang_get_dependencies - Get dependencies for a spec
     */
    private handleGetDependencies;
    /**
     * Handle speclang_get_dependents - Get dependents for a spec
     */
    private handleGetDependents;
    /**
     * Handle speclang_impact_analysis - Get impact analysis
     */
    private handleImpactAnalysis;
    /**
     * Handle speclang_get_status - Get overall system status
     */
    private handleGetStatus;
}
/**
 * Get all tool definitions for registration
 */
export declare function getToolDefinitions(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            layer: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            limit: {
                type: string;
                default: number;
                description?: undefined;
            };
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            id: {
                type: string;
                description: string;
            };
            file_path: {
                type: string;
                description: string;
            };
            include_content: {
                type: string;
                default: boolean;
            };
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            id: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            agent_id: {
                type: string;
                description: string;
            };
            file_path: {
                type: string;
                description: string;
            };
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            id: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            message: {
                type: string;
                description: string;
            };
            agent_id: {
                type: string;
                description: string;
            };
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description?: undefined;
            };
            layer: {
                type: string;
                description?: undefined;
            };
            prefix: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                default: number;
                description?: undefined;
            };
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            resource: {
                type: string;
                description: string;
            };
            agent_id: {
                type: string;
                description: string;
            };
            ttl: {
                type: string;
                description: string;
                default: number;
            };
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id: {
                type: string;
                description: string;
            };
            agent_id: {
                type: string;
                description: string;
            };
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource: {
                type: string;
                description: string;
            };
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id: {
                type: string;
                description: string;
            };
            change_type: {
                type: string;
                enum: string[];
            };
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id: {
                type: string;
                description?: undefined;
            };
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir: {
                type: string;
                description: string;
            };
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            id: {
                type: string;
                description: string;
            };
            transitive: {
                type: string;
                default: boolean;
            };
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id: {
                type: string;
                description: string;
            };
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            limit: {
                type: string;
                description: string;
                default: number;
            };
            cascade_id: {
                type: string;
                description: string;
            };
            agent: {
                type: string;
                description: string;
            };
            file_pattern: {
                type: string;
                description: string;
            };
            since: {
                type: string;
                description: string;
            };
            agent_type?: undefined;
            types?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                description: string;
                default?: undefined;
                enum?: undefined;
            };
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            limit: {
                type: string;
                description: string;
                default: number;
            };
            types?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            status: {
                type: string;
                description: string;
                default: string;
                enum?: undefined;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            cascade_id: {
                type: string;
                description: string;
            };
            session_id: {
                type: string;
                description: string;
            };
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id: {
                type: string;
                description: string;
            };
            action: {
                type: string;
                description: string;
            };
            target_file: {
                type: string;
                description: string;
            };
            session_id: {
                type: string;
                description: string;
            };
            payload: {
                type: string;
                description: string;
            };
            priority: {
                type: string;
                description: string;
                default: number;
            };
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id: {
                type: string;
                description: string;
            };
            status: {
                default?: undefined;
                type: string;
                enum: string[];
                description: string;
            };
            error: {
                type: string;
                description: string;
            };
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id: {
                type: string;
                description: string;
            };
            olderThan?: undefined;
            commands?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan: {
                type: string;
                description: string;
            };
            commands?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            file_path?: undefined;
            content?: undefined;
            message?: undefined;
            tags?: undefined;
            layer?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            agent_id?: undefined;
            resource?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            id?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            limit?: undefined;
            cascade_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            session_id?: undefined;
            payload?: undefined;
            priority?: undefined;
            status?: undefined;
            error?: undefined;
            command_id?: undefined;
            olderThan?: undefined;
            commands: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        cascade_id: {
                            type: string;
                        };
                        action: {
                            type: string;
                        };
                        target_file: {
                            type: string;
                        };
                        priority: {
                            type: string;
                        };
                    };
                };
                description: string;
            };
        };
        required: string[];
    };
})[];
//# sourceMappingURL=index.d.ts.map