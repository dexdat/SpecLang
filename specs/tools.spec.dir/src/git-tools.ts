/**
speclang-header lines:5
id: @specs/tools
version: 1.0.0
layer: 5
 */

/**
 * SPECLANG-GENERATED: Git Tools
 * Source: @speclang/tools
 * 
 * Git integration tools
 */

import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import {
  Tool,
  ToolContext,
  ToolResult,
  GitCommitInput,
  GitCommitOutput,
  GitStatusInput,
  GitStatusOutput,
} from './types.js';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Execute git command
 */
function gitExec(args: string[]): string {
  try {
    return execSync(`git ${args.join(' ')}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error: any) {
    throw new Error(`Git error: ${error.message}`);
  }
}

/**
 * Check if in git repo
 */
function isGitRepo(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// GIT TOOLS
// ============================================================================

/**
 * Git commit tool - commit changed files
 */
export const gitCommitTool: Tool<GitCommitInput, GitCommitOutput> = {
  name: 'speclang_git_commit',
  description: 'Commit changed files',
  category: 'git',
  requiresOwnership: false,
  auditLog: true,
  inputSchema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Files to commit',
      },
      message: { type: 'string', description: 'Commit message' },
    },
    required: ['files', 'message'],
  },
  handler: async (
    input: GitCommitInput,
    context: ToolContext
  ): Promise<ToolResult<GitCommitOutput>> => {
    const { files, message } = input;

    console.log(`[GitTools] Committing ${files.length} files`);

    try {
      if (!isGitRepo()) {
        return { success: false, error: 'Not a git repository' };
      }

      // Stage files
      const fileArgs = files.map((f) => `"${f}"`).join(' ');
      gitExec(['add', fileArgs]);

      // Commit
      gitExec(['commit', '-m', message]);

      // Get commit hash
      const hash = gitExec(['rev-parse', 'HEAD']);

      return {
        success: true,
        data: { commit_hash: hash },
        sideEffects: ['git_committed'],
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Git status tool - check git status
 */
export const gitStatusTool: Tool<GitStatusInput, GitStatusOutput> = {
  name: 'speclang_git_status',
  description: 'Check git status',
  category: 'git',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (
    _input: GitStatusInput,
    _context: ToolContext
  ): Promise<ToolResult<GitStatusOutput>> => {
    console.log(`[GitTools] Getting git status`);

    try {
      if (!isGitRepo()) {
        return { success: false, error: 'Not a git repository' };
      }

      const statusOutput = gitExec(['status', '--porcelain']);

      const modified: string[] = [];
      const added: string[] = [];
      const deleted: string[] = [];

      if (statusOutput) {
        for (const line of statusOutput.split('\n')) {
          if (!line.trim()) continue;

          const status = line.substring(0, 2);
          const file = line.substring(3);

          if (status.includes('M')) {
            modified.push(file);
          }
          if (status.includes('A')) {
            added.push(file);
          }
          if (status.includes('D')) {
            deleted.push(file);
          }
        }
      }

      return {
        success: true,
        data: { modified, added, deleted },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Git diff tool - get diff of changes
 */
export const gitDiffTool: Tool<{ files?: string[] }, { diff: string }> = {
  name: 'speclang_git_diff',
  description: 'Get git diff',
  category: 'git',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Files to diff (default: all)',
      },
    },
  },
  handler: async (
    input: { files?: string[] },
    _context: ToolContext
  ): Promise<ToolResult<{ diff: string }>> => {
    console.log(`[GitTools] Getting git diff`);

    try {
      if (!isGitRepo()) {
        return { success: false, error: 'Not a git repository' };
      }

      let diff: string;
      if (input.files && input.files.length > 0) {
        const fileArgs = input.files.map((f) => `"${f}"`).join(' ');
        diff = gitExec(['diff', '--no-color', fileArgs]);
      } else {
        diff = gitExec(['diff', '--no-color']);
      }

      return { success: true, data: { diff } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Git log tool - get commit history
 */
export const gitLogTool: Tool<{ limit?: number }, { commits: Array<{ hash: string; message: string; date: string }> }> = {
  name: 'speclang_git_log',
  description: 'Get commit history',
  category: 'git',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Number of commits', default: 10 },
    },
  },
  handler: async (
    input: { limit?: number },
    _context: ToolContext
  ): Promise<ToolResult<{ commits: Array<{ hash: string; message: string; date: string }> }>> => {
    const limit = input.limit || 10;

    console.log(`[GitTools] Getting git log (${limit} commits)`);

    try {
      if (!isGitRepo()) {
        return { success: false, error: 'Not a git repository' };
      }

      const format = '--format=%H|%s|%ad';
      const logOutput = gitExec(['log', `-n${limit}`, format]);

      const commits: Array<{ hash: string; message: string; date: string }> = [];

      if (logOutput) {
        for (const line of logOutput.split('\n')) {
          if (!line.trim()) continue;
          const [hash, message, date] = line.split('|');
          commits.push({ hash, message, date });
        }
      }

      return { success: true, data: { commits } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Git branch tool - get current branch
 */
export const gitBranchTool: Tool<{}, { branch: string }> = {
  name: 'speclang_git_branch',
  description: 'Get current branch',
  category: 'git',
  requiresOwnership: false,
  auditLog: false,
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (
    _input: {},
    _context: ToolContext
  ): Promise<ToolResult<{ branch: string }>> => {
    console.log(`[GitTools] Getting git branch`);

    try {
      if (!isGitRepo()) {
        return { success: false, error: 'Not a git repository' };
      }

      const branch = gitExec(['branch', '--show-current']);

      return { success: true, data: { branch } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Git add tool - stage files
 */
export const gitAddTool: Tool<{ files: string[] }, { staged: number }> = {
  name: 'speclang_git_add',
  description: 'Stage files',
  category: 'git',
  requiresOwnership: false,
  auditLog: true,
  inputSchema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Files to stage',
      },
    },
    required: ['files'],
  },
  handler: async (
    input: { files: string[] },
    _context: ToolContext
  ): Promise<ToolResult<{ staged: number }>> => {
    console.log(`[GitTools] Staging ${input.files.length} files`);

    try {
      if (!isGitRepo()) {
        return { success: false, error: 'Not a git repository' };
      }

      const fileArgs = input.files.map((f) => `"${f}"`).join(' ');
      gitExec(['add', fileArgs]);

      return { success: true, data: { staged: input.files.length } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
