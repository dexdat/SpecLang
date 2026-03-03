"use strict";
/**
 * Speclang OpenCode Plugin
 *
 * Plugin for OpenCode that provides:
 * - File watching and event handling
 * - Spec header parsing and indexing
 * - Ownership enforcement
 * - Convergence detection
 * - Pipeline execution
 * - Git integration
 *
 * Generated from: @speclang/opencode/integration
 */
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
exports.SpeclangPlugin = SpeclangPlugin;
exports.cleanup = cleanup;
exports.parseHeader = parseHeader;
exports.isSpecFile = isSpecFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const config_1 = require("./config");
const ownership_1 = require("./ownership");
const session_1 = require("./session");
const convergence_1 = require("./convergence");
const git_1 = require("./git");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const SPEC_EXTENSIONS = ['.spec.md', '.spec', '.scl'];
let ownershipGuard = null;
let sessionManager = null;
let convergenceDetector = null;
let gitIntegration = null;
async function SpeclangPlugin(context, options = {}) {
    const config = (0, config_1.loadConfig)(options.projectDir || context.config.projectDir);
    const profile = (0, config_1.getProfile)(config.profile);
    initializeDatabase(context);
    ownershipGuard = new ownership_1.OwnershipGuard(context.db);
    sessionManager = new session_1.SessionManager(context.db);
    convergenceDetector = new convergence_1.ConvergenceDetector(context.db, config, sessionManager);
    gitIntegration = new git_1.GitIntegration(config.projectDir);
    registerTools(context, config);
    context.events.on('file.edited', async (event) => {
        await handleFileEdited(context, event, config, sessionManager, ownershipGuard, convergenceDetector);
    });
    context.events.on('agent.finished', async (agent) => {
        await handleAgentFinished(context, agent, config, sessionManager, convergenceDetector, gitIntegration);
    });
    context.events.on('session.idle', async (sessionEvent) => {
        await handleSessionIdle(sessionEvent, ownershipGuard, sessionManager);
    });
    context.events.on('session.started', async (session) => {
        await handleSessionStarted(context, session, sessionManager);
    });
    context.events.on('write.attempt', async (attempt) => {
        await handleWriteAttempt(context, attempt, ownershipGuard, sessionManager);
    });
    console.log('[Speclang] Plugin initialized with profile:', config.profile);
}
function initializeDatabase(context) {
    context.db.exec(`
    CREATE TABLE IF NOT EXISTS specs (
      path TEXT PRIMARY KEY,
      id TEXT,
      depth INTEGER,
      owned_by TEXT,
      depends_on TEXT,
      tags TEXT,
      short_desc TEXT,
      header_lines INTEGER,
      last_modified INTEGER
    )
  `);
    context.db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      agent TEXT,
      owns TEXT,
      status TEXT,
      last_active INTEGER
    )
  `);
    context.db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,
      timestamp INTEGER,
      kind TEXT,
      path TEXT,
      session TEXT,
      details TEXT
    )
  `);
    context.db.exec(`
    CREATE TABLE IF NOT EXISTS cascade_log (
      id TEXT PRIMARY KEY,
      root_trigger TEXT,
      depth INTEGER,
      files_changed INTEGER,
      started INTEGER,
      ended INTEGER
    )
  `);
}
function registerTools(context, config) {
    context.tools.register('speclang_create_spec', async (params) => {
        return createSpec(context, params);
    });
    context.tools.register('speclang_read_header', async (params) => {
        return readHeader(params.path);
    });
    context.tools.register('speclang_find_deps', async (params) => {
        return findDependents(context, params.id);
    });
    context.tools.register('speclang_find_by_tag', async (params) => {
        return findByTag(context, params.tag);
    });
    context.tools.register('speclang_get_tree', async (params) => {
        return getSpecTree(context, params.path);
    });
}
async function handleFileEdited(context, event, config, sessions, ownership, convergence) {
    if (!isSpecFile(event.path)) {
        return;
    }
    const header = parseHeader(event.path);
    if (!header) {
        return;
    }
    indexSpec(context, event.path, header);
    recordEvent(context, 'file.edited', event.path, event.session);
    convergence.recordFileEdit(event.path);
    console.log(`[Speclang] Indexed spec: ${header.id} (${event.path})`);
}
async function handleAgentFinished(context, agent, config, sessions, convergence, git) {
    sessions.updateStatus(agent.session, 'done');
    const converged = await convergence.checkAndTrigger();
    if (converged) {
        const changedFiles = await git.getChangedFiles();
        for (const file of changedFiles) {
            if (isSpecFile(file)) {
                await git.commitFile(file, `updated ${path.basename(file)}`);
            }
        }
    }
}
async function handleSessionIdle(sessionEvent, ownership, sessions) {
    await ownership.releaseAllForSession(sessionEvent.session);
    sessions.updateStatus(sessionEvent.session, 'idle');
    console.log(`[Speclang] Session ${sessionEvent.session} is now idle, released locks`);
}
async function handleSessionStarted(context, session, sessions) {
    const sessionId = sessions.createSession(session.agent);
    context.db.prepare(`
    INSERT OR REPLACE INTO sessions (id, agent, owns, status, last_active)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, session.agent, JSON.stringify(session.owns), 'active', Date.now());
    sessions.setCurrentSession(sessionId);
}
async function handleWriteAttempt(context, attempt, ownership, sessions) {
    const owns = await ownership.ownsFile(attempt.session, attempt.path);
    if (!owns) {
        const lockToken = await ownership.acquireOwnership(attempt.session, attempt.path);
        await sessions.addOwnedFile(attempt.session, attempt.path);
        console.log(`[Speclang] Acquired ownership for ${attempt.path}`);
    }
}
function isSpecFile(filePath) {
    return SPEC_EXTENSIONS.some(ext => filePath.endsWith(ext)) || filePath.includes('/specs/');
}
function parseHeader(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        let headerStart = -1;
        let headerEnd = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '# speclang-header' || line.startsWith('# speclang-header')) {
                headerStart = i + 1;
            }
            if (headerStart >= 0 && line === '---') {
                headerEnd = i;
                break;
            }
        }
        if (headerStart < 0 || headerEnd < 0) {
            return null;
        }
        const headerText = lines.slice(headerStart, headerEnd).join('\n');
        const parsed = yaml.parse(headerText);
        return {
            id: parsed.id || '',
            version: parsed.version || '0.0.0',
            layer: parsed.layer || 0,
            tags: parsed.tags || [],
            short: parsed.short || '',
            status: parsed.status,
            project_level: parsed.project_level,
            agent_support: parsed.agent_support
        };
    }
    catch {
        return null;
    }
}
function indexSpec(context, filePath, header) {
    context.db.prepare(`
    INSERT OR REPLACE INTO specs (path, id, depth, owned_by, depends_on, tags, short_desc, header_lines, last_modified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(filePath, header.id, header.layer, '', '[]', JSON.stringify(header.tags), header.short, 0, Date.now());
}
function recordEvent(context, kind, filePath, session) {
    context.db.prepare(`
    INSERT INTO events (timestamp, kind, path, session)
    VALUES (?, ?, ?, ?)
  `).run(Date.now(), kind, filePath, session || null);
}
async function createSpec(context, params) {
    const fullPath = path.join(context.config.projectDir, params.path);
    fs.writeFileSync(fullPath, params.header + '\n\n' + params.content);
    const header = parseHeader(fullPath);
    if (header) {
        indexSpec(context, fullPath, header);
    }
    return { success: true, path: params.path };
}
async function readHeader(filePath) {
    return parseHeader(filePath);
}
async function findDependents(context, id) {
    const results = context.db.all("SELECT path, id FROM specs WHERE depends_on LIKE ?", [`%${id}%`]);
    return results;
}
async function findByTag(context, tag) {
    const results = context.db.all("SELECT path, id, short_desc FROM specs WHERE tags LIKE ?", [`%${tag}%`]);
    return results;
}
async function getSpecTree(context, filePath) {
    const spec = context.db.get('SELECT id, parent_id FROM specs WHERE path = ?', [filePath]);
    if (!spec) {
        return { parent: null, children: [] };
    }
    const children = context.db.all('SELECT path FROM specs WHERE parent_id = ?', [spec.id]);
    return {
        parent: spec.parent_id || null,
        children: children.map(c => c.path)
    };
}
function cleanup() {
    ownershipGuard?.destroy();
    sessionManager?.destroy();
    convergenceDetector?.destroy();
}
//# sourceMappingURL=plugin.js.map