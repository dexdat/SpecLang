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
import { 
  type OpenCodePluginContext, 
  type SpecHeader, 
  type FileEditEvent,
  type AgentFinishedEvent,
  type WriteAttemptEvent,
  type SessionStartedEvent
} from './types';
import { loadConfig, getProfile } from './config';

const SPEC_EXTENSIONS = ['.spec.md', '.spec', '.scl'];

export interface PluginOptions {
  projectDir?: string;
}

export async function SpeclangPlugin(
  context: OpenCodePluginContext,
  options: PluginOptions = {}
): Promise<void> {
  const config = loadConfig(options.projectDir || context.config.projectDir);
  const profile = getProfile(config.profile);
  
  initializeDatabase(context);
  registerTools(context, config);
  
  context.events.on('file.edited', async (event: FileEditEvent) => {
    await handleFileEdited(context, event, config);
  });
  
  context.events.on('agent.finished', async (agent: AgentFinishedEvent) => {
    await handleAgentFinished(context, agent, config);
  });
  
  context.events.on('session.started', async (session: SessionStartedEvent) => {
    await handleSessionStarted(context, session);
  });
  
  context.events.on('write.attempt', async (attempt: WriteAttemptEvent) => {
    await handleWriteAttempt(context, attempt);
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
  config: { projectDir: string }
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
  
  console.log(`[Speclang] Indexed spec: ${header.id} (${event.path})`);
}

async function handleAgentFinished(
  context: OpenCodePluginContext,
  agent: AgentFinishedEvent,
  config: { quietPeriod: number }
): Promise<void> {
  const lastEdit = getLastEditTime(context);
  const quiet = Date.now() - lastEdit > config.quietPeriod * 1000;
  
  if (quiet) {
    const activeSessions = getActiveSessionCount(context);
    
    if (activeSessions === 0) {
      console.log('[Speclang] Convergence detected, running pipeline...');
      await runPipeline(context);
      await commitPerFile(context, agent.files_written, agent.summary);
    }
  }
}

async function handleSessionStarted(
  context: OpenCodePluginContext,
  session: SessionStartedEvent
): Promise<void> {
  context.db.prepare(`
    INSERT OR REPLACE INTO sessions (id, agent, owns, status, last_active)
    VALUES (?, ?, ?, ?, ?)
  `).run(session.session, session.agent, JSON.stringify(session.owns), 'active', Date.now());
}

async function handleWriteAttempt(
  context: OpenCodePluginContext,
  attempt: WriteAttemptEvent
): Promise<void> {
  const session = context.db.get<{ owns: string }>(
    'SELECT owns FROM sessions WHERE id = ?',
    [attempt.session]
  );
  
  if (!session) {
    throw new Error(`Session ${attempt.session} not found`);
  }
  
  const owns: string[] = JSON.parse(session.owns || '[]');
  const canWrite = owns.some(pattern => matchesPattern(attempt.path, pattern));
  
  if (!canWrite) {
    throw new Error(`Session ${attempt.session} cannot write ${attempt.path}`);
  }
}

function isSpecFile(filePath: string): boolean {
  return SPEC_EXTENSIONS.some(ext => filePath.endsWith(ext));
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
  path: string,
  session?: string
): void {
  context.db.prepare(`
    INSERT INTO events (timestamp, kind, path, session)
    VALUES (?, ?, ?, ?)
  `).run(Date.now(), kind, path, session || null);
}

function getLastEditTime(context: OpenCodePluginContext): number {
  const result = context.db.get<{ max_time: number }>(
    'SELECT MAX(last_modified) as max_time FROM specs'
  );
  return result?.max_time || 0;
}

function getActiveSessionCount(context: OpenCodePluginContext): number {
  const result = context.db.get<{ count: number }>(
    "SELECT COUNT(*) as count FROM sessions WHERE status = 'active'"
  );
  return result?.count || 0;
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

async function runPipeline(context: OpenCodePluginContext): Promise<void> {
  console.log('[Speclang] Running pipeline...');
}

async function commitPerFile(
  context: OpenCodePluginContext,
  files: string[],
  summary: string
): Promise<void> {
  console.log(`[Speclang] Would commit ${files.length} files: ${summary}`);
}

function matchesPattern(filePath: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('/*')) {
    const dir = pattern.slice(0, -2);
    return filePath.startsWith(dir);
  }
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(filePath);
  }
  return filePath === pattern || filePath.startsWith(pattern);
}

export { parseHeader, isSpecFile, matchesPattern };
