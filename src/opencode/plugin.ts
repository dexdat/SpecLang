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

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  type OpenCodePluginContext,
  type SpecHeader,
  type FileEditEvent,
  type AgentFinishedEvent,
  type WriteAttemptEvent,
  type SessionStartedEvent,
  type SessionIdleEvent
} from './types';
import { loadConfig, getProfile } from './config';
import { OwnershipGuard } from './ownership';
import { SessionManager } from './session';
import { ConvergenceDetector } from './convergence';
import { GitIntegration } from './git';

const execAsync = promisify(exec);

const SPEC_EXTENSIONS = ['.spec.md', '.spec', '.scl'];

export interface PluginOptions {
  projectDir?: string;
}

let ownershipGuard: OwnershipGuard | null = null;
let sessionManager: SessionManager | null = null;
let convergenceDetector: ConvergenceDetector | null = null;
let gitIntegration: GitIntegration | null = null;

export async function SpeclangPlugin(
  context: OpenCodePluginContext,
  options: PluginOptions = {}
): Promise<void> {
  const config = loadConfig(options.projectDir || context.config.projectDir);
  const profile = getProfile(config.profile);

  initializeDatabase(context);

  ownershipGuard = new OwnershipGuard(context.db as unknown as import('./types').OpenCodeDatabase);
  sessionManager = new SessionManager(context.db as unknown as import('./types').OpenCodeDatabase);
  convergenceDetector = new ConvergenceDetector(
    context.db as unknown as import('./types').OpenCodeDatabase,
    config,
    sessionManager
  );
  gitIntegration = new GitIntegration(config.projectDir);

  registerTools(context, config);

  context.events.on('file.edited', async (event: FileEditEvent) => {
    await handleFileEdited(context, event, config, sessionManager!, ownershipGuard!, convergenceDetector!);
  });

  context.events.on('agent.finished', async (agent: AgentFinishedEvent) => {
    await handleAgentFinished(context, agent, config, sessionManager!, convergenceDetector!, gitIntegration!);
  });

  context.events.on('session.idle', async (sessionEvent: SessionIdleEvent) => {
    await handleSessionIdle(sessionEvent, ownershipGuard!, sessionManager!);
  });

  context.events.on('session.started', async (session: SessionStartedEvent) => {
    await handleSessionStarted(context, session, sessionManager!);
  });

  context.events.on('write.attempt', async (attempt: WriteAttemptEvent) => {
    await handleWriteAttempt(context, attempt, ownershipGuard!, sessionManager!);
  });

  console.log('[Speclang] Plugin initialized with profile:', config.profile);
}

function initializeDatabase(context: OpenCodePluginContext): void {
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

function registerTools(context: OpenCodePluginContext, config: { projectDir: string }): void {
  context.tools.register('speclang_create_spec', async (params) => {
    return createSpec(context, params as { path: string; header: string; content: string });
  });

  context.tools.register('speclang_read_header', async (params) => {
    return readHeader(params.path as string);
  });

  context.tools.register('speclang_find_deps', async (params) => {
    return findDependents(context, params.id as string);
  });

  context.tools.register('speclang_find_by_tag', async (params) => {
    return findByTag(context, params.tag as string);
  });

  context.tools.register('speclang_get_tree', async (params) => {
    return getSpecTree(context, params.path as string);
  });
}

async function handleFileEdited(
  context: OpenCodePluginContext,
  event: FileEditEvent,
  config: { projectDir: string },
  sessions: SessionManager,
  ownership: OwnershipGuard,
  convergence: ConvergenceDetector
): Promise<void> {
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

async function handleAgentFinished(
  context: OpenCodePluginContext,
  agent: AgentFinishedEvent,
  config: { quietPeriod: number },
  sessions: SessionManager,
  convergence: ConvergenceDetector,
  git: GitIntegration
): Promise<void> {
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

async function handleSessionIdle(
  sessionEvent: SessionIdleEvent,
  ownership: OwnershipGuard,
  sessions: SessionManager
): Promise<void> {
  await ownership.releaseAllForSession(sessionEvent.session);
  sessions.updateStatus(sessionEvent.session, 'idle');
  console.log(`[Speclang] Session ${sessionEvent.session} is now idle, released locks`);
}

async function handleSessionStarted(
  context: OpenCodePluginContext,
  session: SessionStartedEvent,
  sessions: SessionManager
): Promise<void> {
  const sessionId = sessions.createSession(session.agent);

  context.db.prepare(`
    INSERT OR REPLACE INTO sessions (id, agent, owns, status, last_active)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, session.agent, JSON.stringify(session.owns), 'active', Date.now());

  sessions.setCurrentSession(sessionId);
}

async function handleWriteAttempt(
  context: OpenCodePluginContext,
  attempt: WriteAttemptEvent,
  ownership: OwnershipGuard,
  sessions: SessionManager
): Promise<void> {
  const owns = await ownership.ownsFile(attempt.session, attempt.path);

  if (!owns) {
    const lockToken = await ownership.acquireOwnership(attempt.session, attempt.path);
    await sessions.addOwnedFile(attempt.session, attempt.path);
    console.log(`[Speclang] Acquired ownership for ${attempt.path}`);
  }
}

function isSpecFile(filePath: string): boolean {
  return SPEC_EXTENSIONS.some(ext => filePath.endsWith(ext)) || filePath.includes('/specs/');
}

function parseHeader(filePath: string): SpecHeader | null {
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
  } catch {
    return null;
  }
}

function indexSpec(context: OpenCodePluginContext, filePath: string, header: SpecHeader): void {
  context.db.prepare(`
    INSERT OR REPLACE INTO specs (path, id, depth, owned_by, depends_on, tags, short_desc, header_lines, last_modified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    filePath,
    header.id,
    header.layer,
    '',
    '[]',
    JSON.stringify(header.tags),
    header.short,
    0,
    Date.now()
  );
}

function recordEvent(
  context: OpenCodePluginContext,
  kind: string,
  filePath: string,
  session?: string
): void {
  context.db.prepare(`
    INSERT INTO events (timestamp, kind, path, session)
    VALUES (?, ?, ?, ?)
  `).run(Date.now(), kind, filePath, session || null);
}

async function createSpec(
  context: OpenCodePluginContext,
  params: { path: string; header: string; content: string }
): Promise<{ success: boolean; path: string }> {
  const fullPath = path.join(context.config.projectDir, params.path);

  fs.writeFileSync(fullPath, params.header + '\n\n' + params.content);

  const header = parseHeader(fullPath);
  if (header) {
    indexSpec(context, fullPath, header);
  }

  return { success: true, path: params.path };
}

async function readHeader(filePath: string): Promise<SpecHeader | null> {
  return parseHeader(filePath);
}

async function findDependents(
  context: OpenCodePluginContext,
  id: string
): Promise<{ path: string; id: string }[]> {
  const results = context.db.all<{ path: string; id: string }>(
    "SELECT path, id FROM specs WHERE depends_on LIKE ?",
    [`%${id}%`]
  );
  return results;
}

async function findByTag(
  context: OpenCodePluginContext,
  tag: string
): Promise<{ path: string; id: string; short_desc: string }[]> {
  const results = context.db.all<{ path: string; id: string; short_desc: string }>(
    "SELECT path, id, short_desc FROM specs WHERE tags LIKE ?",
    [`%${tag}%`]
  );
  return results;
}

async function getSpecTree(
  context: OpenCodePluginContext,
  filePath: string
): Promise<{ parent: string | null; children: string[] }> {
  const spec = context.db.get<{ id: string; parent_id: string }>(
    'SELECT id, parent_id FROM specs WHERE path = ?',
    [filePath]
  );

  if (!spec) {
    return { parent: null, children: [] };
  }

  const children = context.db.all<{ path: string }>(
    'SELECT path FROM specs WHERE parent_id = ?',
    [spec.id]
  );

  return {
    parent: spec.parent_id || null,
    children: children.map(c => c.path)
  };
}

export function cleanup(): void {
  ownershipGuard?.destroy();
  sessionManager?.destroy();
  convergenceDetector?.destroy();
}

export { parseHeader, isSpecFile };
