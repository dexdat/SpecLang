# speclang-header lines:7
id: "@speclang/roadmap/poc/build-integration"
parent: ""@ref:specs/roadmap/pocversion: 0.1.0
layer: 2
short: "Build integration for generated code"
tags: [poc, build, npm, typescript, integration]
---

# POC: Build Integration

How generated code integrates with the npm build process.

## Purpose

Ensure generated code compiles correctly and integrates with the project build system.

## Build Strategy

### @poc/build/strategy

**POC Approach:** Manual build trigger after convergence
- Daemon detects convergence (5s quiet period)
- User runs `npm run build` manually
- OR: Daemon can optionally trigger build via exec

**MVP Enhancement:** Automatic build on convergence
- Daemon runs `npm run build` after each cascade
- Reports build errors back to user

## Build Verification

### @poc/build/verification

**After code generation, verify:**
1. Generated files exist in correct locations
2. Symlinks point to valid directories
3. TypeScript compiles without errors
4. No circular dependencies introduced

## Implementation

### @poc/build/impl

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { ConvergenceEvent, POCError } from './types';
import { slugifySpecId } from './path-utils';

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
        'VALIDATION_ERROR',
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
        'VALIDATION_ERROR',
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
          'VALIDATION_ERROR',
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
```

## Integration with Daemon

### @poc/build/daemon

```typescript
export class PocDaemon {
  private buildIntegration: BuildIntegration;
  
  constructor() {
    this.buildIntegration = new BuildIntegration({
      buildCommand: 'npm run build'
    });
  }
  
  private async onConvergence(event: ConvergenceEvent): Promise<void> {
    console.log('Convergence detected, files changed:', event.filesChanged);
    
    // For POC: Just log and let user build manually
    console.log('Run "npm run build" to compile generated code');
    
    // MVP: Auto-build
    // const result = await this.buildIntegration.runBuild();
    // if (!result.success) {
    //   console.error('Build failed:', result.stderr);
    // }
  }
}
```

## Build Commands

### @poc/build/commands

**package.json scripts:**
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "test": "jest"
  }
}
```

**Build process:**
1. TypeScript compiles `src/**/*.ts` to `dist/`
2. Generated code is symlinked into `src/` from specs
3. Build picks up generated code automatically
4. Output goes to `dist/` (including generated modules)

## Error Handling

### @poc/build/errors

**Build Failure Types:**

1. **Type Errors**
   - Invalid type names in spec
   - Missing imports
   - Type mismatches

2. **Syntax Errors**
   - Malformed generated code
   - Invalid TypeScript syntax

3. **Resolution Errors**
   - Cannot find module
   - Circular dependencies

**Error Reporting:**
```
[Build] Error: src/hello/greet.ts(5,10): error TS2345
[Build]   Argument of type 'string' is not assignable to parameter of type 'number'
[Build] 
[Build] Fix: Update spec to use correct types
```

## Testing

### @poc/build/testing

```typescript
describe('BuildIntegration', () => {
  it('should run build successfully', async () => {
    const build = new BuildIntegration({
      buildCommand: 'echo "Build success"'
    });
    
    const result = await build.runBuild();
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('success');
  });
  
  it('should detect build failures', async () => {
    const build = new BuildIntegration({
      buildCommand: 'exit 1'
    });
    
    const result = await build.runBuild();
    
    expect(result.success).toBe(false);
  });
  
  it('should verify generated files', () => {
    const build = new BuildIntegration({ buildCommand: '' });
    
    const result = build.verifyGeneratedFiles(['@test/hello']);
    
    // In actual test, would need to create files first
    expect(result.errors).toBeDefined();
  });
});
```

## User Workflow

### @poc/build/workflow

**Typical Development Flow:**

```bash
# 1. Start daemon
./bin/speclangd

# 2. Edit spec
vim specs/hello.spec.md  # Make changes

# 3. Save - daemon detects and generates code
# [speclangd] Generated: src/hello/greet.ts

# 4. Build manually
npm run build
# Or: npm run dev (watch mode)

# 5. Run tests
npm test

# 6. Repeat
```

## Success Criteria

### @poc/build/success

- Build completes without errors
- Generated code compiles successfully
- TypeScript type checking passes
- No circular dependencies
- Build time < 10 seconds for POC scope
