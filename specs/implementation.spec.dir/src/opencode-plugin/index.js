"use strict";
// Generated OpenCode plugin TypeScript code
// DO NOT EDIT MANUALLY
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Speclang = Speclang;
const fs = __importStar(require("fs"));
const yaml = __importStar(require("yaml"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Block: opencode-plugin/convergence/detector from convergence.spec.md
const QUIET_PERIOD = 30 * 1000; // 30 seconds
// Stub functions that need to be defined somewhere
async function getLastEditTime(database) {
    // Get the last edit time from the database
    const row = database.prepare(`SELECT MAX(timestamp) as last_edit FROM events`).get();
    return row?.last_edit || Date.now();
}
async function allAgentsIdle() {
    // Check if all agent sessions are idle or done
    const activeSessions = db.prepare(`SELECT COUNT(*) as count FROM sessions WHERE status = 'active'`).get();
    return (activeSessions?.count || 0) === 0;
}
async function checkConvergence() {
    const lastEdit = await getLastEditTime(db);
    const quiet = Date.now() - lastEdit > QUIET_PERIOD;
    if (quiet && await allAgentsIdle()) {
        return true;
    }
    return false;
}
// Block: opencode-plugin/convergence/pipeline from convergence.spec.md
async function runPipeline() {
    console.log('Cascade converged – running pipeline...');
    try {
        await execAsync('python3 generate_index.py');
        await execAsync('python3 validate_refs.py');
        await execAsync('python3 validate_autonomous.py --project');
        // Reset depth counter
        db.prepare(`UPDATE cascades SET status = 'converged', converged_at = ? WHERE status = 'active'`).run(Date.now());
        console.log('Pipeline complete. Ready for next cascade.');
    }
    catch (error) {
        console.error('Pipeline error:', error);
    }
}
// Block: opencode-plugin/session-manager/create from session-manager.spec.md
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
async function createSession(agent) {
    const sessionId = generateId();
    db.prepare(`INSERT INTO sessions (session_id, agent, status, created, last_active) VALUES (?, ?, ?, ?, ?)`, [sessionId, agent, 'active', Date.now(), Date.now()]);
    return sessionId;
}
// Block: opencode-plugin/session-manager/get-current from session-manager.spec.md
function getCurrentSession() {
    // In OpenCode plugin, session is provided by context
    return global.currentSessionId || 'default';
}
// Block: opencode-plugin/session-manager/update-activity from session-manager.spec.md
async function updateSessionActivity(sessionId) {
    db.prepare(`UPDATE sessions SET last_active = ? WHERE session_id = ?`, [Date.now(), sessionId]);
}
// Block: opencode-plugin/error-handling/wrapper from error-handling.spec.md
async function withErrorHandling(fn, context) {
    try {
        return await fn();
    }
    catch (error) {
        console.error(`Error in ${context}:`, error);
        // Log to database
        db.prepare(`INSERT INTO errors (timestamp, context, error_message) VALUES (?, ?, ?)`, [Date.now(), context, error.message]);
        // Notify user via OpenCode UI
        if (tools?.notify) {
            tools.notify(`Speclang error in ${context}: ${error.message}`);
        }
        return null;
    }
}
// Block: opencode-plugin/mcp-client/setup from mcp-client.spec.md
// Stub MCP client - actual implementation would use MCP SDK
let mcpClient = null;
async function connectToMCP() {
    // This would connect to MCP server in actual implementation
    console.log('Connecting to MCP server...');
    mcpClient = { connected: true };
}
// Block: opencode-plugin/mcp-client/query from mcp-client.spec.md
async function speclangQuery(sql, params = []) {
    if (!mcpClient)
        await connectToMCP();
    // Direct DB query for now
    try {
        const stmt = db.prepare(sql);
        return params.length > 0 ? stmt.all(...params) : stmt.all();
    }
    catch (error) {
        console.error('Query error:', error);
        return [];
    }
}
// Block: opencode-plugin/mcp-client/execute from mcp-client.spec.md
async function speclangExecute(sql, params = []) {
    if (!mcpClient)
        await connectToMCP();
    try {
        const stmt = db.prepare(sql);
        params.length > 0 ? stmt.run(...params) : stmt.run();
    }
    catch (error) {
        console.error('Execute error:', error);
    }
}
// Block: opencode-plugin/ownership-guard/owns-file from ownership-guard.spec.md
async function ownsFile(sessionId, filePath) {
    const lock = db.prepare(`SELECT * FROM file_locks WHERE file_path = ? AND session_id = ? AND expires_at > ?`, [filePath, sessionId, Date.now()]).get();
    return !!lock;
}
// Block: opencode-plugin/ownership-guard/acquire from ownership-guard.spec.md
function generateToken() {
    return `token-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
}
async function acquireOwnership(sessionId, filePath) {
    const lockToken = generateToken();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    db.prepare(`INSERT OR REPLACE INTO file_locks (file_path, session_id, lock_token, acquired_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`, [filePath, sessionId, lockToken, Date.now(), expiresAt]);
}
// Block: opencode-plugin/ownership-guard/release from ownership-guard.spec.md
async function releaseOwnership(sessionId) {
    db.prepare(`DELETE FROM file_locks WHERE session_id = ?`, [sessionId]);
}
// Block: opencode-plugin/configuration/tools from configuration.spec.md
function loadConfig() {
    return {
        specDir: 'specs/',
        quietPeriodMs: 30000,
        ownershipTimeoutMs: 300000,
        mcpServerCommand: 'speclang-mcp-server',
        gitEnabled: true,
        autoCommit: true,
        validationOnConvergence: true
    };
}
// Block: opencode-plugin/events/is-spec-file from event-system.spec.md
function isSpecFile(filePath) {
    return filePath.match(/\.spec\.(md|yaml)$/) !== null ||
        filePath.endsWith('.scl') ||
        filePath.includes('/specs/');
}
async function parseHeader(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const headerLine = lines.find(line => line.includes('speclang-header'));
    if (!headerLine)
        throw new Error(`No speclang-header in ${filePath}`);
    const match = headerLine.match(/speclang-header lines:(\d+)/);
    const lineCount = match ? parseInt(match[1]) : 0;
    const headerText = lines.slice(0, lineCount).join('\n');
    // Parse YAML after the comment line
    const yamlText = headerText.split('\n').slice(1).join('\n');
    return yaml.parse(yamlText);
}
// Block: opencode-plugin/events/index-spec from event-system.spec.md
async function indexSpec(database, filePath, header) {
    database.prepare(`
    INSERT OR REPLACE INTO specs (id, file_path, short_desc, layer, version)
    VALUES (?, ?, ?, ?, ?)
  `).run(header.id, filePath, header.short || '', header.layer || 0, header.version || '0.0.0');
    // Index tags if present
    if (header.tags) {
        for (const tag of header.tags) {
            database.prepare(`
        INSERT OR IGNORE INTO spec_tags (spec_pk, tag)
        SELECT spec_pk, ? FROM specs WHERE id = ?
      `).run(tag, header.id);
        }
    }
}
// Block: opencode-plugin/events/route-to-agent from event-system.spec.md
async function routeToAgent(filePath, header) {
    // Route based on file type and header
    console.log(`Routing ${filePath} to agent based on layer ${header.layer}`);
}
// Block: opencode-plugin/events/file-edited from event-system.spec.md
async function handleFileEdited(file) {
    // Filter spec files
    if (!isSpecFile(file.path))
        return;
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
}
// Block: opencode-plugin/events/agent-finished from event-system.spec.md
async function handleAgentFinished(agent) {
    // Check if we've been quiet for convergence period
    const lastEdit = await getLastEditTime(db);
    const quiet = Date.now() - lastEdit > QUIET_PERIOD;
    if (quiet && await allAgentsIdle()) {
        await runPipeline();
    }
}
// Block: opencode-plugin/events/session-idle from event-system.spec.md
async function handleSessionIdle(session) {
    // Release any ownership locks held by this session
    await releaseOwnership(session);
}
// Block: opencode-plugin/lifecycle/cleanup from plugin-lifecycle.spec.md
async function releaseAllOwnership() {
    const session = getCurrentSession();
    await releaseOwnership(session);
}
async function disconnectMCP() {
    mcpClient = null;
}
// Block: opencode-plugin/lifecycle/initialize from plugin-lifecycle.spec.md
async function initialize(database) {
    // Create tables if not exist - simplified schema
    database.exec(`
    CREATE TABLE IF NOT EXISTS specs (
      spec_pk INTEGER PRIMARY KEY,
      id TEXT UNIQUE,
      file_path TEXT,
      short_desc TEXT,
      layer INTEGER,
      version TEXT
    );
    
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      agent TEXT,
      status TEXT,
      created INTEGER,
      last_active INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS events (
      event_pk INTEGER PRIMARY KEY,
      timestamp INTEGER,
      path TEXT,
      kind TEXT,
      processed INTEGER DEFAULT 0,
      claimed_by TEXT
    );
    
    CREATE TABLE IF NOT EXISTS file_locks (
      file_path TEXT PRIMARY KEY,
      session_id TEXT,
      lock_token TEXT,
      acquired_at INTEGER,
      expires_at INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS errors (
      error_pk INTEGER PRIMARY KEY,
      timestamp INTEGER,
      context TEXT,
      error_message TEXT
    );
    
    CREATE TABLE IF NOT EXISTS cascades (
      cascade_id TEXT PRIMARY KEY,
      status TEXT,
      started_at INTEGER,
      converged_at INTEGER
    );
  `);
    // Load configuration
    const config = loadConfig();
    // Start convergence checker interval
    setInterval(async () => {
        if (await checkConvergence()) {
            await runPipeline();
        }
    }, 5000);
}
// Block: opencode-plugin/git-integration/commit from git-integration.spec.md
async function commitFile(filePath, message) {
    try {
        // Stage the file
        await execAsync(`git add "${filePath}"`);
        // Commit only this file
        await execAsync(`git commit --only "${filePath}" -m "speclang: ${message}"`);
    }
    catch (error) {
        console.error('Git commit error:', error);
    }
}
// Block: opencode-plugin/tools/index from tools.spec.md
// Note: tools.define would be provided by OpenCode runtime
// Block: opencode-plugin/tools/validate from tools.spec.md
// Note: validation would call external Python scripts
// Block: opencode-plugin/lifecycle/hooks from plugin-lifecycle.spec.md
async function Speclang(pluginContext) {
    const { events, db: pluginDb, tools: pluginTools } = pluginContext;
    // Set up global references
    global.db = pluginDb;
    global.tools = pluginTools;
    global.events = events;
    // Initialize
    await initialize(pluginDb);
    await connectToMCP();
    // Event listeners setup
    if (events?.on) {
        events.on("file.edited", handleFileEdited);
        events.on("agent.finished", handleAgentFinished);
        events.on("session.idle", handleSessionIdle);
    }
    // Return cleanup function
    return async () => {
        await releaseAllOwnership();
        await disconnectMCP();
    };
}
//# sourceMappingURL=index.js.map