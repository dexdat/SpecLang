import * as path from 'path';
import * as fs from 'fs/promises';
import { parseSpecFile, extractRefs, extractImplementationBlocks, Assembler } from './assembler.spec.ts';

const SPEC_DIR = path.resolve(__dirname, '..', 'specs', 'assembler');
const SPEC_FILE = path.join(SPEC_DIR, 'assembler.spec.ts.md');
const OUTPUT_DIR = path.resolve(__dirname);
const TEST_OUTPUT = path.join(OUTPUT_DIR, 'test-output.ts');
const TEST_SPEC = path.join(OUTPUT_DIR, '_test-assemble-spec.spec.ts.md');

// ---- Test 1: parseSpecFile with valid content ----
async function test_parseSpecFile_valid(): Promise<void> {
  const content = `---
id: "test"
version: 1.0.0
target_lang: ts
output: .speclang/test-output.ts
---

# Test Spec

Some body content
`;
  const result = parseSpecFile(content);
  if (!result) throw new Error('Expected parsed result, got null');
  if (result.header.id !== 'test') throw new Error(`Expected id=test, got ${result.header.id}`);
  if (result.header.target_lang !== 'ts') throw new Error(`Expected target_lang=ts, got ${result.header.target_lang}`);
  if (!result.body.includes('Test Spec')) throw new Error('Body missing content');
  console.log('  \u2705 test_parseSpecFile_valid');
}

// ---- Test 2: parseSpecFile with invalid content (no YAML front matter) ----
async function test_parseSpecFile_invalid(): Promise<void> {
  const content = 'Just some text without front matter';
  const result = parseSpecFile(content);
  if (result !== null) throw new Error('Expected null for invalid content');
  console.log('  \u2705 test_parseSpecFile_invalid');
}

// ---- Test 3: extractRefs finds @ref: links ----
async function test_extractRefs(): Promise<void> {
  const body = `
Some text with a ref: @ref:specs/core
And another: @ref:specs/assembler/model-pools
And an inline ref: something(@ref:specs/guard)
  `;
  const refs = extractRefs(body);
  if (refs.length !== 3) throw new Error(`Expected 3 refs, got ${refs.length}`);
  if (refs[0] !== 'specs/core') throw new Error(`Expected specs/core, got ${refs[0]}`);
  if (refs[1] !== 'specs/assembler/model-pools') throw new Error(`Expected specs/assembler/model-pools, got ${refs[1]}`);
  if (refs[2] !== 'specs/guard') throw new Error(`Expected specs/guard, got ${refs[2]}`);
  console.log('  \u2705 test_extractRefs');
}

// ---- Test 4: extractImplementationBlocks extracts TypeScript code ----
async function test_extractImplementationBlocks(): Promise<void> {
  const body = `# Overview

Some overview text.

## Implementation

\`\`\`typescript
function hello(): void {
  console.log('hello');
}
\`\`\`

## Another Section

More text.
`;
  const code = extractImplementationBlocks(body, 'typescript');
  if (!code.includes('function hello()')) throw new Error('Expected hello function in extracted code');
  if (!code.includes("console.log('hello')")) throw new Error('Expected console.log in extracted code');
  console.log('  \u2705 test_extractImplementationBlocks');
}

// ---- Test 5: assemble reads a spec file and writes output ----
async function test_assemble(): Promise<void> {
  // Create a temporary spec file with a custom output path
  const testSpecContent = `---
id: "test-assemble"
version: 1.0.0
target_lang: typescript
output: .speclang/test-output.ts
---

# Test Assemble Spec

## Implementation

\`\`\`typescript
export function greet(name: string): string {
  return "Hello, " + name + "!";
}
\`\`\`
`;
  await fs.writeFile(TEST_SPEC, testSpecContent, 'utf-8');

  const assembler = new Assembler();
  const result = await assembler.assemble(TEST_SPEC);
  if (!result.success) throw new Error(`Assembly failed: ${result.errors.join(', ')}`);

  // Check that the output file exists
  const outPath = path.resolve(__dirname, '..', result.outputPath!);
  const stat = await fs.stat(outPath);
  if (!stat.isFile()) throw new Error(`Output file not found: ${outPath}`);
  
  // Verify content
  const output = await fs.readFile(outPath, 'utf-8');
  if (!output.includes('greet')) throw new Error('Output missing expected content');
  
  // Cleanup
  await fs.unlink(TEST_SPEC);
  
  console.log(`  \u2705 test_assemble: ${result.outputPath} (${stat.size} bytes)`);
}

// ---- Run all tests ----
async function main(): Promise<void> {
  console.log('\n=== Assembler Engine Tests ===\n');
  
  const results: Array<{name: string; pass: boolean; error?: string}> = [];
  
  async function run(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      results.push({ name, pass: true });
    } catch (e: any) {
      console.log(`  \u274c ${name}: ${e.message}`);
      results.push({ name, pass: false, error: e.message });
    }
  }
  
  await run('test_parseSpecFile_valid', test_parseSpecFile_valid);
  await run('test_parseSpecFile_invalid', test_parseSpecFile_invalid);
  await run('test_extractRefs', test_extractRefs);
  await run('test_extractImplementationBlocks', test_extractImplementationBlocks);
  await run('test_assemble', test_assemble);
  
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
}

main().catch(console.error);
