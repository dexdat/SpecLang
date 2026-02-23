/**
 * SPECLANG-GENERATED: Server command
 * Source: @speclang/mcp.cli
 */

import * as fs from 'fs';
import * as path from 'path';
import { MCPServer } from '../../mcp/server.js';
import { getDbPath, ensureSpeclangDir } from '../utils.js';

export interface ServerOptions {
  port?: number;
  daemon?: boolean;
  http?: boolean;
  remote?: boolean;
  auth?: 'none' | 'basic' | 'token';
  user?: string;
  pass?: string;
  token?: string;
  config?: string;
  json?: boolean;
}

const PID_FILE = '.speclang/mcp.pid';
const STATUS_FILE = '.speclang/mcp.status';

function getPidPath(): string {
  return getDbPath().replace('.speclang.db', '') + '/' + PID_FILE;
}

function getStatusPath(): string {
  return getDbPath().replace('.speclang.db', '') + '/' + STATUS_FILE;
}

function writePid(pid: number): void {
  const pidPath = getPidPath();
  const dir = path.dirname(pidPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(pidPath, pid.toString());
}

function removePid(): void {
  try {
    const pidPath = getPidPath();
    if (fs.existsSync(pidPath)) {
      fs.unlinkSync(pidPath);
    }
  } catch {}
}

function writeStatus(status: object): void {
  const statusPath = getStatusPath();
  const dir = path.dirname(statusPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}

function removeStatus(): void {
  try {
    const statusPath = getStatusPath();
    if (fs.existsSync(statusPath)) {
      fs.unlinkSync(statusPath);
    }
  } catch {}
}

function readPid(): number | null {
  try {
    const pidPath = getPidPath();
    if (fs.existsSync(pidPath)) {
      return parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
    }
  } catch {}
  return null;
}

/**
 * Server command implementation
 */
export async function serverCommand(options: ServerOptions): Promise<void> {
  ensureSpeclangDir();
  
  const port = options.port || 3000;
  const mode = options.daemon ? 'daemon' : options.http || options.remote ? 'http' : 'stdio';
  
  if (!options.json) {
    console.log(`=== SpecLang MCP Server ===\n`);
    console.log(`Mode: ${mode}`);
    console.log(`Port: ${port}`);
    if (options.auth && options.auth !== 'none') {
      console.log(`Auth: ${options.auth}`);
    }
    console.log(`Database: ${getDbPath()}\n`);
  }
  
  // Check if daemon already running
  if (options.daemon) {
    const existingPid = readPid();
    if (existingPid) {
      try {
        process.kill(existingPid, 0);
        if (!options.json) {
          console.error('Daemon already running (PID:', existingPid, ')');
        } else {
          console.log(JSON.stringify({ error: true, message: 'Daemon already running', pid: existingPid }));
        }
        process.exit(1);
      } catch {
        removePid();
      }
    }
  }
  
  const server = new MCPServer({
    port,
    database: getDbPath(),
    auth: {
      enabled: options.auth !== undefined && options.auth !== 'none',
      type: options.auth || 'none',
      user: options.user,
      pass: options.pass,
      token: options.token
    }
  });
  
  try {
    if (options.http || options.remote) {
      if (!options.json) {
        console.log(`Starting server on http://localhost:${port}...`);
      }
      await server.startHTTP(port);
    } else {
      if (!options.json) {
        console.log('Starting server in stdio mode...');
      }
      await server.startStdio();
    }
    
    // Write PID for daemon mode
    if (options.daemon) {
      writePid(process.pid);
      writeStatus({
        port,
        mode,
        auth: options.auth || 'none',
        started: new Date().toISOString(),
        pid: process.pid
      });
      if (!options.json) {
        console.log(`Daemon started (PID: ${process.pid})`);
      }
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      if (!options.json) {
        console.log('\nShutting down server...');
      }
      await server.stop();
      removePid();
      removeStatus();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      if (!options.json) {
        console.log('\nShutting down server...');
      }
      await server.stop();
      removePid();
      removeStatus();
      process.exit(0);
    });
    
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    } else {
      console.error('Failed to start server:', error);
    }
    process.exit(1);
  }
}

export default serverCommand;
