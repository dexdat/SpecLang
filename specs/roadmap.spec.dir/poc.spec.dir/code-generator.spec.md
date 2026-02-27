# speclang-header lines:15
id: "@speclang/roadmap/poc/code-generator"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Code generator orchestrator - ties templates to file output"
tags: [poc, codegen, generator, orchestration]
---

# POC: Code Generator

Orchestrates code generation from spec blocks to output files.

## Purpose

The `CodeGenerator` is the bridge between parsed specs and generated code:
1. Takes parsed block data
2. Selects appropriate template
3. Renders code
4. Writes to filesystem
5. Creates symlinks

## Dependencies

### @poc/codegen/dependencies

```typescript
import { TemplateRegistry } from './template-registry';
import { BlockData, GeneratedFile, SpecHeader } from './types';
import { slugifySpecId } from './path-utils';
import { mkdir, writeFile, symlink, unlink } from 'fs/promises';
import { dirname, join } from 'path';
import { platform } from 'os';
```

## Class Interface

### @poc/codegen/class

```typescript
/**
 * Code generator orchestrator
 * Coordinates templates, file I/O, and symlink creation
 */
export class CodeGenerator {
  private registry: TemplateRegistry;
  private outputDir: string;
  
  constructor(options: {
    registry: TemplateRegistry;
    outputDir?: string;
  }) {
    this.registry = options.registry;
    this.outputDir = options.outputDir || './src';
  }
  
  /**
   * Generate code for a single block
   * @param specId - Full spec ID (e.g., "@examples/greeting")
   * @param header - Parsed spec header
   * @param block - Parsed block data
   * @returns Generated file metadata
   */
  async generate(
    specId: string,
    header: SpecHeader,
    block: BlockData
  ): Promise<GeneratedFile> {
    // 1. Get template for block kind
    const template = this.registry.get(block.kind);
    
    // 2. Render code
    const code = template(block);
    
    // 3. Add file header
    const fullCode = this.addFileHeader(code, specId, block, header);
    
    // 4. Determine output path
    const outputPath = this.resolveOutputPath(specId, block.id);
    
    // 5. Ensure directory exists
    await mkdir(dirname(outputPath), { recursive: true });
    
    // 6. Write file
    await writeFile(outputPath, fullCode, 'utf-8');
    
    // 7. Create/update symlink
    await this.createSymlink(specId);
    
    return {
      path: outputPath,
      content: fullCode,
      specId,
      blockId: block.id,
      generatedAt: Date.now()
    };
  }
  
  /**
   * Generate code for all blocks in a spec
   * @param specId - Full spec ID
   * @param header - Parsed spec header  
   * @param blocks - Array of parsed blocks
   * @returns Array of generated files
   */
  async generateAll(
    specId: string,
    header: SpecHeader,
    blocks: BlockData[]
  ): Promise<GeneratedFile[]> {
    const generated: GeneratedFile[] = [];
    
    for (const block of blocks) {
      try {
        const file = await this.generate(specId, header, block);
        generated.push(file);
      } catch (error) {
        console.error(`[CodeGenerator] Failed to generate ${block.id}:`, error);
        // Continue with other blocks
      }
    }
    
    // Generate barrel export after all blocks
    await this.generateBarrelExport(specId, blocks);
    
    return generated;
  }
  
  /**
   * Add SPECLANG-GENERATED header to code
   */
  private addFileHeader(
    code: string,
    specId: string,
    block: BlockData,
    header: SpecHeader
  ): string {
    return `// SPECLANG-GENERATED: ${block.kind}
// Source: ${specId}#${block.id}
// Version: ${header.version}
// DO NOT EDIT MANUALLY - Changes will be overwritten

${code}`;
  }
  
  /**
   * Resolve output file path
   * Pattern: specs/{slug}.spec.dir/src/{blockId}.ts
   */
  private resolveOutputPath(specId: string, blockId: string): string {
    const slug = slugifySpecId(specId);
    return join('specs', `${slug}.spec.dir`, 'src', `${blockId}.ts`);
  }
  
  /**
   * Create or update symlink
   * Source: specs/{slug}.spec.dir/src
   * Target: src/{slug}
   */
  private async createSymlink(specId: string): Promise<void> {
    const slug = slugifySpecId(specId);
    const linkPath = join(this.outputDir, slug);
    const targetPath = join('..', 'specs', `${slug}.spec.dir`, 'src');
    
    // Remove existing symlink if present
    try {
      await unlink(linkPath);
    } catch {
      // File might not exist
    }
    
    // Platform-specific symlink
    const isWindows = platform() === 'win32';
    
    if (isWindows) {
      try {
        await symlink(targetPath, linkPath, 'junction');
      } catch (error) {
        // Fallback: copy files instead
        console.log(`[CodeGenerator] Symlink failed on Windows, using copy`);
        await this.copyDirectory(
          join('specs', `${slug}.spec.dir`, 'src'),
          linkPath
        );
      }
    } else {
      await symlink(targetPath, linkPath);
    }
  }
  
  /**
   * Generate barrel export (index.ts)
   * Exports all generated blocks from the spec
   */
  private async generateBarrelExport(
    specId: string,
    blocks: BlockData[]
  ): Promise<void> {
    const slug = slugifySpecId(specId);
    const indexPath = join('specs', `${slug}.spec.dir`, 'src', 'index.ts');
    
    // Generate exports
    const exports = blocks
      .map(block => `export * from './${block.id}';`)
      .join('\n');
    
    const content = `// SPECLANG-GENERATED: barrel export
// Source: ${specId}
// DO NOT EDIT MANUALLY

${exports}
`;
    
    await writeFile(indexPath, content, 'utf-8');
  }
  
  /**
   * Copy directory (Windows fallback)
   */
  private async copyDirectory(source: string, dest: string): Promise<void> {
    const { readdir, copyFile, mkdir } = await import('fs/promises');
    
    await mkdir(dest, { recursive: true });
    const files = await readdir(source);
    
    for (const file of files) {
      await copyFile(join(source, file), join(dest, file));
    }
  }
}
```

## Usage Examples

### @poc/codegen/examples

**Generate single block:**
```typescript
const registry = new TemplateRegistry();
const generator = new CodeGenerator({ registry, outputDir: './src' });

const file = await generator.generate(
  '@examples/greeting',
  header,
  {
    id: 'greet',
    kind: 'function',
    description: 'Greets a user',
    parameters: [{ name: 'name', type: 'string', description: 'User name' }],
    returns: { type: 'string', description: 'Greeting' },
    rawContent: ''
  }
);

console.log(`Generated: ${file.path}`);
// → specs/examples-greeting.spec.dir/src/greet.ts
```

**Generate all blocks:**
```typescript
const files = await generator.generateAll(
  '@examples/greeting',
  header,
  parsedBlocks
);

console.log(`Generated ${files.length} files`);
// Also creates: specs/examples-greeting.spec.dir/src/index.ts (barrel)
// Also creates: src/examples-greeting → specs/examples-greeting.spec.dir/src (symlink)
```

## Output Structure

### @poc/codegen/output

**Generated Structure:**
```
specs/
  examples-greeting.spec.md          # User spec
  examples-greeting.spec.dir/        # Generated directory
    src/
      greet.ts                       # Generated from @block:greet
      farewell.ts                    # Generated from @block:farewell
      index.ts                       # Barrel export (auto-generated)

src/
  examples-greeting → ../specs/examples-greeting.spec.dir/src  # Symlink
```

**Generated File Format:**
```typescript
// SPECLANG-GENERATED: function
// Source: @examples/greeting#greet
// Version: 1.0.0
// DO NOT EDIT MANUALLY - Changes will be overwritten

/**
 * Greets a user
 * @param name - User name
 * @returns Greeting message
 */
export function greet(name: string): string {
  // TODO: Implement
  throw new Error('Not implemented: greet');
}
```

## Testing

### @poc/codegen/testing

```typescript
describe('CodeGenerator', () => {
  let generator: CodeGenerator;
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codegen-test-'));
    const registry = new TemplateRegistry();
    generator = new CodeGenerator({ 
      registry,
      outputDir: path.join(tempDir, 'src')
    });
  });
  
  it('should generate code file', async () => {
    const file = await generator.generate(
      '@test/hello',
      { id: '@test/hello', version: '1.0.0', layer: 5, short: 'Test', lineCount: 5, rawHeader: '' },
      {
        id: 'greet',
        kind: 'function',
        description: 'Greets',
        parameters: [],
        rawContent: ''
      }
    );
    
    expect(file.path).toContain('test-hello.spec.dir/src/greet.ts');
    expect(file.content).toContain('SPECLANG-GENERATED');
    expect(file.content).toContain('export function greet');
  });
  
  it('should create symlink', async () => {
    await generator.generate('@test/hello', header, block);
    
    const symlinkPath = path.join(tempDir, 'src', 'test-hello');
    const stats = await fs.lstat(symlinkPath);
    expect(stats.isSymbolicLink()).toBe(true);
  });
  
  it('should generate barrel export', async () => {
    await generator.generateAll('@test/hello', header, [
      { id: 'greet', kind: 'function', description: '', parameters: [], rawContent: '' },
      { id: 'farewell', kind: 'function', description: '', parameters: [], rawContent: '' }
    ]);
    
    const indexPath = path.join(tempDir, 'specs', 'test-hello.spec.dir', 'src', 'index.ts');
    const content = await fs.readFile(indexPath, 'utf-8');
    
    expect(content).toContain("export * from './greet';");
    expect(content).toContain("export * from './farewell';");
  });
});
```

## Integration with SimpleAgent

### @poc/codegen/integration

```typescript
// SimpleAgent uses CodeGenerator
export class SimpleAgent {
  private generator: CodeGenerator;
  
  constructor() {
    const registry = new TemplateRegistry();
    this.generator = new CodeGenerator({ 
      registry,
      outputDir: './src'
    });
  }
  
  async processBlocks(specId: string, header: SpecHeader, blocks: BlockData[]): Promise<void> {
    const files = await this.generator.generateAll(specId, header, blocks);
    console.log(`[SimpleAgent] Generated ${files.length} files`);
  }
}
```
