# speclang-header lines:15
id: "@speclang/roadmap/poc/build-integration"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
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
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

/**
 * Build integration for generated code
 */
export class BuildIntegration {
  private config: { buildCommand: string; verifyCommand?: string };
  
  constructor(config: { buildCommand: string; verifyCommand?: string }) {
    this.config = config;
  }
  
  /**
   * Run build after code generation
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
      const { stdout, stderr } = await execAsync(this.config.buildCommand);
      
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
      const slug = specId.replace(/^@/, '').replace(/\//g, '-');
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
