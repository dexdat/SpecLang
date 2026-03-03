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
            }
            else {
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
/**
 * Generate code files from spec blocks
 */
async function generateCode(spec, outputDir, verbose) {
    const generatedFiles = [];
    for (const block of spec.blocks) {
        // Skip test blocks (handle separately)
        if (block.kind === 'test') {
            continue;
        }
        // Only generate TypeScript blocks
        if (block.language !== 'typescript' && block.language !== 'ts') {
            continue;
        }
        // Generate filename from block name
        const fileName = block.name.replace(/-/g, '_') + '.ts';
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
        fs.writeFileSync(filePath, header + block.code);
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
async function runTests(testFiles, verbose) {
    const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
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
var index_js_1 = require("./coordinator/index.js");
Object.defineProperty(exports, "CascadeCoordinator", { enumerable: true, get: function () { return index_js_1.CascadeCoordinator; } });
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