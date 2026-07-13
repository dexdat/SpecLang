# speclang-header lines:7
id: "@speclang/roadmap/poc/simple-agent"
parent: "@ref:specs/roadmap/pocversion: 0.1.0
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

## Implementation

### @poc/simple-agent/impl

```typescript
import { FileEvent, ParsedSpec, SpecHeader, BlockData, GeneratedFile, POCError } from '../types/poc';
import { BlockParser } from '../parser/block-parser';
import { CodeGenerator } from '../codegen/generator';
import { slugifySpecId } from '../utils/path-utils';
import { symlink, unlink, mkdir, cp } from 'fs/promises';
import { platform } from 'os';

export class SimpleAgent {
  private parser: BlockParser;
  private generator: CodeGenerator;
  
  constructor() {
    this.parser = new BlockParser();
    // Initialize code generator with default registry
    this.generator = new CodeGenerator({ registry: new TemplateRegistry() });
  }
  
  /**
   * Handle file change event
   * Processes spec file and generates code
   */
  async onFileChanged(event: FileEvent): Promise<void> {
    console.log(`[SimpleAgent] Processing: ${event.path}`);
    
    // 1. Parse spec to get ID
    let spec: ParsedSpec;
    try {
      spec = await this.parser.parseFile(event.path);
    } catch (error) {
      console.error(`[SimpleAgent] Failed to parse ${event.path}:`, error);
      throw error;
    }

    const specSlug = slugifySpecId(spec.id);
    
    try {
      await this.processSpec(spec, specSlug, event.path);
    } catch (error) {
      console.error(`[SimpleAgent] Error processing ${event.path}:`, error);
      throw error;
    }
  }
  
  /**
   * Process a spec (internal method)
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
          const blockData: BlockData = {
            id: block.id,
            kind: block.kind,
            description: block.description,
            parameters: block.parameters,
            properties: block.properties,
            returns: block.returns,
            examples: block.examples,
            rawContent: block.rawContent
          };
          const generatedFile = await this.generator.generate(spec.id, header, blockData);
          generatedFiles.push(generatedFile.path);
        } catch (error) {
          console.error(`[SimpleAgent] Failed to generate ${block.id}:`, error);
          errors.push({ blockId: block.id, error: error as Error });
        }
      }
      
      // 2. Create/update symlinks
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
echo "### @block::greet @kind:function" >> specs/hello.spec.md
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
