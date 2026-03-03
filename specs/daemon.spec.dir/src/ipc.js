"use strict";
/**
 * IPC (Inter-Process Communication) for speclangd
 *
 * Generated from: @speclang/daemon/architecture
 *
 * Provides Unix socket or named pipe interface for daemon control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC = void 0;
const events_1 = require("events");
const types_1 = require("./types");
class IPC extends events_1.EventEmitter {
    commandQueue;
    status;
    socketPath;
    constructor(socketPath) {
        super();
        this.commandQueue = [];
        this.socketPath = socketPath || '.speclang/daemon.sock';
        this.status = {
            status: types_1.DaemonStatusKind.Idle,
            cascadeDepth: 0,
            filesChanged: 0,
            activeAgents: 0,
            startedAt: Date.now(),
        };
    }
    /**
     * Queue a command for processing
     */
    sendCommand(command) {
        this.commandQueue.push(command);
        this.emit('command', command);
        console.log(`[IPC] Command received: ${command.kind}`, command.path || '');
    }
    /**
     * Get next command from queue
     */
    getCommand() {
        return this.commandQueue.shift();
    }
    /**
     * Check if there are pending commands
     */
    hasCommands() {
        return this.commandQueue.length > 0;
    }
    /**
     * Update daemon status
     */
    setStatus(status) {
        this.status = { ...this.status, ...status };
        this.emit('status', this.status);
    }
    /**
     * Get current status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Parse command line arguments
     */
    static parseArgs(args) {
        if (args.length === 0)
            return null;
        const cmd = args[0];
        switch (cmd) {
            case 'status':
                return { kind: types_1.DaemonCommandKind.Status };
            case 'pause':
                return { kind: types_1.DaemonCommandKind.Pause };
            case 'resume':
                return { kind: types_1.DaemonCommandKind.Resume };
            case 'abort':
                return { kind: types_1.DaemonCommandKind.Abort };
            case 'trigger':
                if (args[1]) {
                    return { kind: types_1.DaemonCommandKind.Trigger, path: args[1] };
                }
                console.error('[IPC] Error: trigger requires a file path');
                return null;
            case 'converge':
                return { kind: types_1.DaemonCommandKind.Converge };
            default:
                console.error(`[IPC] Unknown command: ${cmd}`);
                return null;
        }
    }
    /**
     * Format status for display
     */
    static formatStatus(status) {
        const lines = [
            '=== Speclangd Status ===',
            `Status: ${status.status}`,
            `Cascade Depth: ${status.cascadeDepth}`,
            `Files Changed: ${status.filesChanged}`,
            `Active Agents: ${status.activeAgents}`,
            `Started: ${new Date(status.startedAt).toISOString()}`,
        ];
        if (status.lastEventAt) {
            lines.push(`Last Event: ${new Date(status.lastEventAt).toISOString()}`);
        }
        if (status.quietSince) {
            lines.push(`Quiet Since: ${new Date(status.quietSince).toISOString()}`);
        }
        if (status.error) {
            lines.push(`Error: ${status.error}`);
        }
        return lines.join('\n');
    }
}
exports.IPC = IPC;
//# sourceMappingURL=ipc.js.map