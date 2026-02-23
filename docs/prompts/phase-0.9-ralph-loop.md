# Bootstrap Phase 0.9: Ralph Loop System

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.9 of the bootstrap process.

**Prerequisites**: 
- Phase 0 (Foundation) complete
- SQLite database with base schema
- Basic agent protocol defined

## Your Task
Implement the Ralph Loop system - a dual-agent coordination pattern where a Builder agent writes implementation and a Verifier agent validates output, creating steering packets for corrections.

## Read These Specs First
1. `specs/ralph-loop.spec.md` - Main Ralph Loop spec
2. `specs/ralph-loop.spec.dir/workflow.spec.md` - Operational workflow
3. `specs/ralph-loop.spec.dir/state.spec.md` - State management
4. `specs/agent-protocol.spec.md` - Agent communication

## Current State
- SQLite database exists
- Agent protocol defined
- Need dual-agent coordination system

## What to Build

### Files to Create
```
src/ralph/
├── index.ts               # Main exports
├── loop.ts                # Loop controller
├── builder.ts             # Builder agent
├── verifier.ts            # Verifier agent
├── steering.ts            # Steering packets
├── validation.ts          # Validation pipeline
├── todo.ts                # Todo list management
└── state.ts               # State persistence

src/sqlite/migrations/
└── 005_ralph.sql         # Ralph tables

.opencode/skills/
├── ralph-builder.md       # Builder skill
└── ralph-verifier.md      # Verifier skill
```

### Requirements

#### 1. Ralph Loop Controller (loop.ts)
```typescript
interface RalphLoopConfig {
  quiet_period: number;     // Convergence detection
  max_depth: number;        // Max cascade depth
  auto_commit: boolean;     // Auto-commit on success
}

class RalphLoopController {
  private builder: BuilderAgent;
  private verifier: VerifierAgent;
  private todoList: TodoList;
  private state: LoopState;
  
  async run(config: RalphLoopConfig): Promise<LoopResult> {
    // 1. Load complete backing specifications
    await this.loadSpecs();
    
    // 2. Generate todo list
    await this.todoList.generate();
    
    // 3. Spawn Builder and Verifier agents
    await this.spawnAgents();
    
    // 4. Main loop
    while (this.todoList.hasPending()) {
      const task = this.todoList.next();
      
      // Assign task to Builder
      await this.builder.assign(task);
      
      // Builder executes task
      const output = await this.builder.execute();
      
      // Verifier validates output
      const result = await this.verifier.validate(output);
      
      if (result.passed) {
        // Mark task done, add recommendations
        await this.todoList.complete(task.id, result.recommendations);
      } else {
        // Create steering packet, send to Builder, retry
        const packet = await this.verifier.createSteeringPacket(result);
        await this.builder.receive(packet);
        await this.todoList.retry(task.id);
      }
    }
    
    // 5. System verification
    await this.runSystemVerification();
    
    // 6. Final validation and success report
    return this.generateReport();
  }
}
```

#### 2. Builder Agent (builder.ts)
```typescript
interface BuilderAgent {
  role: 'builder';
  
  capabilities: {
    read_sips: true;
    read_specs: true;
    write_specs: true;
    generate_code: true;
  };
  
  triggers: ['steering_packet', 'todo_item', 'manual'];
}

class BuilderAgent {
  async assign(task: Task): Promise<void> {
    this.currentTask = task;
    this.state = 'working';
  }
  
  async execute(): Promise<BuilderOutput> {
    const task = this.currentTask;
    
    // Read relevant specs
    const specs = await this.readSpecs(task.dependencies);
    
    // Generate implementation
    const output = await this.generate(task, specs);
    
    // Write files
    for (const file of output.files) {
      await this.writeFile(file.path, file.content);
    }
    
    return {
      task_id: task.id,
      files_written: output.files.map(f => f.path),
      summary: output.summary
    };
  }
  
  async receive(packet: SteeringPacket): Promise<void> {
    // Process steering packet and adjust approach
    this.adjustments = packet.suggestions;
  }
}
```

#### 3. Verifier Agent (verifier.ts)
```typescript
interface VerifierAgent {
  role: 'verifier';
  
  capabilities: {
    validate_specs: true;
    check_compilation: true;
    run_tests: true;
    create_steering_packets: true;
  };
  
  validation_pipeline: [
    'spec_format',
    'code_compilation',
    'test_execution',
    'integration'
  ];
}

class VerifierAgent {
  async validate(output: BuilderOutput): Promise<ValidationResult> {
    const results: StageResult[] = [];
    
    // Stage 1: Spec Format Check
    results.push(await this.checkSpecFormat(output));
    
    // Stage 2: Code Compilation
    results.push(await this.checkCompilation(output));
    
    // Stage 3: Test Execution
    results.push(await this.runTests(output));
    
    // Stage 4: Integration Test
    results.push(await this.runIntegration(output));
    
    return {
      passed: results.every(r => r.passed),
      stages: results,
      recommendations: this.generateRecommendations(results)
    };
  }
  
  async createSteeringPacket(result: ValidationResult): Promise<SteeringPacket> {
    const failures = result.stages.filter(s => !s.passed);
    
    return {
      type: 'error_report',
      task_id: this.currentTask.id,
      errors: failures.map(f => ({
        stage: f.stage,
        message: f.message,
        file_path: f.file,
        suggested_fix: f.suggestion
      })),
      priority: this.calculatePriority(failures),
      created_at: Date.now()
    };
  }
}
```

#### 4. Steering Packets (steering.ts)
```typescript
type SteeringPacketType = 
  | 'error_report'
  | 'fix_suggestion'
  | 'priority_change'
  | 'success_confirmation';

interface SteeringPacket {
  id: string;
  type: SteeringPacketType;
  task_id: string;
  created_at: number;
  processed_at?: number;
  
  // Type-specific fields
  errors?: ErrorReport[];
  suggestions?: FixSuggestion[];
  priority?: number;
  success?: SuccessReport;
}

interface ErrorReport {
  stage: string;
  error_type: string;
  file_path: string;
  error_message: string;
  suggested_fix: string;
  priority: number;
}

interface FixSuggestion {
  file_path: string;
  current_state: string;
  suggested_change: string;
  rationale: string;
}

class SteeringPacketManager {
  async create(packet: SteeringPacket): Promise<void> {
    await this.db.run(`
      INSERT INTO steering_packets (id, task_id, type, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [packet.id, packet.task_id, packet.type, JSON.stringify(packet), Date.now()]);
  }
  
  async getNext(): Promise<SteeringPacket | null> {
    const row = await this.db.get(`
      SELECT * FROM steering_packets 
      WHERE processed_at IS NULL 
      ORDER BY created_at ASC 
      LIMIT 1
    `);
    return row ? JSON.parse(row.content) : null;
  }
  
  async markProcessed(id: string): Promise<void> {
    await this.db.run(`
      UPDATE steering_packets SET processed_at = ? WHERE id = ?
    `, [Date.now(), id]);
  }
}
```

#### 5. Validation Pipeline (validation.ts)
```typescript
interface ValidationStage {
  name: string;
  checks: ValidationCheck[];
}

const VALIDATION_STAGES: ValidationStage[] = [
  {
    name: 'spec_format',
    checks: [
      { name: 'header_present', fn: checkHeaderPresent },
      { name: 'id_matches_path', fn: checkIdMatchesPath },
      { name: 'required_fields', fn: checkRequiredFields },
      { name: 'tags_non_empty', fn: checkTagsNonEmpty },
      { name: 'references_exist', fn: checkReferencesExist },
      { name: 'file_extension', fn: checkFileExtension }
    ]
  },
  {
    name: 'code_compilation',
    checks: [
      { name: 'syntax_valid', fn: checkSyntaxValid },
      { name: 'imports_resolve', fn: checkImportsResolve },
      { name: 'type_checking', fn: checkTypeChecking }
    ]
  },
  {
    name: 'test_execution',
    checks: [
      { name: 'tests_pass', fn: checkTestsPass },
      { name: 'coverage_threshold', fn: checkCoverageThreshold }
    ]
  },
  {
    name: 'integration',
    checks: [
      { name: 'components_integrate', fn: checkIntegration },
      { name: 'e2e_flows', fn: checkE2E },
      { name: 'no_regression', fn: checkNoRegression }
    ]
  }
];

async function runValidationPipeline(output: BuilderOutput): Promise<ValidationResult> {
  const results: StageResult[] = [];
  
  for (const stage of VALIDATION_STAGES) {
    const stageResult = await runStage(stage, output);
    results.push(stageResult);
    
    if (!stageResult.passed) {
      // Stop on first failure
      break;
    }
  }
  
  return {
    passed: results.every(r => r.passed),
    stages: results
  };
}
```

#### 6. Todo List Management (todo.ts)
```typescript
interface Task {
  id: string;
  description: string;
  depends_on: string[];
  estimated_complexity: 'low' | 'medium' | 'high';
  priority: number;
  assigned_to: 'builder' | 'verifier';
  status: 'pending' | 'in_progress' | 'done' | 'failed';
  created_at: number;
  started_at?: number;
  completed_at?: number;
}

class TodoList {
  private tasks: Task[] = [];
  
  async generate(): Promise<void> {
    // 1. Analyze all specs in _index.json
    const specs = await this.loadSpecs();
    
    // 2. Identify missing implementation specs
    const missing = this.findMissingImplementation(specs);
    
    // 3. Determine dependencies
    const withDeps = this.resolveDependencies(missing);
    
    // 4. Estimate effort/complexity
    const withComplexity = await this.estimateComplexity(withDeps);
    
    // 5. Create prioritized list
    this.tasks = this.prioritize(withComplexity);
    
    // Persist to database
    await this.persist();
  }
  
  next(): Task | null {
    return this.tasks
      .filter(t => t.status === 'pending')
      .filter(t => this.dependenciesMet(t))
      .sort((a, b) => b.priority - a.priority)[0] || null;
  }
  
  hasPending(): boolean {
    return this.tasks.some(t => t.status === 'pending');
  }
  
  async complete(taskId: string, recommendations: string[]): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'done';
      task.completed_at = Date.now();
      await this.persist();
    }
  }
  
  async retry(taskId: string): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'pending';
      task.started_at = undefined;
      await this.persist();
    }
  }
}
```

### SQL Schema Migration
```sql
-- 005_ralph.sql

-- Tasks table
CREATE TABLE ralph_tasks (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  depends_on TEXT,  -- JSON array
  estimated_complexity TEXT,
  priority INTEGER DEFAULT 5,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER,
  started_at INTEGER,
  completed_at INTEGER
);

-- Steering packets table
CREATE TABLE steering_packets (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  type TEXT,
  content TEXT,  -- JSON
  created_at INTEGER,
  processed_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
);

-- Validation results table
CREATE TABLE validation_results (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  stage TEXT,
  passed BOOLEAN,
  details TEXT,  -- JSON
  created_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
);

-- Indexes
CREATE INDEX idx_ralph_tasks_status ON ralph_tasks(status);
CREATE INDEX idx_steering_packets_task ON steering_packets(task_id);
CREATE INDEX idx_validation_results_task ON validation_results(task_id);
```

### Implementation Phases
```typescript
enum RalphPhase {
  PHASE_1_MANUAL_EMULATION = 'phase_1',    // Human = Builder, agent = Verifier
  PHASE_2_SEMI_AUTOMATED = 'phase_2',      // Agent = Builder, scripts = Verifier
  PHASE_3_FULL_AUTOMATION = 'phase_3',     // Both agents automated
  PHASE_4_SELF_HOSTING = 'phase_4'         // Speclang improves itself
}
```

## Test Cases
1. Todo list generates from specs
2. Builder executes task correctly
3. Verifier validates output
4. Steering packet created on failure
5. Task retried with steering packet
6. Loop completes on all tasks done
7. State persisted across restarts

## Validation
```bash
# Run tests
bun test tests/ralph/

# Run validation pipeline
bun run src/ralph/validation.ts

# Start Ralph Loop
bun run src/ralph/loop.ts --phase=phase_1
```

## Output Format
After completing, output:
1. Ralph Loop components created
2. Validation stages implemented
3. Todo list generation working
4. Steering packet flow working
