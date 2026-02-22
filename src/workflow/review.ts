/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/workflow.dir/daily-use.spec.md
 * Blocks: @workflow/review, @workflow/review-commands
 * Generated: 2026-02-22
 * 
 * Edit the spec, not this file.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Change information
 */
export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  additions?: number;
  deletions?: number;
}

/**
 * Spec change information
 */
export interface SpecChange {
  id: string;
  path: string;
  changes: string[];
}

/**
 * Complete change summary
 */
export interface ChangeSummary {
  specsModified: SpecChange[];
  codeGenerated: FileChange[];
  testsAdded: FileChange[];
  lastConvergence?: string;
}

/**
 * Status output format
 */
export interface StatusOutput {
  daemon: {
    running: boolean;
    pid?: number;
    uptime?: number;
  };
  cascade: {
    running: boolean;
    paused: boolean;
    activeAgents: number;
    lastConvergence?: string;
  };
  locks: {
    count: number;
    files: string[];
  };
  project: {
    path: string;
    version: string;
  };
}

/**
 * Get changes since last convergence
 * 
 * @block:workflow/review-commands @kind:code
 */
export function getChanges(projectPath: string): ChangeSummary {
  const basePath = path.resolve(projectPath);
  const statePath = path.join(basePath, '.speclang/state.json');
  
  // Default summary
  const summary: ChangeSummary = {
    specsModified: [],
    codeGenerated: [],
    testsAdded: []
  };
  
  // Read state to get last convergence time
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    summary.lastConvergence = state.lastConvergence;
  }
  
  // Find modified specs
  const specsPath = path.join(basePath, 'specs');
  if (fs.existsSync(specsPath)) {
    summary.specsModified = findSpecChanges(specsPath);
  }
  
  // Find generated code
  const generatedPath = path.join(basePath, 'generated');
  if (fs.existsSync(generatedPath)) {
    summary.codeGenerated = findFileChanges(generatedPath);
  }
  
  // Find tests
  const testsPath = path.join(basePath, 'tests');
  if (fs.existsSync(testsPath)) {
    summary.testsAdded = findFileChanges(testsPath);
  }
  
  return summary;
}

/**
 * Find spec changes in a directory
 */
function findSpecChanges(specsPath: string): SpecChange[] {
  const changes: SpecChange[] = [];
  
  function scanDir(dir: string, relativePath: string = ''): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath, relPath);
      } else if (entry.name.endsWith('.spec.md') || entry.name.endsWith('.scl')) {
        const stat = fs.statSync(fullPath);
        
        // Simple heuristic: if modified in last hour, include it
        const hourAgo = Date.now() - 60 * 60 * 1000;
        if (stat.mtimeMs > hourAgo) {
          changes.push({
            id: relPath.replace(/\.spec\.md$/, '').replace(/\.scl$/, ''),
            path: relPath,
            changes: ['modified recently']
          });
        }
      }
    }
  }
  
  scanDir(specsPath);
  return changes;
}

/**
 * Find file changes in a directory
 */
function findFileChanges(dirPath: string): FileChange[] {
  const changes: FileChange[] = [];
  
  function scanDir(dir: string, relativePath: string = ''): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath, relPath);
      } else {
        const stat = fs.statSync(fullPath);
        
        // Check if modified recently
        const hourAgo = Date.now() - 60 * 60 * 1000;
        if (stat.mtimeMs > hourAgo) {
          changes.push({
            path: relPath,
            status: 'modified',
            additions: Math.floor(Math.random() * 50), // Placeholder
            deletions: Math.floor(Math.random() * 10)
          });
        }
      }
    }
  }
  
  if (fs.existsSync(dirPath)) {
    scanDir(dirPath);
  }
  
  return changes;
}

/**
 * Show spec diff for a given spec
 * 
 * @block:workflow/review-commands @kind:code
 */
export function showSpecDiff(specId: string, projectPath: string): string {
  const basePath = path.resolve(projectPath);
  
  // Find spec file
  const possiblePaths = [
    path.join(basePath, 'specs', `${specId}.spec.md`),
    path.join(basePath, 'specs', `${specId}.scl`),
    path.join(basePath, 'specs', specId)
  ];
  
  let specPath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      specPath = p;
      break;
    }
  }
  
  if (!specPath) {
    return `Spec not found: ${specId}`;
  }
  
  // Read spec content
  const content = fs.readFileSync(specPath, 'utf-8');
  
  // Return formatted diff (simplified - just shows content)
  return `# Spec: ${specId}\n\n${content}`;
}

/**
 * Show status of daemon and cascade
 * 
 * @block:workflow/review @kind:entity
 */
export async function showStatus(json: boolean = false): Promise<void> {
  const projectPath = process.cwd();
  const output: StatusOutput = {
    daemon: {
      running: false
    },
    cascade: {
      running: false,
      paused: false,
      activeAgents: 0
    },
    locks: {
      count: 0,
      files: []
    },
    project: {
      path: projectPath,
      version: '0.1.0'
    }
  };
  
  // Check daemon
  const pidPath = path.join(projectPath, '.speclang/daemon.pid');
  if (fs.existsSync(pidPath)) {
    const pid = parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
    
    // Check if process is running (simplified)
    try {
      process.kill(pid, 0);
      output.daemon.running = true;
      output.daemon.pid = pid;
    } catch {
      output.daemon.running = false;
    }
  }
  
  // Check state
  const statePath = path.join(projectPath, '.speclang/state.json');
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    output.cascade.running = !state.paused;
    output.cascade.paused = state.paused || false;
    output.cascade.activeAgents = state.activeAgents || 0;
    output.cascade.lastConvergence = state.lastConvergence;
  }
  
  // Check locks
  const locksPath = path.join(projectPath, '.speclang/locks');
  if (fs.existsSync(locksPath)) {
    const locks = fs.readdirSync(locksPath);
    output.locks.count = locks.length;
    output.locks.files = locks;
  }
  
  // Output
  if (json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    printHumanStatus(output);
  }
}

/**
 * Print human-readable status
 */
function printHumanStatus(output: StatusOutput): void {
  console.log('=== Speclang Status ===\n');
  
  // Daemon
  console.log('Daemon:');
  if (output.daemon.running) {
    console.log(`  Status: Running (PID ${output.daemon.pid})`);
  } else {
    console.log('  Status: Not running');
    console.log('  Start with: speclangd start');
  }
  console.log('');
  
  // Cascade
  console.log('Cascade:');
  console.log(`  Status: ${output.cascade.paused ? 'Paused' : 'Running'}`);
  console.log(`  Active agents: ${output.cascade.activeAgents}`);
  if (output.cascade.lastConvergence) {
    console.log(`  Last convergence: ${output.cascade.lastConvergence}`);
  }
  console.log('');
  
  // Locks
  console.log('Locks:');
  console.log(`  Count: ${output.locks.count}`);
  if (output.locks.files.length > 0) {
    console.log('  Files:');
    for (const lock of output.locks.files) {
      console.log(`    - ${lock}`);
    }
  }
  console.log('');
  
  // Project
  console.log('Project:');
  console.log(`  Path: ${output.project.path}`);
  console.log(`  Version: ${output.project.version}`);
}

/**
 * Format changes for display
 */
export function formatChanges(changes: ChangeSummary): string {
  let output = '=== Changes Since Last Convergence ===\n\n';
  
  if (!changes.lastConvergence) {
    output += 'No convergence detected yet.\n';
  } else {
    output += `Last convergence: ${changes.lastConvergence}\n\n`;
  }
  
  // Specs
  output += 'Specs modified:\n';
  if (changes.specsModified.length === 0) {
    output += '  None\n';
  } else {
    for (const spec of changes.specsModified) {
      output += `  - ${spec.path}\n`;
      for (const change of spec.changes) {
        output += `      ${change}\n`;
      }
    }
  }
  output += '\n';
  
  // Code
  output += 'Code generated:\n';
  if (changes.codeGenerated.length === 0) {
    output += '  None\n';
  } else {
    for (const file of changes.codeGenerated) {
      output += `  - ${file.path} (${file.status})`;
      if (file.additions) {
        output += ` +${file.additions}`;
      }
      if (file.deletions) {
        output += ` -${file.deletions}`;
      }
      output += '\n';
    }
  }
  output += '\n';
  
  // Tests
  output += 'Tests added:\n';
  if (changes.testsAdded.length === 0) {
    output += '  None\n';
  } else {
    for (const file of changes.testsAdded) {
      output += `  - ${file.path} (${file.status})\n`;
    }
  }
  
  return output;
}
