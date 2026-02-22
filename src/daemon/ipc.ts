/**
 * IPC (Inter-Process Communication) for speclangd
 * 
 * Generated from: @speclang/daemon/architecture
 * 
 * Provides Unix socket or named pipe interface for daemon control
 */

import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DaemonCommand, DaemonCommandKind, DaemonStatus, DaemonStatusKind } from './types';

export class IPC extends EventEmitter {
  private commandQueue: DaemonCommand[];
  private status: DaemonStatus;
  private socketPath: string;

  constructor(socketPath?: string) {
    super();
    this.commandQueue = [];
    this.socketPath = socketPath || '.speclang/daemon.sock';
    
    this.status = {
      status: DaemonStatusKind.Idle,
      cascadeDepth: 0,
      filesChanged: 0,
      activeAgents: 0,
      startedAt: Date.now(),
    };
  }

  /**
   * Queue a command for processing
   */
  sendCommand(command: DaemonCommand): void {
    this.commandQueue.push(command);
    this.emit('command', command);
    console.log(`[IPC] Command received: ${command.kind}`, command.path || '');
  }

  /**
   * Get next command from queue
   */
  getCommand(): DaemonCommand | undefined {
    return this.commandQueue.shift();
  }

  /**
   * Check if there are pending commands
   */
  hasCommands(): boolean {
    return this.commandQueue.length > 0;
  }

  /**
   * Update daemon status
   */
  setStatus(status: Partial<DaemonStatus>): void {
    this.status = { ...this.status, ...status };
    this.emit('status', this.status);
  }

  /**
   * Get current status
   */
  getStatus(): DaemonStatus {
    return { ...this.status };
  }

  /**
   * Parse command line arguments
   */
  static parseArgs(args: string[]): DaemonCommand | null {
    if (args.length === 0) return null;

    const cmd = args[0];

    switch (cmd) {
      case 'status':
        return { kind: DaemonCommandKind.Status };
      case 'pause':
        return { kind: DaemonCommandKind.Pause };
      case 'resume':
        return { kind: DaemonCommandKind.Resume };
      case 'abort':
        return { kind: DaemonCommandKind.Abort };
      case 'trigger':
        if (args[1]) {
          return { kind: DaemonCommandKind.Trigger, path: args[1] };
        }
        console.error('[IPC] Error: trigger requires a file path');
        return null;
      case 'converge':
        return { kind: DaemonCommandKind.Converge };
      default:
        console.error(`[IPC] Unknown command: ${cmd}`);
        return null;
    }
  }

  /**
   * Format status for display
   */
  static formatStatus(status: DaemonStatus): string {
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
