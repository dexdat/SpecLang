/**
 * Daemon CLI commands
 *
 * Generated from: @speclang/daemon
 */
import { Command } from 'commander';
/**
 * Daemon start options
 */
export interface DaemonStartOptions {
    projectDir?: string;
    port?: number;
    dashboard?: boolean;
    foreground?: boolean;
}
/**
 * Daemon stop options
 */
export interface DaemonStopOptions {
    pid?: number;
}
/**
 * Daemon status options
 */
export interface DaemonStatusOptions {
    json?: boolean;
}
/**
 * Start the daemon
 */
export declare function daemonStartCommand(options: DaemonStartOptions): Promise<void>;
/**
 * Stop the daemon
 */
export declare function daemonStopCommand(options: DaemonStopOptions): Promise<void>;
/**
 * Get daemon status
 */
export declare function daemonStatusCommand(options: DaemonStatusOptions): Promise<void>;
/**
 * Configure daemon command
 */
export declare function configureDaemonCommand(program: Command): void;
//# sourceMappingURL=daemon-cli.d.ts.map