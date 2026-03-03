# speclang-header lines:12
id: "@speclang/roadmap/poc/simple-agent"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Simple single agent for POC - converts specs to code"
tags: [poc, agent, simple, demo]
---

# POC: Simple Agent

A single agent that converts spec changes to code. **Simplified for POC** - no multi-agent coordination needed.

## Concept

For the POC, we use **one agent** that does everything:
1. Detects spec changes
2. Parses spec blocks
3. Generates code
4. Creates symlinks

**Why simple?** We want to demonstrate the cascade effect without the complexity of multi-agent coordination.

## Agent Responsibilities

### @poc/simple-agent/tasks

**On File Change:**
1. Read the changed spec file
2. Parse `@block:` definitions
3. Generate corresponding TypeScript
4. Write to `specs/{name}.spec.dir/src/`
5. Create/update symlink in `src/`

**No queuing needed for POC** - process synchronously.

## Spec ID Slugification

### @poc/simple-agent/slugification

**Problem:** Spec IDs like `@examples/greeting` contain invalid path characters (`@` and `/`)

**Solution:** Use `slugifySpecId` from path-utils to create filesystem-safe slugs

**Transformation:**
```
@examples/greeting     → examples-greeting
@speclang/core/types   → speclang-core-types
@my-spec              → my-spec
```

**Import:**
```typescript
import { slugifySpecId } from './path-utils';
```

## Simple Implementation

### @poc/simple-agent/impl

```typescript
import { FileEvent, ParsedSpec, SpecHeader } from './types';
import { BlockParser } from './block-parser';
import { CodeGenerator } from './code-generator';
import { slugifySpecId } from './path-utils';
import { symlink, unlink, mkdir, writeFile, cp } from 'fs/promises';
import { platform } from 'os';

export class SimpleAgent {
  private parser: BlockParser;
  private generator: CodeGenerator;
  
  constructor() {
    this.parser = new BlockParser();
    this.generator = new CodeGenerator();
  }
  
  /**
   * Acquire lock for a spec slug to prevent concurrent processing
   * Uses atomic check-and-set with queue for proper mutual exclusion
   */
  private async acquireLock(specSlug: string): Promise<() => void> {
    // Validate specSlug is not empty
    if (!specSlug || specSlug.trim() === '') {
      throw new POCError('VALIDATION_ERROR', 'specSlug cannot be empty', undefined);
    }
    
    // Create a promise that will resolve when lock is acquired
    let resolveLock: () => void;
    const lockPromise = new Promise<void>(resolve => {
      resolveLock = resolve;
    });
    
    // Get or create the queue for this spec
    let queue = this.lockQueues.get(specSlug);
    if (!queue) {
      queue = [];
      this.lockQueues.set(specSlug, queue);
    }
    
    // Add ourselves to the queue
    queue.push(resolveLock);
    
    // If we're not first in line, wait for our turn
    if (queue.length > 1) {
      await lockPromise;
    }
    
    // Return release function
    return () => {
      // Remove ourselves from queue
      queue.shift();
      
      // Resolve the next waiter if any
      if (queue.length > 0) {
        const nextResolve = queue[0];
        nextResolve();
      } else {
        // Clean up empty queue
        this.lockQueues.delete(specSlug);
      }
    };
  }
  
  // Lock queues for each spec (ensures FIFO order and proper mutual exclusion)
  private lockQueues = new Map<string, Array<() => void>>();
  
  /**
   * Handle file change event
   * Processes spec file and generates code
   */
  async onFileChanged(event: FileEvent): Promise<void> {
    console.log(`[SimpleAgent] Processing: ${event.path}`);
    
    // 1. Parse spec to get ID
    let spec;
    try {
      spec = await this.parser.parseFile(event.path);
    } catch (error) {
      console.error(`[SimpleAgent] Failed to parse ${event.path}:`, error);
      throw error;
    }
    
    const specSlug = slugifySpecId(spec.id);
    
    // Acquire lock for this spec to prevent concurrent processing
    const releaseLock = await this.acquireLock(specSlug);
    try {
      await this.processSpec(spec, specSlug, event.path);
    } finally {
      releaseLock();
    }
  }
  
  /**
   * Process a spec (internal method with locking)
   */
  private async processSpec(spec: ParsedSpec, specSlug: string, filePath: string): Promise<void> {
    try {
      // 1. Generate code for each block
      const generatedFiles: string[] = [];
      const errors: Array<{ blockId: string; error: Error }> = [];
      
      // Build header from spec
      const header: SpecHeader = {
        id: spec.id,
        version: spec.version,
        layer: 0, // Default layer
        short: spec.short || '',
        tags: [],
        lineCount: spec.headerLines.length,
        rawHeader: spec.headerLines.join('\n')
      };
      
      for (const block of spec.blocks) {
        try {
          const generatedFile = await this.generator.generate(spec.id, header, block);
          generatedFiles.push(generatedFile.path);
        } catch (error) {
          console.error(`[SimpleAgent] Failed to generate ${block.id}:`, error);
          errors.push({ blockId: block.id, error: error as Error });
        }
      }
      
      // 2. Create/update symlinks (with file locking)
      await this.updateSymlinks(specSlug);
      
      // 3. Report results
      if (errors.length > 0) {
        console.warn(`⚠️  Generated ${generatedFiles.length} files, ${errors.length} failed for ${spec.id}`);
        throw new AggregateError(
          errors.map(e => e.error),
          `Failed to generate ${errors.length} blocks: ${errors.map(e => e.blockId).join(', ')}`
        );
      } else {
        console.log(`✅ Generated ${generatedFiles.length} files for ${spec.id}`);
      }
    } catch (error) {
      console.error(`[SimpleAgent] Error processing ${filePath}:`, error);
      throw error;
    }
  }
  
  /**
   * Write generated code to spec directory
   */
  private async writeCode(specSlug: string, blockId: string, code: string): Promise<string> {
    const dir = `specs/${specSlug}.spec.dir/src`;
    const filePath = `${dir}/${blockId}.ts`;
    
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, code, 'utf-8');
    
    return filePath;
  }
  
  /**
   * Create or update symlinks
   * Falls back to copy on Windows if symlinks fail
   */
  private async updateSymlinks(specSlug: string): Promise<void> {
    const srcPath = `src/${specSlug}`;
    const targetPath = `../specs/${specSlug}.spec.dir/src`;
    
    // Remove existing if present
    try { 
      await unlink(srcPath); 
    } catch { 
      // File might not exist, ignore
    }
    
    // Check platform for Windows
    const isWindows = platform() === 'win32';
    
    if (isWindows) {
      // On Windows, try symlink but fallback to copy if needed
      try {
        await symlink(targetPath, srcPath, 'junction');
      } catch (error) {
        console.log(`[SimpleAgent] Symlink failed on Windows, using copy instead`);
        // Windows fallback: copy files instead of symlink
        await this.copyDirectory(`specs/${specSlug}.spec.dir/src`, srcPath);
      }
    } else {
      // Unix/Mac: standard symlink
      await symlink(targetPath, srcPath);
    }
  }
  
  /**
   * Copy directory contents recursively (Windows fallback)
   */
  private async copyDirectory(source: string, destination: string): Promise<void> {
    // Use recursive copy (Node 16+)
    await cp(source, destination, { recursive: true, force: true });
  }
}
```

## Demo Flow

### @poc/simple-agent/demo

**User edits spec:**
```bash
# User edits specs/hello.spec.md
echo "### @block:greet @kind:function" >> specs/hello.spec.md
```

**Agent detects:**
```
[FileWatcher] Change detected: specs/hello.spec.md
[SimpleAgent] Parsing spec...
[SimpleAgent] Found block: greet
[SimpleAgent] Generating code...
[SimpleAgent] Writing to specs/hello.spec.dir/src/greet.ts
[SimpleAgent] Creating symlink: src/hello → specs/hello.spec.dir/src
[SimpleAgent] ✅ Done in 500ms
```

**Result:**
```
specs/
  hello.spec.md          # User's spec
  hello.spec.dir/
    src/
      greet.ts           # Generated code
      
src/
  hello → ../specs/hello.spec.dir/src  # Symlink
```

## Simplifications for POC

- ✅ Single agent (no coordination)
- ✅ Synchronous processing (no queues)
- ✅ One-to-one spec-to-code mapping
- ✅ No validation for POC (add in MVP)
- ✅ No rollback for POC (add in Alpha)

## Success Criteria

✅ **Simple Flow**
```
Given: User edits specs/demo.spec.md
When: File is saved
Then: Code generated in < 2 seconds
And: Symlink created in src/
And: Code compiles with npm run build
```
