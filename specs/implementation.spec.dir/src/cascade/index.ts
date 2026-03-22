/**
 * Cascade Runner - Main entry point for running cascades
 * 
 * A cascade is the process of:
 * 1. Reading a spec file
 * 2. Expanding it (if needed)
 * 3. Generating code
 * 4. Running tests
 * 5. Detecting convergence
 */

import * as path from 'path';
import * as fs from 'fs';

export interface CascadeOptions {
  verbose?: boolean;
  maxDepth?: number;
  convergenceTimeout?: number; // ms
}

export interface CascadeResult {
  success: boolean;
  filesGenerated: string[];
  testsRun: number;
  testsPassed: number;
  converged: boolean;
  convergenceTime?: number;
  error?: string;
  warning?: string;
}

/**
 * Run a cascade on a spec file
 */
export async function runCascade(
  specPath: string, 
  options: CascadeOptions = {}
): Promise<CascadeResult> {
  const {
    verbose = false,
    maxDepth = 5,
    convergenceTimeout = 30000
  } = options;

  const result: CascadeResult = {
    success: false,
    filesGenerated: [],
    testsRun: 0,
    testsPassed: 0,
    converged: false
  };

  try {
    if (verbose) {
      console.log(`[Cascade] Starting cascade on: ${specPath}`);
    }

    // 1. Validate spec file exists
    if (!fs.existsSync(specPath)) {
      throw new Error(`Spec file not found: ${specPath}`);
    }

    // 2. Read and parse spec
    const specContent = fs.readFileSync(specPath, 'utf-8');
    const spec = parseSpec(specContent);
    
    if (verbose) {
      console.log(`[Cascade] Spec ID: ${spec.id}`);
      console.log(`[Cascade] Spec version: ${spec.version}`);
    }

    // 3. Determine output directory
    const specDir = path.dirname(specPath);
    const generatedDir = path.join(specDir, '..', 'generated');
    
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    // 4. Generate code from spec blocks
    const generatedFiles = await generateCode(spec, generatedDir, verbose);
    result.filesGenerated = generatedFiles;

    // Warning if no files generated
    if (generatedFiles.length === 0) {
      result.warning = 'No TypeScript code blocks found in spec. Add code blocks with ```typescript to generate code.';
    }

    // 5. Run tests if any test files were generated
    const testFiles = generatedFiles.filter(f => f.endsWith('.test.ts'));
    if (testFiles.length > 0) {
      const testResult = await runTests(testFiles, verbose);
      result.testsRun = testResult.total;
      result.testsPassed = testResult.passed;
    }

    // 6. Check convergence
    // For MVP, convergence is when code generates and tests pass
    result.converged = result.testsRun === 0 || result.testsPassed === result.testsRun;
    result.success = result.converged;

    if (verbose) {
      console.log(`[Cascade] Converged: ${result.converged}`);
    }

    return result;

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

/**
 * Parse a spec file and extract metadata
 */
function parseSpec(content: string): { id: string; version: string; blocks: SpecBlock[] } {
  const lines = content.split('\n');
  const metadata: Record<string, string> = {};
  const blocks: SpecBlock[] = [];
  
  let inHeader = false;
  let headerLines = 0;
  let currentBlock: SpecBlock | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect header
    if (line.includes('speclang-header')) {
      inHeader = true;
      const match = line.match(/lines:(\d+)/);
      if (match) {
        headerLines = parseInt(match[1]);
      }
      continue;
    }

    // Parse header lines
    if (inHeader && headerLines > 0) {
      if (line.trim() === '---') {
        inHeader = false;
        continue;
      }
      
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        metadata[key.trim()] = valueParts.join(':').trim();
      }
      headerLines--;
      continue;
    }

    // Detect blocks: ### @block:name @kind:type
    const blockMatch = line.match(/###\s+@block:(\S+)\s+@kind:(\S+)/);
    if (blockMatch) {
      // Save previous block
      if (currentBlock) {
        if (inCodeBlock) {
          currentBlock.code = codeLines.join('\n');
        }
        blocks.push(currentBlock);
      }
      
      currentBlock = {
        name: blockMatch[1],
        kind: blockMatch[2],
        code: ''
      };
      codeLines = [];
      inCodeBlock = false;
      continue;
    }

    // Detect code blocks
    if (currentBlock && line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        currentBlock.code = codeLines.join('\n');
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
        currentBlock.language = line.trim().slice(3);
      }
      continue;
    }

    // Collect code lines
    if (inCodeBlock) {
      codeLines.push(line);
    }
  }

  // Save last block
  if (currentBlock) {
    if (inCodeBlock) {
      currentBlock.code = codeLines.join('\n');
    }
    blocks.push(currentBlock);
  }

  return {
    id: metadata.id || 'unknown',
    version: metadata.version || '0.0.0',
    blocks
  };
}

interface SpecBlock {
  name: string;
  kind: string;
  language?: string;
  code: string;
}

/**
 * Generate TypeScript code from a spec block description
 * This is a template-based generator that creates basic TypeScript from descriptions
 */
function generateTypeScriptFromBlock(block: SpecBlock): string {
  const lines: string[] = [];
  
  // Extract parameters from the block code/description
  const paramMatches = block.code.match(/\*\*Parameters:\*\*\s*\n((?:\s*-\s*\w+:\s*\w+[^\n]*\n?)+)/);
  const returnMatch = block.code.match(/\*\*Returns:\*\*\s*([^\n]+)/);
  
  if (block.kind === 'function') {
    // Generate function signature
    const params: string[] = [];
    if (paramMatches) {
      const paramLines = paramMatches[1].trim().split('\n');
      for (const line of paramLines) {
        const match = line.match(/-\s*(\w+):\s*(\w+)/);
        if (match) {
          const [, name, type] = match;
          const tsType = type.toLowerCase() === 'string' ? 'string' : 
                        type.toLowerCase() === 'int' || type.toLowerCase() === 'float' ? 'number' : 
                        type.toLowerCase() === 'bool' ? 'boolean' : 'any';
          params.push(`${name}: ${tsType}`);
        }
      }
    }
    
    const returnType = returnMatch ? 
      (returnMatch[1].toLowerCase().includes('string') ? 'string' : 
       returnMatch[1].toLowerCase().includes('number') || returnMatch[1].toLowerCase().includes('int') ? 'number' : 
       returnMatch[1].toLowerCase().includes('bool') ? 'boolean' : 
       returnMatch[1].toLowerCase().includes('void') ? 'void' : 'any') : 'any';
    
    lines.push(`export function ${block.name}(${params.join(', ')}): ${returnType} {`);
    lines.push(`  // TODO: Implement ${block.name}`);
    lines.push(`  throw new Error('${block.name} not implemented');`);
    lines.push(`}`);
  } else if (block.kind === 'interface' || block.kind === 'entity') {
    // Generate interface
    lines.push(`export interface ${block.name} {`);
    
    if (paramMatches) {
      const paramLines = paramMatches[1].trim().split('\n');
      for (const line of paramLines) {
        const match = line.match(/-\s*(\w+):\s*(\w+)(?:\s*-\s*(.+))?/);
        if (match) {
          const [, name, type, desc] = match;
          const tsType = type.toLowerCase() === 'string' ? 'string' : 
                        type.toLowerCase() === 'int' || type.toLowerCase() === 'float' ? 'number' : 
                        type.toLowerCase() === 'bool' ? 'boolean' : 'any';
          if (desc) {
            lines.push(`  /** ${desc} */`);
          }
          lines.push(`  ${name}: ${tsType};`);
        }
      }
    }
    
    lines.push(`}`);
  } else if (block.kind === 'class') {
    // Generate class
    lines.push(`export class ${block.name} {`);
    lines.push(`  // TODO: Implement ${block.name} class`);
    lines.push(`}`);
  }
  
  return lines.join('\n');
}

/**
 * Generate code files from spec blocks
 */
async function generateCode(
  spec: { id: string; version: string; blocks: SpecBlock[] },
  outputDir: string,
  verbose: boolean
): Promise<string[]> {
  const generatedFiles: string[] = [];

  for (const block of spec.blocks) {
    // Skip test blocks (handle separately)
    if (block.kind === 'test') {
      continue;
    }

    let code: string;
    let fileName: string;
    
    // Check if block has existing TypeScript code
    if (block.language === 'typescript' || block.language === 'ts') {
      // Use existing code
      code = block.code;
      fileName = block.name.replace(/-/g, '_') + '.ts';
    } else if (['function', 'interface', 'entity', 'class'].includes(block.kind)) {
      // Generate code from description
      code = generateTypeScriptFromBlock(block);
      fileName = block.name.replace(/-/g, '_') + '.ts';
    } else {
      // Skip other block types
      continue;
    }

    const filePath = path.join(outputDir, fileName);

    // Add auto-generated header
    const header = `/**
 * Auto-generated by SpecLang
 * Source: ${spec.id}#${block.name}
 * Version: ${spec.version}
 * 
 * DO NOT EDIT - Changes will be overwritten
 * Edit the source spec instead
 */

`;
    
    fs.writeFileSync(filePath, header + code);
    generatedFiles.push(filePath);

    if (verbose) {
      console.log(`[Cascade] Generated: ${filePath}`);
    }
  }

  // Generate test files
  for (const block of spec.blocks) {
    if (block.kind !== 'test') {
      continue;
    }

    if (block.language !== 'typescript' && block.language !== 'ts') {
      continue;
    }

    const fileName = block.name.replace(/-/g, '_') + '.test.ts';
    const filePath = path.join(outputDir, fileName);

    const header = `/**
 * Auto-generated test by SpecLang
 * Source: ${spec.id}#${block.name}
 */

`;
    
    fs.writeFileSync(filePath, header + block.code);
    generatedFiles.push(filePath);

    if (verbose) {
      console.log(`[Cascade] Generated test: ${filePath}`);
    }
  }

  return generatedFiles;
}

/**
 * Run tests using vitest
 */
async function runTests(
  testFiles: string[],
  verbose: boolean
): Promise<{ total: number; passed: number; failed: number }> {
  const { execSync } = await import('child_process');
  
  const result = { total: 0, passed: 0, failed: 0 };

  try {
    // Run vitest on the test files
    const output = execSync(
      `npx vitest run ${testFiles.join(' ')} --reporter=json 2>/dev/null || true`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    // Parse vitest JSON output
    try {
      const testResult = JSON.parse(output);
      result.total = testResult.numTotalTests || 0;
      result.passed = testResult.numPassedTests || 0;
      result.failed = testResult.numFailedTests || 0;
    } catch {
      // If JSON parsing fails, count manually from stdout
      if (verbose) {
        console.log('[Cascade] Could not parse test output');
      }
    }

    if (verbose) {
      console.log(`[Cascade] Tests: ${result.passed}/${result.total} passed`);
    }

  } catch (error) {
    if (verbose) {
      console.log('[Cascade] Test execution failed:', error);
    }
  }

  return result;
}

export { parseSpec };

export { CascadeCoordinator } from './coordinator/index.js';
export { DependencyTracker } from './coordinator/dependency.js';
export { 
  CascadeState, 
  AgentInvocation, 
  VerificationResult,
  createInitialState 
} from './coordinator/state.js';
export { 
  AgentInvoker, 
  getAgentForTrigger 
} from './coordinator/invocation.js';
export { 
  VerificationGates, 
  createVerificationResult,
  type GateResult,
  type VerificationGate
} from './coordinator/verification.js';
export type { 
  TreeNode, 
  DependencyGraph 
} from './coordinator/dependency.js';
export type {
  CoordinatorOptions,
  CascadeResult as CoordinatorResult
} from './coordinator/index.js';
