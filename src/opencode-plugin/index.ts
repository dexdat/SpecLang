// Generated OpenCode plugin TypeScript code
// DO NOT EDIT MANUALLY

// Import dependencies
import Database = require('better-sqlite3');
import { readFile, writeFile, unlink } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { parse } from 'yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

// Assume db is a better-sqlite3 database instance
// This will be provided by the plugin runtime
declare const db: any;
declare const tools: any;
declare const events: any;

// Block: opencode-plugin/convergence/detector from convergence.spec.md
const QUIET_PERIOD = 30 * 1000; // 30 seconds

async function checkConvergence(): Promise<boolean> {
  const lastEdit = await getLastEditTime(db);
  const quiet = Date.now() - lastEdit > QUIET_PERIOD;
  
  if (quiet && await allAgentsIdle()) {
    return true;
  }
  return false;
}

// Block: opencode-plugin/convergence/pipeline from convergence.spec.md
async function runPipeline(): Promise<void> {
  console.log('Cascade converged – running pipeline...');
  
  // Update index
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  await execAsync('python3 generate_index.py');
  await execAsync('python3 validate_refs.py');
  await execAsync('python3 validate_autonomous.py --project');
  
  // Reset depth counter
  await db.prepare(`UPDATE cascades SET status = 'converged', converged_at = ? WHERE status = 'active'`, [Date.now()]);
  
  console.log('Pipeline complete. Ready for next cascade.');
}

// Block: opencode-plugin/session-manager/schema from session-manager.spec.md
interface Session {
  id: string;
  agent: string;
  status: 'active' | 'idle' | 'done' | 'error';
  current_file: string | null;
  owned_files: string[];
  created_at: number;
  last_active: number;
}

// Block: opencode-plugin/session-manager/create from session-manager.spec.md
async function createSession(agent: string): Promise<string> {
  const sessionId = generateId();
  await db.prepare(
    `INSERT INTO sessions (session_id, agent, status, created, last_active) VALUES (?, ?, ?, ?, ?)`,
    [sessionId, agent, 'active', Date.now(), Date.now()]
  );
  return sessionId;
}

// Block: opencode-plugin/session-manager/get-current from session-manager.spec.md
function getCurrentSession(): string {
  // In OpenCode plugin, session is provided by context
  return global.currentSessionId;
}

// Block: opencode-plugin/session-manager/update-activity from session-manager.spec.md
async function updateSessionActivity(sessionId: string): Promise<void> {
  await db.prepare(
    `UPDATE sessions SET last_active = ? WHERE session_id = ?`,
    [Date.now(), sessionId]
  );
}

// Block: opencode-plugin/error-handling/wrapper from error-handling.spec.md
async function withErrorHandling<T>(fn: () => Promise<T>, context: string): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Error in ${context}:`, error);
    
    // Log to database
    await db.prepare(
      `INSERT INTO errors (timestamp, context, error_message) VALUES (?, ?, ?)`,
      [Date.now(), context, error.message]
    );
    
    // Notify user via OpenCode UI
    tools.notify?.(`Speclang error in ${context}: ${error.message}`);
    
    return null;
  }
}

// Block: opencode-plugin/mcp-client/setup from mcp-client.spec.md
import { MCPServer } from '@modelcontextprotocol/sdk/server';
import { StdioTransport } from '@modelcontextprotocol/sdk/stdio';

let mcpClient: MCPServer | null = null;

async function connectToMCP(): Promise<void> {
  const transport = new StdioTransport({
    command: 'speclang-mcp-server',
    args: []
  });
  
  mcpClient = new MCPServer({
    name: 'speclang-opencode-plugin',
    version: '0.1.0'
  });
  
  await mcpClient.connect(transport);
}

// Block: opencode-plugin/mcp-client/query from mcp-client.spec.md
async function speclangQuery(sql: string, params: any[] = []): Promise<any[]> {
  if (!mcpClient) await connectToMCP();
  
  const result = await mcpClient!.callTool('speclang_query', {
    sql,
    params: JSON.stringify(params)
  });
  
  return JSON.parse(result.content);
}

// Block: opencode-plugin/mcp-client/execute from mcp-client.spec.md
async function speclangExecute(sql: string, params: any[] = []): Promise<void> {
  if (!mcpClient) await connectToMCP();
  
  await mcpClient!.callTool('speclang_execute', {
    sql,
    params: JSON.stringify(params)
  });
}

// Block: opencode-plugin/ownership-guard/schema from ownership-guard.spec.md
interface FileLock {
  file_path: string;
  session_id: string;
  lock_token: string;
  acquired_at: number;
  expires_at: number;
}

// Block: opencode-plugin/ownership-guard/owns-file from ownership-guard.spec.md
async function ownsFile(sessionId: string, filePath: string): Promise<boolean> {
  const lock = await db.get(
    `SELECT * FROM file_locks WHERE file_path = ? AND session_id = ? AND expires_at > ?`,
    [filePath, sessionId, Date.now()]
  );
  return !!lock;
}

// Block: opencode-plugin/ownership-guard/acquire from ownership-guard.spec.md
async function acquireOwnership(sessionId: string, filePath: string): Promise<void> {
  const lockToken = generateToken();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  await db.prepare(
    `INSERT OR REPLACE INTO file_locks (file_path, session_id, lock_token, acquired_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [filePath, sessionId, lockToken, Date.now(), expiresAt]
  );
}

// Block: opencode-plugin/ownership-guard/release from ownership-guard.spec.md
async function releaseOwnership(sessionId: string): Promise<void> {
  await db.prepare(
    `DELETE FROM file_locks WHERE session_id = ?`,
    [sessionId]
  );
}

// Block: opencode-plugin/configuration/options from configuration.spec.md
interface PluginConfig {
  specDir: string; // default: 'specs/'
  quietPeriodMs: number; // default: 30000
  ownershipTimeoutMs: number; // default: 300000
  mcpServerCommand: string; // default: 'speclang-mcp-server'
  gitEnabled: boolean; // default: true
  autoCommit: boolean; // default: true
  validationOnConvergence: boolean; // default: true
}

// Block: opencode-plugin/configuration/tools from configuration.spec.md
// Example tool definition
tools.define('speclang_index', {
  description: 'Query the spec index',
  parameters: {
    query: { type: 'string', description: 'SQL query' }
  },
  handler: async ({ query }) => {
    return await speclangQuery(query);
  }
});

// Block: opencode-plugin/events/file-edited from event-system.spec.md
events.on("file.edited", async (file: { path: string, content: string }) => {
  // Filter spec files
  if (!isSpecFile(file.path)) return;
  
  // Check ownership
  const session = getCurrentSession();
  if (!await ownsFile(session, file.path)) {
    console.warn(`Session ${session} does not own ${file.path}, ignoring edit`);
    return;
  }
  
  // Parse header and index
  const header = await parseHeader(file.path);
  await indexSpec(db, file.path, header);
  
  // Route to appropriate agent based on file type
  await routeToAgent(file.path, header);
});

// Block: opencode-plugin/events/agent-finished from event-system.spec.md
events.on("agent.finished", async (agent: { name: string, session: string }) => {
  // Check if we've been quiet for convergence period
  const lastEdit = await getLastEditTime(db);
  const quiet = Date.now() - lastEdit > QUIET_PERIOD;
  
  if (quiet && await allAgentsIdle()) {
    await runPipeline();
  }
});

// Block: opencode-plugin/events/session-idle from event-system.spec.md
events.on("session.idle", async (session: string) => {
  // Release any ownership locks held by this session
  await releaseOwnership(session);
});

// Block: opencode-plugin/events/is-spec-file from event-system.spec.md
function isSpecFile(path: string): boolean {
  return path.match(/\.spec\.(md|yaml)$/) !== null || 
         path.endsWith('.scl') ||
         path.includes('/specs/');
}

// Block: opencode-plugin/events/parse-header from event-system.spec.md
async function parseHeader(path: string): Promise<Header> {
  const content = await fs.promises.readFile(path, 'utf-8');
  const lines = content.split('\n');
  const headerLine = lines.find(line => line.includes('speclang-header'));
  if (!headerLine) throw new Error(`No speclang-header in ${path}`);
  
  const match = headerLine.match(/speclang-header lines:(\d+)/);
  const lineCount = match ? parseInt(match[1]) : 0;
  const headerText = lines.slice(0, lineCount).join('\n');
  
  // Parse YAML after the comment line
  const yamlText = headerText.split('\n').slice(1).join('\n');
  return yaml.safeLoad(yamlText);
}

// Block: opencode-plugin/lifecycle/hooks from plugin-lifecycle.spec.md
export const Speclang: Plugin = async ({ events, db, tools }) => {
  // Initialization
  await initialize(db);
  await connectToMCP();
  
  // Event listeners setup
  events.on("file.edited", handleFileEdited);
  events.on("agent.finished", handleAgentFinished);
  events.on("session.idle", handleSessionIdle);
  
  // Return cleanup function
  return async () => {
    await releaseAllOwnership();
    await disconnectMCP();
  };
};

// Block: opencode-plugin/lifecycle/initialize from plugin-lifecycle.spec.md
async function initialize(db: Database): Promise<void> {
  // Create tables if not exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS specs (...);
    CREATE TABLE IF NOT EXISTS sessions (...);
    CREATE TABLE IF NOT EXISTS events (...);
    CREATE TABLE IF NOT EXISTS file_locks (...);
  `);
  
  // Load configuration
  const config = await loadConfig();
  
  // Start convergence checker interval
  setInterval(checkConvergence, 5000);
}

// Block: opencode-plugin/git-integration/commit from git-integration.spec.md
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function commitFile(filePath: string, message: string): Promise<void> {
  // Stage the file
  await execAsync(`git add "${filePath}"`);
  
  // Commit only this file
  await execAsync(`git commit --only "${filePath}" -m "speclang: ${message}"`);
}

// Block: opencode-plugin/tools/index from tools.spec.md
tools.define('speclang_index', {
  description: 'Query the spec index with SQL',
  parameters: {
    sql: { type: 'string', description: 'SQL query (SELECT only)' },
    params: { type: 'array', optional: true, description: 'Query parameters' }
  },
  handler: async ({ sql, params = [] }) => {
    return await speclangQuery(sql, params);
  }
});

// Block: opencode-plugin/tools/validate from tools.spec.md
tools.define('speclang_validate', {
  description: 'Validate spec references and autonomous readiness',
  parameters: {
    specId: { type: 'string', optional: true, description: 'Specific spec ID to validate' }
  },
  handler: async ({ specId }) => {
    if (specId) {
      await execAsync(`python3 validate_autonomous.py --file ${specId}`);
    } else {
      await execAsync('python3 validate_autonomous.py --project');
    }
    return { status: 'validation completed' };
  }
});
