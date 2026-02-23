# Bootstrap Phase 1.4: Cascade Coordination Protocol

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.4 of the bootstrap process.

**Prerequisites**: 
- Phase 0 (Foundation) complete
- Phase 1.1-1.3 (Daemon, Agents, OpenCode) in progress
- Understanding of agent coordination needs

## Your Task
Implement the explicit cascade coordination protocol that orchestrates agent-to-agent communication within OpenCode constraints. Unlike the original fantasy of automatic file watching, this protocol uses explicit coordination with the Task tool.

## Read These Specs First
1. `specs/cascade-protocol.spec.md` - Cascade coordination protocol
2. `specs/cascade.spec.md` - Original cascade vision
3. `specs/core.spec.dir/agents.spec.md` - Agent definitions

## Current State
- OpenCode does NOT support file watching
- OpenCode does NOT support automatic agent triggering
- OpenCode DOES support Task tool for explicit invocation
- OpenCode DOES support Bash for verification

## What to Build

### Files to Create
```
src/cascade/
├── index.ts              # Main exports
├── coordinator.ts        # @speclang-coordinator logic
├── state.ts              # Cascade state management
├── invocation.ts         # Agent invocation via Task
├── verification.ts       # Verification gates
├── steering.ts           # Steering packet creation
├── tree-traversal.ts     # Multi-tree spanning
└── types.ts              # TypeScript types

.speclang/
└── cascade_state.json    # Runtime state

scripts/
├── validate_refs.py      # Gate 1: Reference validation
├── validate_autonomous.py # Gate 2: Autonomous readiness
└── run_cascade.sh        # Cascade runner script
```

### Requirements

#### 1. Cascade State Management

```typescript
// src/cascade/state.ts

interface CascadeState {
  cascade_id: string;
  depth: number;
  max_depth: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
  trigger_file: string;
  current_agent: string;
  agents_invoked: AgentInvocation[];
  verification_results: VerificationResult[];
  depth_by_tree: Record<string, number>;
  current_pass: string;
}

interface AgentInvocation {
  agent: string;
  timestamp: string;
  result: 'success' | 'failure' | 'pending';
  files_modified: string[];
  error?: string;
}

const CASCADE_STATE_PATH = '.speclang/cascade_state.json';

export async function initCascade(triggerFile: string): Promise<CascadeState> {
  const state: CascadeState = {
    cascade_id: `cascade-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString(36)}`,
    depth: 0,
    max_depth: 5,
    status: 'running',
    trigger_file: triggerFile,
    current_agent: '',
    agents_invoked: [],
    verification_results: [],
    depth_by_tree: { specs: 0, src: 0, tests: 0, docs: 0 },
    current_pass: 'init'
  };
  await saveState(state);
  return state;
}

export async function loadState(): Promise<CascadeState | null> {
  try {
    const content = await fs.readFile(CASCADE_STATE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function saveState(state: CascadeState): Promise<void> {
  await fs.writeFile(CASCADE_STATE_PATH, JSON.stringify(state, null, 2));
}
```

#### 2. Coordinator Implementation

```typescript
// src/cascade/coordinator.ts

export class CascadeCoordinator {
  private state: CascadeState | null = null;
  
  async trigger(filePath: string): Promise<void> {
    console.log(`[coordinator] Cascade triggered by: ${filePath}`);
    
    // 1. Initialize cascade state
    this.state = await initCascade(filePath);
    
    // 2. Identify trigger type
    const triggerType = this.identifyTrigger(filePath);
    
    // 3. Build dependency graph
    const deps = await this.buildDependencyGraph(filePath);
    
    // 4. Sort by layer order
    const orderedSpecs = this.sortByLayer(deps);
    
    // 5. Process each layer
    for (const spec of orderedSpecs) {
      await this.processSpec(spec);
      
      if (this.state!.status !== 'running') {
        break; // Paused or failed
      }
    }
    
    // 6. Mark complete if still running
    if (this.state!.status === 'running') {
      this.state!.status = 'completed';
      await saveState(this.state!);
      console.log(`[coordinator] Cascade ${this.state!.cascade_id} completed`);
    }
  }
  
  private identifyTrigger(filePath: string): TriggerType {
    if (filePath === 'project.scl') return 'north_star';
    if (filePath.startsWith('specs/')) return 'spec';
    if (filePath.startsWith('src/')) return 'code';
    return 'unknown';
  }
  
  private async buildDependencyGraph(filePath: string): Promise<SpecNode[]> {
    const index = await loadIndex();
    const visited = new Set<string>();
    const graph: SpecNode[] = [];
    
    const traverse = async (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const spec = index.specs[id];
      if (!spec) return;
      
      graph.push({
        id,
        layer: spec.layer,
        path: spec.path,
        refs: spec.refs || []
      });
      
      // Find specs that reference this one
      for (const [otherId, otherSpec] of Object.entries(index.specs)) {
        if (otherSpec.refs?.includes(id)) {
          await traverse(otherId);
        }
      }
    };
    
    const specId = await this.getSpecId(filePath);
    if (specId) await traverse(specId);
    
    return graph;
  }
  
  private async processSpec(spec: SpecNode): Promise<void> {
    // Determine agent type
    const agent = this.determineAgent(spec);
    
    // Increment depth
    this.state!.depth++;
    this.state!.current_agent = agent;
    await saveState(this.state!);
    
    // Check depth limit
    if (this.state!.depth > this.state!.max_depth) {
      this.state!.status = 'paused';
      console.warn(`[coordinator] Max depth reached (${this.state!.max_depth})`);
      return;
    }
    
    // Invoke agent
    const result = await this.invokeAgent(agent, spec);
    
    // Record invocation
    this.state!.agents_invoked.push({
      agent,
      timestamp: new Date().toISOString(),
      result: result.success ? 'success' : 'failure',
      files_modified: result.files || [],
      error: result.error
    });
    
    // Run verification gates
    const verification = await this.runVerificationGates(spec);
    this.state!.verification_results.push(verification);
    
    if (!verification.passed) {
      this.state!.status = 'failed';
      await saveState(this.state!);
      return;
    }
    
    await saveState(this.state!);
  }
  
  private determineAgent(spec: SpecNode): string {
    if (spec.id.startsWith('@specs/')) return 'speclang-spec-writer';
    if (spec.id.startsWith('@codegen/')) return 'speclang-code-gen';
    if (spec.id.startsWith('@tests/')) return 'speclang-test-writer';
    return 'speclang-spec-writer';
  }
}
```

#### 3. Agent Invocation

```typescript
// src/cascade/invocation.ts

interface AgentTask {
  description: string;
  subagent_type: 'general';
  prompt: string;
}

export async function invokeAgent(
  agent: string, 
  spec: SpecNode
): Promise<AgentResult> {
  const task = buildAgentTask(agent, spec);
  
  // This would use OpenCode's Task tool
  // For now, we return a structured prompt
  console.log(`[invocation] Invoking ${agent} for ${spec.id}`);
  console.log('Task:', task.description);
  
  return {
    success: true,
    files: [],
    output: 'Agent task queued'
  };
}

function buildAgentTask(agent: string, spec: SpecNode): AgentTask {
  const agentPrompts: Record<string, string> = {
    'speclang-spec-writer': `You are @speclang-spec-writer.

Task: Update ${spec.path}

Context:
- Trigger: Cascade from dependency change
- Spec ID: ${spec.id}
- Layer: ${spec.layer}
- Agent support: agent_autonomous

Requirements:
1. Read parent specs for context
2. Update spec with new requirements
3. Ensure all @ref: resolve (check _index.json)
4. Add step-by-step descriptions for operations
5. Run: python3 scripts/validate_refs.py
6. Run: python3 scripts/validate_autonomous.py --file ${spec.path}

Return structured report:
{
  "agent": "speclang-spec-writer",
  "status": "success|failure",
  "files_modified": [...],
  "validation": {...},
  "errors": []
}`,

    'speclang-code-gen': `You are @speclang-code-gen.

Task: Generate code from ${spec.path}

Context:
- Spec ID: ${spec.id}
- Layer: ${spec.layer}
- Target output: src/${spec.id.replace('@specs/', '').replace(/\//g, '/')}

Requirements:
1. Read spec file for type definitions
2. Generate TypeScript code with proper headers
3. Include SPECLANG-ID markers
4. Leave SPECLANG-IMPLEMENT markers for logic
5. Run: npx tsc --noEmit

Return structured report.`,

    'speclang-test-writer': `You are @speclang-test-writer.

Task: Create tests for ${spec.id}

Context:
- Implementation: src/${spec.id.replace('@specs/', '')}
- Spec: ${spec.path}

Requirements:
1. Read spec for test requirements
2. Create test file with describe/it blocks
3. Test all public operations
4. Run: bun test

Return structured report.`
  };
  
  return {
    description: `Process ${spec.id}`,
    subagent_type: 'general',
    prompt: agentPrompts[agent] || agentPrompts['speclang-spec-writer']
  };
}
```

#### 4. Verification Gates

```typescript
// src/cascade/verification.ts

export interface VerificationResult {
  step: number;
  timestamp: string;
  checks: {
    compilation?: { status: 'passed' | 'failed'; files_checked: number; errors?: string[] };
    references?: { status: 'passed' | 'failed'; broken_refs: number; details?: string[] };
    tests?: { status: 'passed' | 'failed'; passed: number; failed: number };
    autonomous?: { status: 'passed' | 'failed'; coverage?: number };
  };
  passed: boolean;
}

export async function runVerificationGates(spec: SpecNode): Promise<VerificationResult> {
  const step = 1; // Would be tracked in state
  const result: VerificationResult = {
    step,
    timestamp: new Date().toISOString(),
    checks: {},
    passed: true
  };
  
  // Gate 1: Reference Validation
  if (spec.path.startsWith('specs/')) {
    result.checks.references = await runReferenceValidation();
    if (result.checks.references.status === 'failed') {
      result.passed = false;
    }
  }
  
  // Gate 2: Autonomous Readiness
  if (spec.path.startsWith('specs/')) {
    result.checks.autonomous = await runAutonomousValidation(spec.path);
    if (result.checks.autonomous.status === 'failed') {
      result.passed = false;
    }
  }
  
  // Gate 3: Code Compilation
  if (spec.path.startsWith('src/')) {
    result.checks.compilation = await runCompilation(spec.path);
    if (result.checks.compilation.status === 'failed') {
      result.passed = false;
    }
  }
  
  // Gate 4: Test Execution
  if (spec.path.includes('test')) {
    result.checks.tests = await runTests();
    if (result.checks.tests.status === 'failed') {
      result.passed = false;
    }
  }
  
  return result;
}

async function runReferenceValidation(): Promise<VerificationResult['checks']['references']> {
  try {
    const output = await exec('python3 scripts/validate_refs.py');
    const broken = output.includes('BROKEN') ? parseBrokenRefs(output) : [];
    return {
      status: broken.length === 0 ? 'passed' : 'failed',
      broken_refs: broken.length,
      details: broken
    };
  } catch (error) {
    return { status: 'failed', broken_refs: -1, details: [error.message] };
  }
}

async function runAutonomousValidation(filepath: string): Promise<VerificationResult['checks']['autonomous']> {
  try {
    const output = await exec(`python3 scripts/validate_autonomous.py --file ${filepath}`);
    const passed = output.includes('PASSED') || output.includes('All checks passed');
    return {
      status: passed ? 'passed' : 'failed',
      coverage: parseCoverage(output)
    };
  } catch (error) {
    return { status: 'failed' };
  }
}

async function runCompilation(filepath: string): Promise<VerificationResult['checks']['compilation']> {
  try {
    await exec(`npx tsc --noEmit --skipLibCheck ${filepath}`);
    return { status: 'passed', files_checked: 1 };
  } catch (error) {
    return { 
      status: 'failed', 
      files_checked: 1, 
      errors: [error.message] 
    };
  }
}

async function runTests(): Promise<VerificationResult['checks']['tests']> {
  try {
    const output = await exec('python3 -m pytest tests/ -v');
    const { passed, failed } = parseTestResults(output);
    return {
      status: failed === 0 ? 'passed' : 'failed',
      passed,
      failed
    };
  } catch (error) {
    return { status: 'failed', passed: 0, failed: 1 };
  }
}
```

#### 5. Multi-Tree Traversal

```typescript
// src/cascade/tree-traversal.ts

interface TreeConfig {
  name: string;
  layers: [number, number];
  agent: string;
  output_dir: string;
}

const TREES: TreeConfig[] = [
  { name: 'specs', layers: [1, 5], agent: 'speclang-spec-writer', output_dir: 'specs/' },
  { name: 'src', layers: [6, 10], agent: 'speclang-code-gen', output_dir: 'src/' },
  { name: 'tests', layers: [10, 15], agent: 'speclang-test-writer', output_dir: 'tests/' },
  { name: 'docs', layers: [15, 20], agent: 'speclang-doc-gen', output_dir: 'docs/' }
];

export async function traverseTrees(
  state: CascadeState, 
  specs: SpecNode[]
): Promise<void> {
  // Group specs by layer
  const byLayer = new Map<number, SpecNode[]>();
  for (const spec of specs) {
    const layer = spec.layer;
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer)!.push(spec);
  }
  
  // Process by layer order (0 -> 1 -> 2 -> ... -> 10+)
  const sortedLayers = Array.from(byLayer.keys()).sort((a, b) => a - b);
  
  for (const layer of sortedLayers) {
    const tree = TREES.find(t => layer >= t.layers[0] && layer <= t.layers[1]);
    const layerSpecs = byLayer.get(layer)!;
    
    console.log(`[traverse] Processing layer ${layer} (${tree?.name || 'unknown'})`);
    
    // Update current pass
    state.current_pass = `${tree?.name || 'unknown'} (layer ${layer})`;
    await saveState(state);
    
    for (const spec of layerSpecs) {
      // Process spec (invoke agent, verify, etc.)
      // This would call coordinator methods
    }
    
    // User control point after each layer
    // In reality, would prompt user or check config
    const shouldContinue = await checkUserContinue();
    if (!shouldContinue) {
      state.status = 'paused';
      await saveState(state);
      return;
    }
  }
}
```

#### 6. Steering Packet Creation

```typescript
// src/cascade/steering.ts

interface SteeringPacket {
  id: string;
  type: 'success_confirmation' | 'error_report' | 'warning';
  task_id: string;
  timestamp: string;
  verification: {
    references: boolean;
    autonomous: boolean;
    compilation: boolean;
    tests: boolean;
  };
  quality_score: number;
  details: string;
}

export async function createSteeringPacket(
  state: CascadeState,
  result: VerificationResult
): Promise<SteeringPacket> {
  const packet: SteeringPacket = {
    id: `sp-${state.cascade_id}-step${result.step}`,
    type: result.passed ? 'success_confirmation' : 'error_report',
    task_id: `${state.cascade_id}-step${result.step}`,
    timestamp: new Date().toISOString(),
    verification: {
      references: result.checks.references?.status === 'passed',
      autonomous: result.checks.autonomous?.status === 'passed',
      compilation: result.checks.compilation?.status === 'passed',
      tests: result.checks.tests?.status === 'passed'
    },
    quality_score: calculateQualityScore(result),
    details: formatDetails(result)
  };
  
  // Save to steering packets file
  const packetsPath = '.speclang/steering_packets.json';
  const packets = await loadSteeringPackets(packetsPath);
  packets.push(packet);
  await fs.writeFile(packetsPath, JSON.stringify(packets, null, 2));
  
  return packet;
}

function calculateQualityScore(result: VerificationResult): number {
  const checks = Object.values(result.checks);
  const passed = checks.filter(c => c?.status === 'passed').length;
  const total = checks.filter(c => c !== undefined).length;
  return total > 0 ? passed / total : 0;
}
```

### Configuration

```yaml
# .speclang/cascade.yaml
max_depth: 5
quiet_period: 30s

trees:
  specs:
    layers: [1, 5]
    agent: speclang-spec-writer
  src:
    layers: [6, 10]
    agent: speclang-code-gen
  tests:
    layers: [10, 15]
    agent: speclang-test-writer
    
user_control:
  prompt_after_layer: true
  allow_skip_trees: true
  
verification:
  gates: [references, autonomous, compilation, tests]
  fail_fast: true
```

## Test Cases
1. Cascade initializes correctly on trigger
2. Dependency graph built accurately
3. Specs processed in layer order
4. Agent invocation prompts are correct
5. Verification gates run and report accurately
6. Depth limit prevents infinite loops
7. State persisted and recoverable
8. Multi-tree traversal works
9. Steering packets created correctly
10. User control points work

## Validation
```bash
# Test coordinator
bun test tests/cascade.test.ts

# Run manual cascade
speclang cascade trigger specs/auth.spec.md

# Check state
cat .speclang/cascade_state.json

# View steering packets
cat .speclang/steering_packets.json
```

## Output Format
After completing, output:
1. Coordinator files created
2. Agent invocation prompts
3. Verification gates implemented
4. Multi-tree traversal logic
5. Test results
