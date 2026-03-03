/**
 * IPC (Inter-Process Communication) for speclangd
 *
 * Generated from: @speclang/daemon/architecture
 *
 * Provides Unix socket or named pipe interface for daemon control
 */
import { EventEmitter } from 'events';
import { DaemonCommand, DaemonStatus } from './types';
export declare class IPC extends EventEmitter {
    private commandQueue;
    private status;
    private socketPath;
    constructor(socketPath?: string);
    /**
     * Queue a command for processing
     */
    sendCommand(command: DaemonCommand): void;
    /**
     * Get next command from queue
     */
    getCommand(): DaemonCommand | undefined;
    /**
     * Check if there are pending commands
     */
    hasCommands(): boolean;
    /**
     * Update daemon status
     */
    setStatus(status: Partial<DaemonStatus>): void;
    /**
     * Get current status
     */
    getStatus(): DaemonStatus;
    /**
     * Parse command line arguments
     */
    static parseArgs(args: string[]): DaemonCommand | null;
    /**
     * Format status for display
     */
    static formatStatus(status: DaemonStatus): string;
}
//# sourceMappingURL=ipc.d.ts.map