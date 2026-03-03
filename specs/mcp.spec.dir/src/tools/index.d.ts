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
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            include_content?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            message?: undefined;
            prefix?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            lock_id: {
                type: string;
                description: string;
            };
            agent_id: {
                type: string;
                description: string;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            resource: {
                type: string;
                description: string;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            spec_id: {
                type: string;
                description: string;
            };
            change_type: {
                type: string;
                enum: string[];
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            cascade_id: {
                type: string;
                description?: undefined;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            specsDir: {
                type: string;
                description: string;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            id: {
                type: string;
                description: string;
            };
            transitive: {
                type: string;
                default: boolean;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            id: {
                type: string;
                description: string;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            limit: {
                type: string;
                description: string;
                default: number;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            types: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            command_id: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
                default?: undefined;
            };
            error: {
                type: string;
                description: string;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
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
            command_id: {
                type: string;
                description: string;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            error?: undefined;
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
            olderThan: {
                type: string;
                description: string;
            };
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
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
            query?: undefined;
            tags?: undefined;
            layer?: undefined;
            limit?: undefined;
            query_embedding?: undefined;
            id?: undefined;
            file_path?: undefined;
            include_content?: undefined;
            content?: undefined;
            agent_id?: undefined;
            message?: undefined;
            prefix?: undefined;
            resource?: undefined;
            ttl?: undefined;
            lock_id?: undefined;
            spec_id?: undefined;
            change_type?: undefined;
            cascade_id?: undefined;
            specsDir?: undefined;
            transitive?: undefined;
            agent?: undefined;
            file_pattern?: undefined;
            since?: undefined;
            agent_type?: undefined;
            status?: undefined;
            types?: undefined;
            session_id?: undefined;
            action?: undefined;
            target_file?: undefined;
            payload?: undefined;
            priority?: undefined;
            command_id?: undefined;
            error?: undefined;
            olderThan?: undefined;
        };
        required: string[];
    };
})[];
//# sourceMappingURL=index.d.ts.map