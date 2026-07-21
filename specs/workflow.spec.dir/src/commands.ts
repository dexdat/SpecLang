/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/workflow.dir/daily-use.spec.md
 * Blocks: @workflow/commands
 * Generated: 2026-02-22
 * 
 * Edit the spec, not this file.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as https from 'https';
import { URL } from 'url';

/**
 * Safely run a shell command, capturing stderr on failure.
 * Returns the trimmed stdout on success, throws on non-zero exit.
 */
function runGit(projectPath: string, args: string): string {
  return execSync(`git ${args}`, {
    cwd: projectPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8'
  }).trim();
}

/**
 * Check whether `path/to/dir` exists and is a git working tree.
 */
function isGitRepo(projectPath: string): boolean {
  try {
    runGit(projectPath, 'rev-parse --is-inside-work-tree');
    return true;
  } catch {
    return false;
  }
}

/**
 * Install artifacts information
 * 
 * @block:workflow/install-detail @kind:entity
 */
export interface InstallArtifacts {
  binary: {
    path: string;
    size: string;
    platforms: string[];
  };
  skills: {
    path: string;
    contents: string[];
    size: string;
  };
  config: {
    path: string;
    defaults: string;
  };
}

/**
 * Skills download options
 */
export interface SkillsOptions {
  overwrite?: boolean;
  registryUrl?: string;
}

/**
 * Installed skill information
 */
export interface Skill {
  name: string;
  version: string;
  path: string;
  loaded: boolean;
}

/**
 * North Star command types
 * 
 * @block:workflow/commands @kind:entity
 */
export type NorthStarCommand =
  | '/finalize'
  | '/pause'
  | '/resume'
  | '/status'
  | '/rollback'
  | '/build';

/**
 * Parse a north star command
 */
export function parseNorthStarCommand(input: string): NorthStarCommand | null {
  const trimmed = input.trim().toLowerCase();
  const commands: NorthStarCommand[] = [
    '/finalize',
    '/pause',
    '/resume',
    '/status',
    '/rollback',
    '/build'
  ];
  
  return commands.includes(trimmed as NorthStarCommand) 
    ? trimmed as NorthStarCommand 
    : null;
}

/**
 * Execute a north star command
 */
export async function executeNorthStarCommand(
  command: NorthStarCommand,
  projectPath: string
): Promise<void> {
  const configPath = path.join(projectPath, '.speclang/config.json');
  
  // Load config
  let config: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  
  switch (command) {
    case '/finalize':
      await executeFinalize(projectPath, config);
      break;
    case '/pause':
      await executePause(projectPath, config);
      break;
    case '/resume':
      await executeResume(projectPath, config);
      break;
    case '/status':
      await executeStatus(projectPath, config);
      break;
    case '/rollback':
      await executeRollback(projectPath, config);
      break;
    case '/build':
      await executeBuild(projectPath, config);
      break;
  }
}

/**
 * /finalize - Force convergence + commit
 */
async function executeFinalize(projectPath: string, config: Record<string, unknown>): Promise<void> {
  console.log('=== /finalize ===');
  console.log('Forcing convergence and creating commit...');
  
  // Check if daemon is running
  const pidPath = path.join(projectPath, '.speclang/daemon.pid');
  const daemonWasRunning = fs.existsSync(pidPath);
  if (!daemonWasRunning) {
    console.log('Warning: Daemon may not be running. Start with: speclangd start');
  }
  
  // Verify this is a git repo before attempting any git operations
  if (!isGitRepo(projectPath)) {
    console.log('Error: Not a git repository. Run `git init` first.');
    return;
  }
  
  // Record convergence timestamp in daemon state.json
  const statePath = path.join(projectPath, '.speclang/state.json');
  let state: Record<string, unknown> = {};
  if (fs.existsSync(statePath)) {
    try {
      state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    } catch (err) {
      // Corrupted state — start fresh rather than failing the whole finalize
      state = {};
    }
  }
  state.lastConvergence = new Date().toISOString();
  state.convergedBy = '/finalize';
  if (daemonWasRunning) {
    state.daemonRunningAtConvergence = true;
  }
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log(`Convergence timestamp recorded: ${state.lastConvergence}`);
  
  // Stage and commit. `git add -A` is acceptable here — /finalize is an
  // explicit user-driven checkpoint that captures the whole working tree.
  try {
    runGit(projectPath, 'add -A');
  } catch (err) {
    console.log(`Error: git add failed: ${(err as Error).message}`);
    return;
  }
  
  // Check whether there is anything to commit before running `git commit`,
  // which exits non-zero on an empty index and would otherwise look like a failure.
  let staged: string;
  try {
    staged = runGit(projectPath, 'diff --cached --name-only');
  } catch (err) {
    console.log(`Error: git diff --cached failed: ${(err as Error).message}`);
    return;
  }
  
  if (staged.length === 0) {
    console.log('No changes to commit (working tree clean).');
    return;
  }
  
  try {
    runGit(projectPath, 'commit -m "speclang: converge"');
    console.log('All changes committed.');
  } catch (err) {
    console.log(`Error: git commit failed: ${(err as Error).message}`);
  }
}

/**
 * /pause - Pause cascade
 */
async function executePause(projectPath: string, config: Record<string, unknown>): Promise<void> {
  console.log('=== /pause ===');
  console.log('Pausing cascade...');
  
  const statePath = path.join(projectPath, '.speclang/state.json');
  const state = fs.existsSync(statePath) 
    ? JSON.parse(fs.readFileSync(statePath, 'utf-8'))
    : {};
  
  state.paused = true;
  state.pausedAt = new Date().toISOString();
  
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log('Cascade paused.');
}

/**
 * /resume - Resume cascade
 */
async function executeResume(projectPath: string, config: Record<string, unknown>): Promise<void> {
  console.log('=== /resume ===');
  console.log('Resuming cascade...');
  
  const statePath = path.join(projectPath, '.speclang/state.json');
  const state = fs.existsSync(statePath) 
    ? JSON.parse(fs.readFileSync(statePath, 'utf-8'))
    : {};
  
  state.paused = false;
  state.resumedAt = new Date().toISOString();
  
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log('Cascade resumed.');
}

/**
 * /status - Show cascade state
 */
async function executeStatus(projectPath: string, config: Record<string, unknown>): Promise<void> {
  console.log('=== /status ===');
  
  // Check daemon
  const pidPath = path.join(projectPath, '.speclang/daemon.pid');
  const daemonRunning = fs.existsSync(pidPath);
  
  if (daemonRunning) {
    const pid = fs.readFileSync(pidPath, 'utf-8').trim();
    console.log(`Daemon: Running (PID ${pid})`);
  } else {
    console.log('Daemon: Not running');
  }
  
  // Check state
  const statePath = path.join(projectPath, '.speclang/state.json');
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    console.log(`Cascade: ${state.paused ? 'Paused' : 'Running'}`);
    
    if (state.lastConvergence) {
      console.log(`Last convergence: ${state.lastConvergence}`);
    }
    
    if (state.activeAgents) {
      console.log(`Active agents: ${state.activeAgents}`);
    }
  } else {
    console.log('Cascade: Not initialized');
  }
  
  // Check locks
  const locksPath = path.join(projectPath, '.speclang/locks');
  if (fs.existsSync(locksPath)) {
    const locks = fs.readdirSync(locksPath);
    if (locks.length > 0) {
      console.log(`Active locks: ${locks.length}`);
    } else {
      console.log('Active locks: None');
    }
  }
}

/**
 * /rollback - Undo last changes
 */
async function executeRollback(projectPath: string, config: Record<string, unknown>): Promise<void> {
  console.log('=== /rollback ===');
  console.log('Rolling back last changes...');
  
  if (!isGitRepo(projectPath)) {
    console.log('Error: Not a git repository. Run `git init` first.');
    return;
  }
  
  // Confirm there is actually a previous commit to roll back to.
  // Both `git revert` and `git reset` against an unborn/empty HEAD fail
  // in confusing ways — check upfront and surface a clear message.
  let headCount: number;
  try {
    const revList = runGit(projectPath, 'rev-list --count HEAD');
    headCount = parseInt(revList, 10);
    if (Number.isNaN(headCount)) {
      headCount = 0;
    }
  } catch (err) {
    console.log('No previous commit to roll back to (empty or unborn HEAD).');
    return;
  }
  
  if (headCount === 0) {
    console.log('No previous commit to roll back to (empty or unborn HEAD).');
    return;
  }
  
  // Prefer `git revert HEAD` so the rollback is itself a tracked commit —
  // this matches what `executeFinalize` already produces, keeping history
  // linear and reviewable. Soft reset would silently rewrite HEAD and drop
  // the rollback from `git log`.
  try {
    const headSha = runGit(projectPath, 'rev-parse --short HEAD');
    runGit(projectPath, 'revert --no-edit HEAD');
    console.log(`Reverted commit ${headSha}. New commit recorded.`);
  } catch (err) {
    // Revert can fail with conflicts if HEAD touched the same paths the
    // rollback is trying to undo. Surface the underlying git message.
    console.log(`Error: git revert HEAD failed: ${(err as Error).message}`);
    console.log('Tip: resolve conflicts manually, then `git revert --continue`.');
  }
}

/**
 * Parse a simple build.yaml "step list" without a YAML dependency.
 *
 * SpecLang commits to no extra deps; build.yaml's relevant subset is a flat
 * list of `- run: <command>` entries (optionally preceded by `- name: <id>`),
 * which is exactly parseable by a small line-oriented scanner. We do not try
 * to be a full YAML parser — anything we don't understand is skipped with
 * a console warning rather than failing the build.
 *
 * Example input this handles:
 *
 *   pipeline:
 *     on_converge:
 *       - name: install
 *         run: "bun install"
 *       - run: "bun test"
 */
interface BuildStep {
  name?: string;
  run?: string;
}

function parseBuildSteps(yamlContent: string): BuildStep[] {
  const steps: BuildStep[] = [];
  // Walk line-by-line so we never accidentally match across sections.
  const lines = yamlContent.split(/\r?\n/);
  let current: BuildStep | null = null;

  for (const rawLine of lines) {
    // Strip comments and surrounding whitespace before pattern-matching.
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) {
      continue;
    }

    // Start of a new list item: `- name: foo` or `- run: "cmd"`.
    const itemMatch = line.match(/^-\s+(.+)$/);
    if (itemMatch) {
      if (current) {
        steps.push(current);
      }
      current = {};
      // The rest of the line after `-` could itself be a key/value pair.
      const kv = itemMatch[1].match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
      if (kv) {
        const key = kv[1];
        const value = kv[2].trim().replace(/^["']|["']$/g, '');
        if (key === 'name' || key === 'run') {
          (current as Record<string, string>)[key] = value;
        }
      }
      continue;
    }

    // Continuation key under the current list item (2+ spaces indent).
    const contMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (contMatch && current) {
      const key = contMatch[1];
      const value = contMatch[2].trim().replace(/^["']|["']$/g, '');
      if (key === 'name' || key === 'run') {
        (current as Record<string, string>)[key] = value;
      }
    }
  }

  if (current) {
    steps.push(current);
  }
  return steps;
}

/**
 * /build - Run pipeline manually
 */
async function executeBuild(projectPath: string, config: Record<string, unknown>): Promise<void> {
  console.log('=== /build ===');
  console.log('Running build pipeline...');
  
  // Check build.yaml
  const buildConfigPath = path.join(projectPath, 'build.yaml');
  if (!fs.existsSync(buildConfigPath)) {
    console.log('Error: build.yaml not found');
    return;
  }
  
  const yamlContent = fs.readFileSync(buildConfigPath, 'utf-8');
  const steps = parseBuildSteps(yamlContent).filter((s) => s.run);
  
  if (steps.length === 0) {
    console.log('No executable steps found in build.yaml (looking for `- run:` entries).');
    return;
  }
  
  console.log(`Found ${steps.length} step(s) in build.yaml. Executing...`);
  
  let succeeded = 0;
  let failed = 0;
  
  for (const step of steps) {
    const label = step.name ? `${step.name}: ${step.run}` : step.run;
    console.log(`\n[step] ${label}`);
    try {
      execSync(step.run as string, {
        cwd: projectPath,
        stdio: ['ignore', 'inherit', 'inherit'],
        encoding: 'utf-8'
      });
      console.log(`[step] OK: ${label}`);
      succeeded++;
    } catch (err) {
      const message = (err as Error).message;
      console.log(`[step] FAILED: ${label}`);
      console.log(`[step] Error: ${message.split('\n')[0]}`);
      failed++;
      // Stop on the first failure — `depends_on` semantics in build.yaml
      // imply sequential ordering, and continuing past a failure rarely
      // produces useful output.
      break;
    }
  }
  
  console.log(`\nPipeline summary: ${succeeded} succeeded, ${failed} failed.`);
}

/**
 * Fetch a URL via Node's stdlib https module and return the response body.
 * Used by `downloadSkills` to avoid adding a runtime dependency.
 */
function fetchUrl(targetUrl: string, timeoutMs: number = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch (err) {
      reject(new Error(`Invalid URL: ${targetUrl}`));
      return;
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      reject(new Error(`Unsupported protocol: ${parsed.protocol}`));
      return;
    }
    const lib = parsed.protocol === 'https:' ? https : require('http');
    const req = lib.get(
      targetUrl,
      { timeout: timeoutMs, headers: { 'User-Agent': 'speclang-cli' } },
      (res: any) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          // Follow one redirect — registry responses often 301 to a CDN.
          resolve(fetchUrl(new URL(res.headers.location, targetUrl).toString(), timeoutMs));
          return;
        }
        if (status < 200 || status >= 300) {
          reject(new Error(`HTTP ${status}`));
          res.resume();
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        res.on('error', reject);
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.on('error', reject);
  });
}

/**
 * Download skills pack from registry
 *
 * @block:workflow/install @kind:operation
 */
export async function downloadSkills(options: SkillsOptions): Promise<void> {
  const { overwrite = false } = options;
  const registryUrl = options.registryUrl || 'https://api.speclang.dev/skills';
  const skillsPath = path.join(process.env.HOME || '.', '.speclang/skills');
  
  console.log('=== Downloading Skills ===');
  console.log(`Registry: ${registryUrl}`);
  console.log(`Skills path: ${skillsPath}`);
  
  if (!fs.existsSync(skillsPath)) {
    fs.mkdirSync(skillsPath, { recursive: true });
  }
  
  // Resolve the manifest of available skills. We accept either:
  //   1. JSON: an array of {name, version, files?: [{path, content}]}
  //   2. JSON: { skills: [{name, version, files?: [...]}] }
  // If the registry is unreachable we fall back to the known core skills so
  // the offline / first-install experience still works.
  type RemoteSkill = {
    name: string;
    version: string;
    files?: Array<{ path: string; content: string }>;
  };
  
  let remoteSkills: RemoteSkill[] = [];
  let usedFallback = false;
  try {
    const body = await fetchUrl(registryUrl);
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) {
      remoteSkills = parsed as RemoteSkill[];
    } else if (parsed && Array.isArray(parsed.skills)) {
      remoteSkills = parsed.skills as RemoteSkill[];
    } else {
      throw new Error('Registry response is not an array or {skills: [...]}');
    }
    console.log(`Registry reported ${remoteSkills.length} skill(s).`);
  } catch (err) {
    usedFallback = true;
    console.log(`Warning: registry unavailable (${(err as Error).message}). Falling back to core skills.`);
  }
  
  if (usedFallback || remoteSkills.length === 0) {
    remoteSkills = [
      { name: 'SpecWriter', version: '0.1.0' },
      { name: 'CodeGen', version: '0.1.0' },
      { name: 'TestWriter', version: '0.1.0' },
      { name: 'BackSync', version: '0.1.0' },
      { name: 'Orchestrator', version: '0.1.0' }
    ];
  }
  
  let downloaded = 0;
  let skipped = 0;
  
  for (const skill of remoteSkills) {
    const skillPath = path.join(skillsPath, skill.name);
    
    if (fs.existsSync(skillPath) && !overwrite) {
      console.log(`Skipping ${skill.name} (already exists)`);
      skipped++;
      continue;
    }
    
    if (!fs.existsSync(skillPath)) {
      fs.mkdirSync(skillPath, { recursive: true });
    }
    
    // Always (re)write the manifest so version info stays current.
    fs.writeFileSync(
      path.join(skillPath, 'skill.json'),
      JSON.stringify(
        { name: skill.name, version: skill.version, registryUrl },
        null,
        2
      )
    );
    
    // If the registry included file contents, write each one verbatim.
    // Otherwise the directory just gets the manifest, matching the prior
    // placeholder behaviour so downstream tooling doesn't break.
    if (Array.isArray(skill.files)) {
      for (const file of skill.files) {
        const filePath = path.join(skillPath, file.path);
        const fileDir = path.dirname(filePath);
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        fs.writeFileSync(filePath, file.content);
      }
    }
    
    console.log(`Downloaded: ${skill.name} (v${skill.version})`);
    downloaded++;
  }
  
  console.log(`\nSkills downloaded successfully! (${downloaded} downloaded, ${skipped} skipped)`);
}

/**
 * List installed skills
 */
export async function listSkills(): Promise<void> {
  const skillsPath = path.join(process.env.HOME || '.', '.speclang/skills');
  
  console.log('=== Installed Skills ===');
  
  if (!fs.existsSync(skillsPath)) {
    console.log('No skills installed. Run: speclang skills download');
    return;
  }
  
  const skills = fs.readdirSync(skillsPath);
  
  if (skills.length === 0) {
    console.log('No skills installed.');
    return;
  }
  
  for (const skill of skills) {
    const skillPath = path.join(skillsPath, skill);
    const skillJsonPath = path.join(skillPath, 'skill.json');
    
    let version = 'unknown';
    if (fs.existsSync(skillJsonPath)) {
      const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf-8'));
      version = skillJson.version || 'unknown';
    }
    
    console.log(`  ${skill} (v${version})`);
  }
}
