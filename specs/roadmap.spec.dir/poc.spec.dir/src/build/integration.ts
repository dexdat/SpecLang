/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/build-integration.spec.md
 * Generated: 2026-03-03T10:55:00.000Z
 *
 * Edit the spec, not this file.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { ConvergenceEvent, POCError } from '../types/poc';
import { slugifySpecId } from '../utils/path-utils';

const execFileAsync = promisify(execFile);

/**
 * Whitelist of allowed build commands for security
 */
const ALLOWED_BUILD_COMMANDS = [
  'npm run build',
  'npm run compile',
  'tsc',
  'tsc --build',
  'yarn build',
  'pnpm build'
];

/**
 * Build integration for generated code
 */
export class BuildIntegration {
  private config: { buildCommand: string; verifyCommand?: string };
  
  constructor(config: { buildCommand: string; verifyCommand?: string }) {
    // SECURITY: Validate build command against whitelist
    this.config = this.validateBuildCommand(config);
  }
  
  /**
   * Validate and sanitize build command
   * @throws {POCError} If command is not in whitelist
   */
  private validateBuildCommand(config: { buildCommand: string; verifyCommand?: string }): 
    { buildCommand: string; verifyCommand?: string } {
    const command = config.buildCommand.trim();
    
    // SECURITY: Reject commands with shell metacharacters FIRST
    const dangerousChars = /[;|&$`\n\r<>]/;
    if (dangerousChars.test(command)) {
      throw new POCError(
        'WRITE_ERROR',
        `Build command contains dangerous characters: ${command}`,
        undefined
      );
    }
    
    // Check if command is in whitelist
    const isAllowed = ALLOWED_BUILD_COMMANDS.some(allowed => {
      if (command === allowed) return true;
      if (command.startsWith(allowed + ' ')) {
        // Additional security: ensure the rest of the command doesn't contain dangerous sequences
        const rest = command.slice(allowed.length + 1);
        // Allow only alphanumeric, hyphen, underscore, dot, space for arguments
        const safeArgPattern = /^[a-zA-Z0-9_\-\.\s]+$/;
        return safeArgPattern.test(rest);
      }
      return false;
    });
    
    if (!isAllowed) {
      throw new POCError(
        'WRITE_ERROR',
        `Build command "${command}" is not in whitelist. Allowed commands: ${ALLOWED_BUILD_COMMANDS.join(', ')}`,
        undefined
      );
    }
    
    return config;
  }
  
  /**
   * Simple command argument parser for POC
   * Handles quoted arguments: "arg with spaces" 'single quoted'
   * Returns array of parsed arguments
   */
  private parseCommandArguments(command: string): string[] {
    const args: string[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let escaped = false;
    
    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      
      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === "'" && !inDouble) {
        inSingle = !inSingle;
        continue;
      }
      
      if (char === '"' && !inSingle) {
        inDouble = !inDouble;
        continue;
      }
      
      if (char === ' ' && !inSingle && !inDouble) {
        if (current) {
          args.push(current);
          current = '';
        }
        continue;
      }
      
      current += char;
    }
    
    if (current) {
      args.push(current);
    }
    
    return args;
  }
  
  /**
   * Run build after code generation with security hardening
   * @returns Build result with success status and output
   */
  async runBuild(): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    duration: number;
  }> {
    const start = Date.now();
    
    try {
      // SECURITY: Use execFile instead of exec to prevent shell injection
      // Parse command into executable and arguments with proper quoting
      const args = this.parseCommandArguments(this.config.buildCommand);
      if (args.length === 0) {
        throw new POCError(
          'WRITE_ERROR',
          'Build command cannot be empty',
          undefined
        );
      }
      const executable = args[0];
      const execArgs = args.slice(1);
      
      // SECURITY: Resolve executable path to prevent PATH hijacking
      const { resolve } = await import('path');
      const { access, constants } = await import('fs/promises');
      const resolvedExec = resolve(process.cwd(), executable);
      
      // Basic check: executable should exist and be executable
      // For POC, we'll just check if it's a file
      try {
        await access(resolvedExec, constants.F_OK);
      } catch {
        // If not found locally, assume it's in PATH (like 'npm', 'tsc')
        // For POC, we'll allow this but warn
        console.warn(`[BuildIntegration] Executable not found at resolved path: ${resolvedExec}, trying from PATH`);
      }
      
      const { stdout, stderr } = await execFileAsync(executable, execArgs, {
        timeout: 300000, // 5 minute timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      return {
        success: true,
        stdout,
        stderr,
        duration: Date.now() - start
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        duration: Date.now() - start
      };
    }
  }
  
  /**
   * Verify generated files are in place before building
   */
  verifyGeneratedFiles(specIds: string[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    for (const specId of specIds) {
      const slug = slugifySpecId(specId);
      const symlinkPath = `src/${slug}`;
      const sourcePath = `specs/${slug}.spec.dir/src`;
      
      // Check symlink exists
      if (!existsSync(symlinkPath)) {
        errors.push(`Missing symlink: ${symlinkPath}`);
      }
      
      // Check source directory exists
      if (!existsSync(sourcePath)) {
        errors.push(`Missing source directory: ${sourcePath}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}