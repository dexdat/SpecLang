---
id: "@speclang/assembler/config"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [assembler, config, build-yaml, speclangrc, schema]
short: "Configuration schema for SpecLang assembler"
status: draft
---

# Assembler Configuration

## .speclangrc — Project Configuration

Root configuration file placed at the project root. YAML format.

```yaml
# .speclangrc
project:
  name: "my-project"
  seed: "project.scl"
  version: "1.0.0"

watch:
  directories:
    - "specs/"
  exclude:
    - "node_modules/"
    - ".git/"
    - "dist/"
  debounce_ms: 100

convergence:
  quiet_period_ms: 30000
  max_iterations: 100

cascade:
  max_depth: 5
  max_concurrent: 10
  global_rate_limit: 60

model_pools:
  code-gen:
    max_concurrent: 5
    models:
      - provider: openai
        model: gpt-4o
        max_concurrent: 3
      - provider: openrouter
        model: gpt-4o
        max_concurrent: 5

pipeline:
  file: "build.yaml"
  max_attempts: 3

git:
  commit_prefix: "speclang:"
  validate_headers: true
```

## build.yaml — Pipeline Definition

Defines pipeline stages that run on convergence. Supports conditional execution and dependency ordering.

```yaml
pipeline:
  on_converge:
    - name: install
      run: "npm install"
      condition: "package.json changed"

    - name: typecheck
      run: "npm run build"
      depends_on: [install]

    - name: test
      run: "npm test"
      depends_on: [typecheck]

  on_success:
    - "git add -A"
    - "git commit -m 'speclang: cascade <cascade_id>'"

recovery:
  max_attempts: 3
  on_fail:
    - rollback: last_spec_change
    - notify: user
```

## Model Pool Configuration

See @ref:specs/assembler/model-pools for full model pool specification.

## CLI Configuration

See @ref:specs/assembler/cli for CLI commands.

## See Also

- @ref:specs/assembler/model-pools
- @ref:specs/assembler/cli
- @ref:specs/pipeline
