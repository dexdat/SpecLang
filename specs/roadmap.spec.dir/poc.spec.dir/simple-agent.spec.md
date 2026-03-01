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
import { FileEvent, ParsedSpec } from './types';
import { BlockParser } from './block-parser';
import { CodeGenerator } from './code-generator';
import { symlink, unlink, mkdir, writeFile } from 'fs/promises';
import { platform } from 'os';

export class SimpleAgent {
  private parser: BlockParser;
  private generator: CodeGenerator;
  private activeSpecs: Map<string, Promise<void>> = new Map();  // Track in-progress operations per spec
  
  constructor() {
    this.parser = new BlockParser();
    this.generator = new CodeGenerator();
  }
  
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
    
    // RACE CONDITION FIX: Prevent concurrent processing of same spec
    // If this spec is already being processed, wait for it to complete
    const existingOperation = this.activeSpecs.get(specSlug);
    if (existingOperation) {
      console.log(`[SimpleAgent] Waiting for existing operation on ${specSlug}...`);
      await existingOperation;
    }
    
    // Create new operation promise
    const operation = this.processSpec(spec, specSlug, event.path);
    this.activeSpecs.set(specSlug, operation);
    
    try {
      await operation;
    } finally {
      // Clean up when done
      this.activeSpecs.delete(specSlug);
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
      
      for (const block of spec.blocks) {
        try {
          const code = this.generator.generate(spec.id, block);
          const outputPath = await this.writeCode(specSlug, block.id, code);
          generatedFiles.push(outputPath);
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
   * Copy directory contents (Windows fallback)
   */
  private async copyDirectory(source: string, destination: string): Promise<void> {
    const { copyFile, mkdir } = await import('fs/promises');
    const { readdir } = await import('fs/promises');
    
    await mkdir(destination, { recursive: true });
    const files = await readdir(source);
    
    for (const file of files) {
      await copyFile(`${source}/${file}`, `${destination}/${file}`);
    }
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
