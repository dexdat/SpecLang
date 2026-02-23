# Bootstrap Phase 5.5: Meta-Circular Implementation

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 5.5 of the bootstrap process.

**Prerequisites**: 
- Phase 0-5 complete
- All infrastructure operational
- Self-specifying specs created
- Code generation working

## Your Task
Implement the meta-circular test: ensure SpecLang can build itself from its own specs. This is the ultimate validation that the system is complete and self-hosting.

## Read These Specs First
1. `specs/bootstrap.spec.md` - Bootstrap process
2. `specs/speclang.spec.md` - How to use SpecLang
3. `docs/NORTH_STAR.md` - Vision and principles
4. All specs in `specs/` directory

## The Meta-Circular Challenge

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  THE META-CIRCULAR TEST                                         │
│                                                                 │
│  SpecLang must be able to regenerate itself from its own specs. │
│                                                                 │
│  Steps:                                                         │
│  1. Archive current src/ directory                              │
│  2. Delete src/ directory                                       │
│  3. Run: speclang build --from-specs                            │
│  4. All of src/ should be regenerated                           │
│  5. Tests should pass                                           │
│  6. System should work identically                              │
│                                                                 │
│  If this works, SpecLang has successfully built itself.         │
│  This is the ultimate proof of self-specifying completeness.    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## What to Build

### Files to Create
```
scripts/
├── meta-circular-test.sh      # Main test script
├── verify-regeneration.sh     # Verify regenerated code
└── compare-implementations.sh # Compare old vs new

src/meta-circular/
├── bootstrap-validator.ts     # Validates bootstrap completeness
├── spec-coverage-checker.ts   # Checks spec coverage
├── self-test-runner.ts        # Runs self-tests
└── regeneration-engine.ts     # Engine for self-regeneration

specs/meta-circular/
├── self-hosting.spec.md       # Self-hosting requirements
├── bootstrap-validation.spec.md # Bootstrap validation spec
└── meta-tests.spec.md         # Meta-level test specifications
```

### Requirements

#### 1. Meta-Circular Test Script

```bash
#!/bin/bash
# scripts/meta-circular-test.sh
# The ultimate test: Can SpecLang build itself?

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  SPEC LANG  META-CIRCULAR TEST"
echo "═══════════════════════════════════════════════════════════════"
echo ""

WORK_DIR=$(pwd)
BACKUP_DIR="${WORK_DIR}/.meta-circular-backup-$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${WORK_DIR}/.meta-circular-test.log"

log() {
  echo "[$(date -Iseconds)] $1" | tee -a "$LOG_FILE"
}

fail() {
  log "FAILED: $1"
  echo ""
  echo "Restoring original implementation..."
  if [ -d "$BACKUP_DIR/src" ]; then
    rm -rf "${WORK_DIR}/src"
    cp -r "${BACKUP_DIR}/src" "${WORK_DIR}/src"
    log "Restored from backup"
  fi
  exit 1
}

# Step 1: Pre-flight checks
log "Step 1: Pre-flight checks"

if [ ! -d "specs" ]; then
  fail "No specs/ directory found"
fi

if [ ! -f "speclang.json" ]; then
  fail "No speclang.json configuration found"
fi

# Ensure current build passes
log "Running current test suite..."
bun test --silent 2>/dev/null || fail "Current tests must pass before meta-circular test"

# Step 2: Archive current implementation
log "Step 2: Archiving current implementation"
mkdir -p "$BACKUP_DIR"
cp -r src "$BACKUP_DIR/"
cp -r dist "$BACKUP_DIR/" 2>/dev/null || true
log "Backup created at $BACKUP_DIR"

# Record original file hashes
log "Recording original file hashes..."
find src -type f -name "*.ts" | sort | xargs sha256sum > "${BACKUP_DIR}/original-hashes.txt"
find src -type f -name "*.ts" | wc -l | xargs -I {} log "Original: {} TypeScript files"

# Step 3: Clean generated code
log "Step 3: Removing generated code"
rm -rf src/
mkdir -p src
log "src/ directory cleared"

# Step 4: Regenerate from specs
log "Step 4: Regenerating from specs"
log "Running: speclang build --from-specs"

# This is where the magic happens
# The speclang CLI reads all specs and generates code
if command -v speclang &> /dev/null; then
  speclang build --from-specs --verbose 2>&1 | tee -a "$LOG_FILE"
else
  # Fallback: use the bootstrap generator
  log "Using bootstrap generator..."
  bun run scripts/generate-from-specs.ts 2>&1 | tee -a "$LOG_FILE"
fi

# Verify files were generated
GENERATED_COUNT=$(find src -type f -name "*.ts" 2>/dev/null | wc -l)
log "Generated: ${GENERATED_COUNT} TypeScript files"

if [ "$GENERATED_COUNT" -eq 0 ]; then
  fail "No files were generated"
fi

# Step 5: Verify regeneration
log "Step 5: Verifying regeneration"

# Check all expected directories exist
EXPECTED_DIRS="src/daemon src/agents src/mcp src/compiler src/dashboard"
for dir in $EXPECTED_DIRS; do
  if [ ! -d "$dir" ]; then
    fail "Missing expected directory: $dir"
  fi
  log "  ✓ $dir exists"
done

# Check key files exist
EXPECTED_FILES="
src/daemon/daemon.ts
src/agents/agent-spawner.ts
src/mcp/server.ts
src/compiler/codegen.ts
"
for file in $EXPECTED_FILES; do
  if [ ! -f "$file" ]; then
    fail "Missing expected file: $file"
  fi
  log "  ✓ $file exists"
done

# Step 6: Type check
log "Step 6: Type checking regenerated code"
bun run tsc --noEmit 2>&1 | tee -a "$LOG_FILE" || fail "TypeScript compilation failed"
log "  ✓ TypeScript compiles"

# Step 7: Run tests
log "Step 7: Running tests on regenerated code"
bun test 2>&1 | tee -a "$LOG_FILE" || fail "Tests failed on regenerated code"
log "  ✓ All tests pass"

# Step 8: Compare implementations
log "Step 8: Comparing implementations"

# Record new file hashes
find src -type f -name "*.ts" | sort | xargs sha256sum > "${BACKUP_DIR}/regenerated-hashes.txt"

# Count matching files
MATCHING=$(comm -12 <(cut -d' ' -f1 "${BACKUP_DIR}/original-hashes.txt" | sort) \
                    <(cut -d' ' -f1 "${BACKUP_DIR}/regenerated-hashes.txt" | sort) | wc -l)

ORIGINAL=$(wc -l < "${BACKUP_DIR}/original-hashes.txt")
REGENERATED=$(wc -l < "${BACKUP_DIR}/regenerated-hashes.txt")

log "Original files: $ORIGINAL"
log "Regenerated files: $REGENERATED"
log "Matching content: $MATCHING"

# Calculate similarity percentage
if [ "$ORIGINAL" -gt 0 ]; then
  SIMILARITY=$(echo "scale=2; $MATCHING * 100 / $ORIGINAL" | bc)
  log "Similarity: ${SIMILARITY}%"
fi

# Step 9: Functional verification
log "Step 9: Functional verification"

# Start the regenerated daemon
log "Starting regenerated daemon..."
timeout 10 bun run src/daemon/daemon.ts &
DAEMON_PID=$!
sleep 2

# Check daemon is running
if ! kill -0 $DAEMON_PID 2>/dev/null; then
  fail "Regenerated daemon failed to start"
fi
log "  ✓ Daemon starts successfully"

# Stop daemon
kill $DAEMON_PID 2>/dev/null || true

# Step 10: Success!
log "Step 10: Meta-circular test PASSED!"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✓ SPEC LANG HAS SUCCESSFULLY BUILT ITSELF"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Results:"
echo "  - Original files: $ORIGINAL"
echo "  - Regenerated files: $REGENERATED"
echo "  - Content match: $MATCHING"
echo "  - All tests: PASSED"
echo ""
echo "Backup preserved at: $BACKUP_DIR"
echo "Full log: $LOG_FILE"

exit 0
```

#### 2. Bootstrap Validator

```typescript
// src/meta-circular/bootstrap-validator.ts

interface BootstrapValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  coverage: {
    specs: number;
    blocks: number;
    refs: number;
  };
}

interface ValidationError {
  spec: string;
  block?: string;
  message: string;
}

interface ValidationWarning {
  spec: string;
  message: string;
}

export class BootstrapValidator {
  private specIndex: SpecIndex;
  
  async validate(): Promise<BootstrapValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Check all required specs exist
    const requiredSpecs = [
      '@speclang/core',
      '@speclang/daemon',
      '@speclang/agents',
      '@speclang/mcp',
      '@speclang/compiler',
      '@speclang/ui'
    ];
    
    for (const specId of requiredSpecs) {
      const spec = await this.specIndex.get(specId);
      if (!spec) {
        errors.push({
          spec: specId,
          message: `Required spec not found: ${specId}`
        });
        continue;
      }
      
      // Validate spec has required blocks
      const blocks = spec.getBlocks();
      if (blocks.length === 0) {
        warnings.push({
          spec: specId,
          message: `Spec has no blocks defined`
        });
      }
      
      // Validate all refs resolve
      for (const block of blocks) {
        const refs = block.getReferences();
        for (const ref of refs) {
          const resolved = await this.specIndex.resolveRef(ref);
          if (!resolved) {
            errors.push({
              spec: specId,
              block: block.id,
              message: `Unresolved reference: ${ref}`
            });
          }
        }
      }
      
      // Check for agent_autonomous specs
      if (spec.header.agent_support === 'agent_autonomous') {
        const hasStepByStep = this.hasStepByStepDescriptions(block);
        if (!hasStepByStep) {
          warnings.push({
            spec: specId,
            message: `agent_autonomous spec lacks step-by-step descriptions`
          });
        }
      }
    }
    
    // Calculate coverage
    const allSpecs = await this.specIndex.getAll();
    const totalBlocks = allSpecs.reduce((sum, s) => sum + s.getBlocks().length, 0);
    const totalRefs = allSpecs.reduce((sum, s) => {
      return sum + s.getBlocks().reduce((bsum, b) => bsum + b.getReferences().length, 0);
    }, 0);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      coverage: {
        specs: allSpecs.length,
        blocks: totalBlocks,
        refs: totalRefs
      }
    };
  }
  
  private hasStepByStepDescriptions(block: SpecBlock): boolean {
    const content = block.getContent().toLowerCase();
    return content.includes('step 1') || 
           content.includes('steps:') ||
           content.includes('1.') ||
           content.includes('first:');
  }
  
  async validateSelfHosting(): Promise<boolean> {
    // Check that specs can generate their own implementation
    const validator = new SelfHostingValidator();
    return validator.validate();
  }
}
```

#### 3. Spec Coverage Checker

```typescript
// src/meta-circular/spec-coverage-checker.ts

interface CoverageReport {
  totalSourceFiles: number;
  coveredFiles: number;
  uncoveredFiles: string[];
  coverageByModule: Map<string, number>;
  missingSpecs: string[];
}

export class SpecCoverageChecker {
  async checkCoverage(): Promise<CoverageReport> {
    const sourceFiles = await this.findAllSourceFiles();
    const specMappings = await this.loadSpecMappings();
    
    const coveredFiles: string[] = [];
    const uncoveredFiles: string[] = [];
    const coverageByModule = new Map<string, { covered: number; total: number }>();
    
    for (const file of sourceFiles) {
      const mapping = specMappings.get(file.path);
      const moduleName = this.extractModule(file.path);
      
      if (!coverageByModule.has(moduleName)) {
        coverageByModule.set(moduleName, { covered: 0, total: 0 });
      }
      const moduleStats = coverageByModule.get(moduleName)!;
      moduleStats.total++;
      
      if (mapping && await this.validateMapping(mapping)) {
        coveredFiles.push(file.path);
        moduleStats.covered++;
      } else {
        uncoveredFiles.push(file.path);
      }
    }
    
    // Find missing specs
    const existingSpecs = await this.findAllSpecs();
    const missingSpecs = this.findMissingSpecs(sourceFiles, existingSpecs);
    
    return {
      totalSourceFiles: sourceFiles.length,
      coveredFiles: coveredFiles.length,
      uncoveredFiles,
      coverageByModule: new Map(
        Array.from(coverageByModule.entries()).map(([k, v]) => [k, v.covered / v.total])
      ),
      missingSpecs
    };
  }
  
  private async validateMapping(mapping: SpecMapping): Promise<boolean> {
    // Check that the spec referenced in the mapping still exists
    const spec = await this.specIndex.get(mapping.specId);
    if (!spec) return false;
    
    // Check that the block exists
    if (mapping.blockId) {
      const block = spec.getBlock(mapping.blockId);
      return block !== null;
    }
    
    return true;
  }
  
  printReport(report: CoverageReport): void {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  SPEC COVERAGE REPORT');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Total source files: ${report.totalSourceFiles}`);
    console.log(`Covered by specs: ${report.coveredFiles}`);
    console.log(`Coverage: ${(report.coveredFiles / report.totalSourceFiles * 100).toFixed(1)}%`);
    console.log('');
    
    console.log('Coverage by module:');
    for (const [module, coverage] of report.coverageByModule) {
      const bar = '█'.repeat(Math.floor(coverage * 20)) + '░'.repeat(20 - Math.floor(coverage * 20));
      console.log(`  ${module.padEnd(15)} [${bar}] ${(coverage * 100).toFixed(0)}%`);
    }
    console.log('');
    
    if (report.uncoveredFiles.length > 0) {
      console.log('Uncovered files:');
      for (const file of report.uncoveredFiles.slice(0, 10)) {
        console.log(`  - ${file}`);
      }
      if (report.uncoveredFiles.length > 10) {
        console.log(`  ... and ${report.uncoveredFiles.length - 10} more`);
      }
    }
    
    if (report.missingSpecs.length > 0) {
      console.log('');
      console.log('Missing specs:');
      for (const spec of report.missingSpecs) {
        console.log(`  - ${spec}`);
      }
    }
  }
}
```

#### 4. Self-Test Runner

```typescript
// src/meta-circular/self-test-runner.ts

interface SelfTestResult {
  passed: boolean;
  tests: TestResult[];
  duration: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export class SelfTestRunner {
  async runAll(): Promise<SelfTestResult> {
    const startTime = Date.now();
    const tests: TestResult[] = [];
    
    // Test 1: Spec parsing
    tests.push(await this.runTest('Spec parsing', async () => {
      const parser = new SpecParser();
      const specs = await parser.parseDirectory('specs/');
      if (specs.length === 0) throw new Error('No specs parsed');
    }));
    
    // Test 2: Index building
    tests.push(await this.runTest('Index building', async () => {
      const indexer = new SpecIndexer();
      await indexer.buildIndex('specs/');
      const index = indexer.getIndex();
      if (Object.keys(index).length === 0) throw new Error('Index is empty');
    }));
    
    // Test 3: Reference resolution
    tests.push(await this.runTest('Reference resolution', async () => {
      const resolver = new ReferenceResolver();
      const unresolved = await resolver.findUnresolved('specs/');
      if (unresolved.length > 0) {
        throw new Error(`Unresolved refs: ${unresolved.slice(0, 5).join(', ')}`);
      }
    }));
    
    // Test 4: Code generation
    tests.push(await this.runTest('Code generation', async () => {
      const codegen = new CodeGenerator();
      const result = await codegen.generateFromSpecs('specs/', '.test-output/');
      if (result.filesGenerated === 0) throw new Error('No files generated');
    }));
    
    // Test 5: Type checking generated code
    tests.push(await this.runTest('Type checking', async () => {
      const result = await exec('bun run tsc --noEmit');
      if (result.exitCode !== 0) throw new Error(result.stderr);
    }));
    
    // Test 6: Daemon lifecycle
    tests.push(await this.runTest('Daemon lifecycle', async () => {
      const daemon = new Daemon();
      await daemon.start();
      await new Promise(r => setTimeout(r, 1000));
      const healthy = await daemon.healthCheck();
      await daemon.stop();
      if (!healthy) throw new Error('Daemon not healthy');
    }));
    
    // Test 7: Agent spawning
    tests.push(await this.runTest('Agent spawning', async () => {
      const spawner = new AgentSpawner();
      const agent = await spawner.spawn('test-agent');
      if (!agent) throw new Error('Failed to spawn agent');
      await spawner.terminate(agent.sessionId);
    }));
    
    // Test 8: MCP tool execution
    tests.push(await this.runTest('MCP tool execution', async () => {
      const client = new MCPClient();
      const result = await client.call('speclang_search', { query: 'test' });
      if (!result.results) throw new Error('MCP tool failed');
    }));
    
    // Test 9: Cascade convergence
    tests.push(await this.runTest('Cascade convergence', async () => {
      const cascade = new CascadeEngine();
      await cascade.trigger('specs/test-trigger.spec.md');
      await cascade.waitForConvergence(30000);
      const status = cascade.getStatus();
      if (status.state !== 'converged') throw new Error('Cascade did not converge');
    }));
    
    // Test 10: Meta-circular regeneration
    tests.push(await this.runTest('Meta-circular regeneration', async () => {
      const result = await exec('./scripts/meta-circular-test.sh');
      if (result.exitCode !== 0) throw new Error('Meta-circular test failed');
    }));
    
    const duration = Date.now() - startTime;
    const summary = {
      total: tests.length,
      passed: tests.filter(t => t.status === 'passed').length,
      failed: tests.filter(t => t.status === 'failed').length,
      skipped: tests.filter(t => t.status === 'skipped').length
    };
    
    return {
      passed: summary.failed === 0,
      tests,
      duration,
      summary
    };
  }
  
  private async runTest(name: string, fn: () => Promise<void>): Promise<TestResult> {
    const startTime = Date.now();
    try {
      await fn();
      return {
        name,
        status: 'passed',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  printResult(result: SelfTestResult): void {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  SELF-TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    for (const test of result.tests) {
      const icon = test.status === 'passed' ? '✓' : '✗';
      const color = test.status === 'passed' ? '\x1b[32m' : '\x1b[31m';
      console.log(`  ${color}${icon}\x1b[0m ${test.name} (${test.duration}ms)`);
      if (test.error) {
        console.log(`    \x1b[31m${test.error}\x1b[0m`);
      }
    }
    
    console.log('');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`  Total: ${result.summary.total}`);
    console.log(`  Passed: ${result.summary.passed}`);
    console.log(`  Failed: ${result.summary.failed}`);
    console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log('');
    
    if (result.passed) {
      console.log('  \x1b[32m✓ ALL SELF-TESTS PASSED\x1b[0m');
    } else {
      console.log('  \x1b[31m✗ SOME SELF-TESTS FAILED\x1b[0m');
    }
    console.log('═══════════════════════════════════════════════════════════════');
  }
}
```

#### 5. Self-Hosting Spec

```yaml
# specs/meta-circular/self-hosting.spec.md

# speclang-header lines:12
id: @speclang/meta-circular/self-hosting
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [meta, self-hosting, bootstrap]
short: Self-hosting requirements for SpecLang
---

## Self-Hosting Requirements

### @meta-circular/definition
SpecLang is self-hosting when:
1. All specs exist for all source code
2. Running `speclang build` regenerates identical source
3. Regenerated code passes all tests
4. System behavior is unchanged

### @meta-circular/completeness-checklist
- [ ] All modules have corresponding specs
- [ ] All source files have `@generated-from` headers
- [ ] All code blocks have matching spec blocks
- [ ] No hardcoded values without spec
- [ ] All configurations specifiable

### @meta-circular/bootstrap-phases

#### Phase 1: Bootstrap Foundation
- SQLite schema defined in specs
- Parser spec complete
- Indexer spec complete

#### Phase 2: Core Infrastructure
- Daemon spec complete
- Agent spawner spec complete
- MCP server spec complete

#### Phase 3: Code Generation
- Template system spec complete
- Code generator spec complete
- Type emission spec complete

#### Phase 4: UI Components
- Dashboard spec complete
- All component specs complete
- Interaction specs complete

#### Phase 5: Self-Specification
- All specs upgraded to agent_autonomous
- Step-by-step descriptions complete
- All refs resolve

#### Phase 6: Meta-Circular
- Clean regeneration possible
- All tests pass on regenerated code
- Behavioral equivalence verified
```

## Test Cases

1. **Spec Completeness Test**
   - All source files have spec mappings
   - All spec refs resolve
   - No orphan code

2. **Regeneration Test**
   - Clean src/, regenerate
   - Compare file counts
   - Compare content similarity

3. **Functional Equivalence Test**
   - Original daemon = regenerated daemon
   - Same responses to same inputs
   - Same cascade behavior

4. **Self-Test Suite**
   - All 10 self-tests pass
   - Tests test the testing system
   - Meta-validation complete

## Validation

```bash
# Run bootstrap validator
bun run src/meta-circular/bootstrap-validator.ts

# Check spec coverage
bun run src/meta-circular/spec-coverage-checker.ts

# Run self-tests
bun run src/meta-circular/self-test-runner.ts

# Run full meta-circular test
./scripts/meta-circular-test.sh
```

## Success Criteria

1. All specs have `agent_autonomous` support
2. Coverage >= 95% for all modules
3. Regeneration produces identical functionality
4. All self-tests pass
5. Meta-circular test completes successfully

## Output Format

After completing, output:
1. Bootstrap validation results
2. Spec coverage percentage
3. Self-test pass rate
4. Meta-circular test result (PASS/FAIL)
5. Similarity percentage of regenerated code
