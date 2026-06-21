/**
 * Python Spec Codegen Handler
 *
 * Handles .spec.py trigger files by parsing them into CodeSpec format
 * and generating .code.py files using the PythonGenerator.
 *
 * Trigger: speclang-code-gen-python
 * Input:  .speclang/** /*.spec.py
 * Output: src/generated/** /*.code.py
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types (mirrored from codegen/types.ts for standalone use)
// ============================================================================

interface SpecHeader {
  id: string;
  version?: string;
  layer?: number;
  [key: string]: unknown;
}

interface TargetConfig {
  language: string;
  outputPath: string;
}

interface CodeBlock {
  id: string;
  kind: string;
  language: string;
  content: string;
  refs: string[];
  line: number;
}

interface CodeSpec {
  header: SpecHeader;
  target: TargetConfig;
  blocks: CodeBlock[];
  imports: string[];
  sourceFile: string;
}

interface GeneratedFile {
  path: string;
  content: string;
  sourceBlock: string;
  language: string;
}

// ============================================================================
// .spec.py Parser
// ============================================================================

const BLOCK_MARKER = /^#\s+@block:(\S+)\s+@kind:(\S+)/;

/**
 * Parse a .spec.py file into CodeSpec format.
 * .spec.py files have # @block:id @kind:type markers as comments
 * followed by the actual Python code for that block.
 */
export function parseSpecPyFile(filepath: string): CodeSpec {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  // Derive spec id from file path
  const relativePath = path.relative('.speclang', filepath).replace(/\.spec\.py$/, '');
  const specId = `@specs/${relativePath.replace(/[/\\]/g, '/')}`;

  const header: SpecHeader = {
    id: specId,
    version: '0.1.0',
    layer: 5,
    target: 'python',
  };

  const blocks: CodeBlock[] = [];
  let currentBlock: Partial<CodeBlock> | null = null;
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(BLOCK_MARKER);
    if (match) {
      // Save previous block
      if (currentBlock) {
        blocks.push({
          id: currentBlock.id!,
          kind: currentBlock.kind! || 'code',
          language: 'python',
          content: currentContent.join('\n').trim(),
          refs: [],
          line: currentBlock.line!,
        });
      }

      currentBlock = {
        id: match[1],
        kind: match[2],
        line: i + 1,
      };
      currentContent = [];
    } else if (currentBlock) {
      currentContent.push(line);
    }
  }

  // Save last block
  if (currentBlock) {
    blocks.push({
      id: currentBlock.id!,
      kind: currentBlock.kind! || 'code',
      language: 'python',
      content: currentContent.join('\n').trim(),
      refs: [],
      line: currentBlock.line!,
    });
  }

  // If no blocks found, treat entire file as one block
  if (blocks.length === 0) {
    const filename = path.basename(filepath, '.spec.py');
    blocks.push({
      id: filename,
      kind: 'code',
      language: 'python',
      content: content.trim(),
      refs: [],
      line: 1,
    });
  }

  const target: TargetConfig = {
    language: 'python',
    outputPath: 'src/generated',
  };

  return {
    header,
    target,
    blocks,
    imports: [],
    sourceFile: filepath,
  };
}

// ============================================================================
// Python Code Generator
// ============================================================================

/**
 * Generate file header with trace info
 */
function generateFileHeader(spec: CodeSpec, block: CodeBlock): string {
  const relPath = path.relative(process.cwd(), spec.sourceFile);
  const lines: string[] = [
    '# speclang-trace: spec=' + relPath + '#' + block.id,
    '# @generated-code DO NOT EDIT',
    '# Source: ' + relPath + '#' + block.id,
    '# Generated: ' + new Date().toISOString(),
    '',
  ];
  return lines.join('\n');
}

/**
 * Generate code from a parsed CodeSpec
 */
export function generateFromSpec(spec: CodeSpec): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const baseDir = spec.target.outputPath || 'src/generated';

  for (const block of spec.blocks) {
    const header = generateFileHeader(spec, block);
    const outputName = spec.header.id.replace(/^@/, '').replace(/[/\s]/g, '-') + '.code.py';
    const outputPath = path.join(baseDir, outputName);

    files.push({
      path: outputPath,
      content: header + block.content + '\n',
      sourceBlock: block.id,
      language: 'python',
    });
  }

  return files;
}

// ============================================================================
// File Writer
// ============================================================================

/**
 * Write generated files to disk, creating directories as needed.
 * Returns list of written file paths.
 */
export function writeGeneratedFiles(files: GeneratedFile[]): string[] {
  const written: string[] = [];

  for (const file of files) {
    const dir = path.dirname(file.path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(file.path, file.content, 'utf-8');
    written.push(file.path);
    console.log('Created: ' + file.path);
  }

  return written;
}

// ============================================================================
// Main handler entry point
// ============================================================================

/**
 * Handle a .spec.py trigger file:
 * 1. Parse it into CodeSpec format
 * 2. Generate .code.py output
 * 3. Write to src/generated/
 *
 * Returns list of created file paths.
 */
export function handleSpecPyTrigger(specPyFile: string): string[] {
  const spec = parseSpecPyFile(specPyFile);
  const files = generateFromSpec(spec);
  return writeGeneratedFiles(files);
}

// ============================================================================
// CLI entry point
// ============================================================================

/**
 * Run as a standalone script:
 *   npx tsx src/python-codegen-handler.ts <spec.py file>
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: tsx python-codegen-handler.ts <spec.py file>');
    process.exit(1);
  }

  const specPyFile = path.resolve(args[0]);
  if (!fs.existsSync(specPyFile)) {
    console.error('File not found: ' + specPyFile);
    process.exit(1);
  }

  try {
    const created = handleSpecPyTrigger(specPyFile);
    console.log('Generated ' + created.length + ' file(s)');
    created.forEach(f => console.log('  ' + f));
  } catch (err) {
    console.error('Error: ' + (err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }
}
