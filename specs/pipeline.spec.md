# speclang-header lines:13
id: "@speclang/pipeline"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [pipeline, build, hooks, recovery, convergence]
children:
  - "@ref:specs/pipeline.spec.dir/build"
  - "@ref:specs/pipeline.spec.dir/hooks"
  - "@ref:specs/pipeline.spec.dir/recovery"
short: "Pipeline - Build, test, deploy execution after convergence"
status: draft
---

# Pipeline

Execution pipeline that runs after cascade convergence. Builds generated code, runs tests, deploys artifacts, and handles recovery on failure.

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
    on-fail: notify-orchestrator "Tests failed — rolling back spec change @ref:xxx"
```

