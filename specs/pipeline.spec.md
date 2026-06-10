---
id: "@speclang/pipeline"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [pipeline, build, hooks, recovery, convergence, git-hooks, assembler]
children:
  - "@ref:specs/pipeline.spec.dir/build"
  - "@ref:specs/pipeline.spec.dir/hooks"
  - "@ref:specs/pipeline.spec.dir/recovery"
short: "Pipeline - Build, test, deploy execution after convergence with git hook validation"
status: draft
---

# Pipeline

Execution pipeline that runs after cascade convergence. Builds generated code, runs tests, deploys artifacts, handles recovery on failure, and validates specs before commits.

## Overview

```speclang
# @block:pipeline/overview @kind:entity
Pipeline:
  trigger: Convergence detected (quiet period)
  definition: build.yaml or build.scl in project root
  stages:
    - build: Compile generated code
    - test: Run generated tests
    - lint: Code quality checks
    - deploy: Deployment (optional)
    - notify: Report results

  recovery:
    - on_failure: Rollback last spec change
    - max_attempts: 3
    - notify_northstar: Alert user

  hooks:
    - pre_build: Setup environment
    - post_test: Generate reports
    - on_failure: Recovery actions
```

## Assembler-to-Compiler Handoff

### @block:pipeline/assembler-compiler-handoff @kind:entity
```speclang
AssemblerCompilerHandoff:
  description: "The pipeline runs the target language compiler AFTER SpecLang assembler produces .spec.{lang} files"

  flow:
    1. Cascade converges (quiet period detected)
    2. Pipeline triggers
    3. Assembler runs: reads .spec.{lang}.md → produces .spec.{lang} source files
    4. Target language compiler runs: gcc, rustc, tsc, go build, etc.
    5. Tests run against compiled artifacts
    6. Lint checks
    7. Deploy (if configured)

  separation:
    - SpecLang assembler: .spec.{lang}.md → .spec.{lang} (code generation)
    - Target compiler: .spec.{lang} → binary/library (compilation)
    - Pipeline orchestrates both steps
```

## Git Hook Validation

### @block:pipeline/git-hook-validation @kind:entity
```speclang
GitHookValidation:
  description: "Pre-commit git hook that validates spec headers on every commit"

  hook_type: "pre-commit"

  validation_checks:
    - header_format: "Every .spec.md and .spec.{lang}.md must have valid YAML header"
    - required_fields: "id, version, layer present on all spec files"
    - code_pair_fields: "If .spec.{lang}.md: target_lang, output, owned-by must be present"
    - link_resolution: "@ref: links must resolve to existing files"
    - yaml_validity: "Header must parse as valid YAML"

  installation:
    - Installed by speclangd setup
    - Symlinked to .git/hooks/pre-commit
    - Updated when pipeline spec changes

  rejection:
    - If any spec has a broken header, commit is rejected
    - Error message lists all failing specs and their issues
    - User must fix headers before committing

  example_output:
    ERROR: Pre-commit hook rejected
    specs/auth.spec.md: missing required field 'version'
    specs/handler.spec.go.md: code-pair spec missing 'target_lang'
    @ref:specs/missing resolves to non-existent file
```

## Build Stages

See @ref:specs/pipeline.spec.dir/build for core pipeline stages, conditional execution, and artifact generation.

## Hooks

See @ref:specs/pipeline.spec.dir/hooks for pre/post hooks, conditional hooks, and custom hook definitions.

## Recovery

See @ref:specs/pipeline.spec.dir/recovery for failure recovery, rollback mechanisms, and notification systems.

## Self-Defining Pipeline

The pipeline is self-defining: the `build.yaml` file is itself a spec that can be modified by agents during spec expansion. This allows the pipeline to adapt to project needs.

### Everything From Specs
The entire build/test/deploy system comes from specs:
- **Build commands**: Defined in `build.yaml` spec (or referenced specs)
- **Test suites**: Generated from `.test.spec.md` files
- **Docker configuration**: Generated from `.docker.spec` or `docker-compose.yaml.spec`
- **Deployment scripts**: Generated from `.deploy.spec` files
- **Environment configuration**: Generated from `.env.spec` files

### Makefile-like System
The `build.yaml` acts like a **modern makefile** generated from project specs:
- **Stages**: Defined in YAML with dependencies
- **Conditions**: Run based on file changes, environment, project state
- **Hooks**: Pre/post actions for each stage
- **Recovery**: Automatic rollback and retry on failure

Example `build.yaml`:
```yaml
pipeline:
  on-converge:
    - run: "go mod tidy && go build ./..."
      condition: files-changed-in: "**/*.go"
    - run: "npm test"
      condition: frontend-changed
    - run: "docker build -t myapp ."
      condition: dockerfile-changed
    - run: "docker-compose up -d"
      condition: deployment-requested
  recovery:
    max-attempts: 3
    on-fail: notify-orchestrator "Tests failed — rolling back spec change"
```

### @block:pipeline/stages @kind:code
Pipeline stages define the execution order and dependencies.

```typescript
interface PipelineStage {
  name: string;
  command: string;
  depends_on?: string[];
  condition?: StageCondition;
  timeout?: number;
  retry?: number;
  continue_on_failure?: boolean;
}

const DEFAULT_STAGES: PipelineStage[] = [
  { name: 'build', command: 'npm run build', depends_on: [] },
  { name: 'test', command: 'npm test', depends_on: ['build'] },
  { name: 'lint', command: 'npm run lint', depends_on: ['build'] },
  { name: 'deploy', command: './scripts/deploy.sh', depends_on: ['test'], condition: { type: 'never' } },
  { name: 'notify', command: './scripts/notify.sh', depends_on: ['deploy', 'lint'], continue_on_failure: true },
];
```

### @block:pipeline/ordering @kind:code
Stage ordering with dependency resolution.

```typescript
function resolveStageOrder(stages: PipelineStage[]): string[] {
  const graph = new Map<string, string[]>();
  for (const stage of stages) {
    graph.set(stage.name, stage.depends_on || []);
  }

  const order: string[] = [];
  const visited = new Set<string>();

  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);
    for (const dep of graph.get(name) || []) {
      visit(dep);
    }
    order.push(name);
  }

  for (const stage of stages) {
    visit(stage.name);
  }
  return order;
}
```

### @block:pipeline/conditions @kind:code
Stage conditions control when stages execute.

```typescript
interface StageCondition {
  type: 'files-changed-in' | 'always' | 'never' | 'on-change';
  pattern?: string;
}

function shouldRunStage(stage: PipelineStage, changedFiles: string[]): boolean {
  if (!stage.condition) return true;
  if (stage.condition.type === 'always') return true;
  if (stage.condition.type === 'never') return false;
  if (stage.condition.type === 'files-changed-in') {
    return changedFiles.some(f => f.match(stage.condition!.pattern!));
  }
  return true;
}
```

### @block:pipeline/examples @kind:note
Pipeline configuration examples.

**Example 1: Simple TypeScript Project**
```yaml
pipeline:
  stages:
    - build: tsc
    - test: vitest run
    - lint: eslint src/
```

**Example 2: Multi-Language**
```yaml
pipeline:
  stages:
    - build-go: go build ./...
    - build-ts: tsc
    - test-go: go test ./...
    - test-ts: vitest run
```

**Example 3: With Deployment**
```yaml
pipeline:
  on-converge:
    - run: npm run build
    - run: npm test
    - run: docker build -t myapp .
      condition: deployment-requested
