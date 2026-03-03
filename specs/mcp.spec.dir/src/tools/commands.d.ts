/**
 * SPECLANG-GENERATED: MCP Command Queue Tools
 * Source: @speclang/mcp
 */
import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import type { CommandInput, QueryCommandsInput, QueuedCommand, StatusResult } from '../types.js';
/**
 * Command queue tool handler
 */
export declare class CommandsToolHandler {
    private db;
    constructor(db: SpecLangDB);
    /**
     * Handle speclang_get_status - Get current cascade and queue status
     */
    handleGetStatus(): Promise<StatusResult>;
    /**
     * Handle speclang_query_commands - Query commands from the queue
     */
    handleQueryCommands(args: QueryCommandsInput): Promise<QueuedCommand[]>;
    /**
     * Handle speclang_insert_command - Insert a command into the queue
     */
    handleInsertCommand(args: CommandInput): Promise<{
        command_id: string;
    }>;
    /**
     * Handle speclang_update_command - Update command status
     */
    handleUpdateCommand(args: {
        command_id: string;
        status: 'pending' | 'running' | 'completed' | 'failed';
        error?: string;
    }): Promise<{
        updated: boolean;
    }>;
    /**
     * Handle speclang_delete_command - Delete a command
     */
    handleDeleteCommand(args: {
        command_id: string;
    }): Promise<{
        deleted: boolean;
    }>;
    /**
     * Handle speclang_get_next_command - Get next pending command
     */
    handleGetNextCommand(): Promise<QueuedCommand | null>;
    /**
     * Handle speclang_clear_completed - Clear completed/failed commands
     */
    handleClearCompleted(args: {
        olderThan?: number;
    }): Promise<{
        cleared: number;
    }>;
    /**
     * Handle speclang_batch_insert - Insert multiple commands
     */
    handleBatchInsert(args: {
        commands: Array<{
            cascade_id: string;
            action: string;
            target_file?: string;
            priority?: number;
        }>;
    }): Promise<{
        command_ids: string[];
    }>;
}
//# sourceMappingURL=commands.d.ts.map