"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVerificationResult = exports.VerificationGates = exports.getAgentForTrigger = exports.AgentInvoker = exports.createInitialState = exports.DependencyTracker = exports.CascadeCoordinator = void 0;
exports.runCascade = runCascade;
exports.parseSpec = parseSpec;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const index_js_1 = require("./coordinator/index.js");
/**
 * Run a cascade on a spec file
 */
async function runCascade(specPath, options = {}) {
    const { verbose = false, maxDepth = 5, convergenceTimeout = 30000 } = options;
    const result = {
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
            result.warning =
                'No TypeScript code blocks found in spec. Add a block header ' +
                    '"### @block::<name> @kind:code" followed by a ```speclang ' +
                    '(or ```typescript) fence containing the code to generate.';
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
        // 7. THINK-004: Collect metrics when --metrics flag is set
        if (options.metrics) {
            const coordinator = new index_js_1.CascadeCoordinator(undefined, {
                verbose: options.verbose,
                thinking: options.thinking,
                metrics: true,
            });
            // Template-based cascade path doesn't invoke agents, so metrics
            // will be zero — this is correct behavior. Agent invocations (via
            // cascade trigger subcommand) produce real token data.
            const summary = coordinator.collateMetrics();
            result.metrics_summary = {
                total_input_tokens: summary.total_input_tokens,
                total_output_tokens: summary.total_output_tokens,
                total_tokens: summary.total_input_tokens + summary.total_output_tokens + summary.total_reasoning_tokens,
            };
            if (verbose) {
                coordinator.printMetricsSummary(summary);
            }
        }
        return result;
    }
    catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        return result;
    }
}
/**
 * Parse a spec file and extract metadata
 */
function parseSpec(content) {
    const lines = content.split('\n');
    const metadata = {};
    const blocks = [];
    let inHeader = false;
    let headerLines = 0;
    let currentBlock = null;
    let inCodeBlock = false;
    let codeLines = [];
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
                let value = valueParts.join(':').trim();
                // Strip YAML scalar quoting (single or double) so quoted ids like
                // `id: "@speclang/examples/hello-world"` come back bare. The
                // validation idRule requires a leading '@', so literal quotes made
                // parseSpec → validate fail on the exact format `speclang new`
                // generates (SL-GAP-034).
                if (value.length >= 2) {
                    const first = value[0];
                    const last = value[value.length - 1];
                    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
                        value = value.slice(1, -1);
                    }
                }
                metadata[key.trim()] = value;
            }
            headerLines--;
            continue;
        }
        // Detect blocks: ### @block::name @kind:type
        const blockMatch = line.match(/###\s+@block::(\S+)\s+@kind:(\S+)/);
        if (blockMatch) {
            // Save previous block
            if (currentBlock) {
                if (inCodeBlock) {
                    currentBlock.code = codeLines.join('\n');
                }
                blocks.push(currentBlock);
            }
            currentBlock = {
                id: '@block::' + blockMatch[1],
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
            const fenceLang = line.trim().slice(3).trim();
            if (inCodeBlock) {
                // End of code block
                currentBlock.code = codeLines.join('\n');
                inCodeBlock = false;
                codeLines = [];
            }
            else if (fenceLang.length > 0) {
                // Start of code block — only language-tagged fences open one.
                // Plain ``` fences (e.g. "Expected Output" examples) are ignored so
                // they cannot clobber an existing block's code/language.
                inCodeBlock = true;
                currentBlock.language = fenceLang;
            }
            continue;
        }
        // A heading while inside a code block closes it (defensive: section
        // headers terminate block capture even if a closing fence was missed).
        // Level-2+ only: single-hash lines inside fences are code (Python
        // comments, `# @kind:code` markers), not markdown headings.
        if (currentBlock && inCodeBlock && /^##{1,6}\s/.test(line)) {
            currentBlock.code = codeLines.join('\n');
            inCodeBlock = false;
            codeLines = [];
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
/**
 * Generate TypeScript code from a spec block description
 * This is a template-based generator that creates basic TypeScript from descriptions
 */
function generateTypeScriptFromBlock(block) {
    const lines = [];
    // Extract parameters from the block code/description
    const paramMatches = block.code.match(/\*\*Parameters:\*\*\s*\n((?:\s*-\s*\w+:\s*\w+[^\n]*\n?)+)/);
    const returnMatch = block.code.match(/\*\*Returns:\*\*\s*([^\n]+)/);
    if (block.kind === 'function') {
        // Generate function signature
        const params = [];
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
    }
    else if (block.kind === 'interface' || block.kind === 'entity') {
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
    }
    else if (block.kind === 'class') {
        // Generate class
        lines.push(`export class ${block.name} {`);
        lines.push(`  // TODO: Implement ${block.name} class`);
        lines.push(`}`);
    }
    return lines.join('\n');
}
/**
 * Generate code files from spec blocks
 *
 * A block carries TypeScript when it is fenced ```speclang (the canonical
 * fence emitted by `speclang init`) or ```typescript / ```ts (legacy
 * spellings). All three are treated identically: a `@block::<id> @kind:code`
 * block fenced ```speclang is TypeScript code, not a skipped foreign block.
 * Accepting only the legacy spellings is what made init-generated specs
 * cascade to zero files while still reporting success.
 */
const TYPESCRIPT_FENCES = new Set(['typescript', 'ts', 'speclang']);
function isTypeScriptFence(language) {
    return typeof language === 'string' && TYPESCRIPT_FENCES.has(language.toLowerCase());
}
async function generateCode(spec, outputDir, verbose) {
    const generatedFiles = [];
    for (const block of spec.blocks) {
        // Skip test blocks (handle separately)
        if (block.kind === 'test') {
            continue;
        }
        let code;
        let fileName;
        // Check if block has existing TypeScript code
        if (isTypeScriptFence(block.language)) {
            // Use existing code
            code = block.code;
            fileName = block.name.replace(/-/g, '_') + '.ts';
        }
        else if (['function', 'interface', 'entity', 'class'].includes(block.kind)) {
            // Generate code from description
            code = generateTypeScriptFromBlock(block);
            fileName = block.name.replace(/-/g, '_') + '.ts';
        }
        else {
            // Skip other block types
            continue;
        }
        const filePath = path.join(outputDir, fileName);
        // Ensure the output directory exists (block names may include subdirectories)
        const outDir = path.dirname(filePath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
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
        if (!isTypeScriptFence(block.language)) {
            continue;
        }
        const fileName = block.name.replace(/-/g, '_') + '.test.ts';
        const filePath = path.join(outputDir, fileName);
        // Ensure the output directory exists
        const outDir = path.dirname(filePath);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
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
async function runTests(testFiles, verbose) {
    const { execSync } = await import('child_process');
    const result = { total: 0, passed: 0, failed: 0 };
    try {
        // Run vitest on the test files
        const output = execSync(`npx vitest run ${testFiles.join(' ')} --reporter=json 2>/dev/null || true`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        // Parse vitest JSON output
        try {
            const testResult = JSON.parse(output);
            result.total = testResult.numTotalTests || 0;
            result.passed = testResult.numPassedTests || 0;
            result.failed = testResult.numFailedTests || 0;
        }
        catch {
            // If JSON parsing fails, count manually from stdout
            if (verbose) {
                console.log('[Cascade] Could not parse test output');
            }
        }
        if (verbose) {
            console.log(`[Cascade] Tests: ${result.passed}/${result.total} passed`);
        }
    }
    catch (error) {
        if (verbose) {
            console.log('[Cascade] Test execution failed:', error);
        }
    }
    return result;
}
var index_js_2 = require("./coordinator/index.js");
Object.defineProperty(exports, "CascadeCoordinator", { enumerable: true, get: function () { return index_js_2.CascadeCoordinator; } });
var dependency_js_1 = require("./coordinator/dependency.js");
Object.defineProperty(exports, "DependencyTracker", { enumerable: true, get: function () { return dependency_js_1.DependencyTracker; } });
var state_js_1 = require("./coordinator/state.js");
Object.defineProperty(exports, "createInitialState", { enumerable: true, get: function () { return state_js_1.createInitialState; } });
var invocation_js_1 = require("./coordinator/invocation.js");
Object.defineProperty(exports, "AgentInvoker", { enumerable: true, get: function () { return invocation_js_1.AgentInvoker; } });
Object.defineProperty(exports, "getAgentForTrigger", { enumerable: true, get: function () { return invocation_js_1.getAgentForTrigger; } });
var verification_js_1 = require("./coordinator/verification.js");
Object.defineProperty(exports, "VerificationGates", { enumerable: true, get: function () { return verification_js_1.VerificationGates; } });
Object.defineProperty(exports, "createVerificationResult", { enumerable: true, get: function () { return verification_js_1.createVerificationResult; } });
//# sourceMappingURL=index.js.map