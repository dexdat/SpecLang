---
name: sip-125-pipeline-test-speclang-v0
title: "SIP 125: Pipeline Test Stages"
version: 0.1.0
description: Test stage configuration, execution, and test result handling in pipelines
category: standard
---

# SIP 125: Pipeline Test Stages

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Test Stages—the testing and validation phases in SpecLang pipelines.

### Quick Start

```yaml
pipeline:
  test:
    - name: unit-tests
      command: "go test ./..."
      coverage: true
      threshold: 80
      
    - name: integration-tests
      command: "go test -tags=integration ./..."
      depends_on: [unit-tests]
```

### When to Read This

- **Configuring tests:** Setting up test stages
- **Coverage:** Code coverage tracking
- **Test types:** Unit, integration, e2e

### Related SIPs

- SIP 13: Pipeline System
- SIP 74: Pipeline Conditions
- SIP 76: Integration Tests

## Abstract

This SIP specifies test stage configuration, test execution, coverage reporting, and test result handling for the SpecLang pipeline system.

## Motivation

Test stages are needed because:
- Code quality requires automated testing
- Different test types need different configurations
- Coverage metrics are essential for quality gates
- Test results must be tracked and reported

## Specification

### Test Stage Configuration

```yaml
TestStage:
  name: string              # Stage identifier
  command: string           # Test command to execute
  type: TestType            # "unit" | "integration" | "e2e" | "performance"
  cwd: string               # Working directory (optional)
  env: Map<String, String>  # Environment variables (optional)
  timeout: number          # Timeout in seconds (default: 300)
  retry: RetryConfig       # Retry configuration (optional)
  coverage: boolean        # Enable coverage (default: false)
  threshold: number        # Minimum coverage percentage
  artifacts: Artifact[]    # Test outputs (optional)
  depends_on: string[]     # Stage dependencies (optional)
  condition: string        # Conditional execution (optional)
```

### Test Types

```yaml
TestTypes:
  unit:
    description: "Unit tests - fast, isolated"
    timeout: 60
    parallel: true
    coverage: true
    
  integration:
    description: "Integration tests - component interaction"
    timeout: 300
    parallel: false
    coverage: true
    services: true
    
  e2e:
    description: "End-to-end tests - full system"
    timeout: 600
    parallel: false
    coverage: false
    services: true
    cleanup: true
    
  performance:
    description: "Performance/load tests"
    timeout: 900
    parallel: false
    resources: dedicated
```

### Coverage Configuration

```yaml
CoverageConfig:
  enable: boolean           # Enable coverage tracking
  format: string           # "cobertura" | "json" | "xml" | "lcov"
  output: string           # Output file path
  threshold: number        # Minimum percentage
  fail_on_decrease: boolean # Fail if coverage drops
  
  # Language-specific
  languages:
    go:
      command: "go test -coverprofile=coverage.out ./..."
      report: "go tool cover -html=coverage.out"
      
    node:
      command: "npm test -- --coverage"
      report: "npx coverage-report"
      
    python:
      command: "pytest --cov=. --cov-report=xml"
      report: "coverage report"
```

### Test Result Configuration

```yaml
TestResultConfig:
  format: string           # "junit" | "json" | "tap" | "xunit"
  output: string           # Output file path
  upload: boolean          # Upload to test service
  archive: boolean         # Archive test results
  
  options:
    show_stdout: boolean   # Show passing test output
    show_stderr: boolean   # Show stderr
    verbose: boolean       # Verbose output
    color: boolean         # Colored output
```

### Test Stage Execution

```yaml
TestExecution:
  steps:
    - name: setup
      command: "setup test environment"
      
    - name: run_tests
      command: "execute test command"
      
    - name: collect_coverage
      command: "generate coverage report"
      
    - name: check_threshold
      command: "verify coverage threshold"
      
    - name: upload_results
      command: "upload test artifacts"
```

### Test Environment

```yaml
TestEnvironment:
  default:
    cpu: 2
    memory: 4GB
    timeout: 300
    
  types:
    unit:
      cpu: 1
      memory: 2GB
      
    integration:
      cpu: 2
      memory: 4GB
      services: ["postgres", "redis"]
      
    e2e:
      cpu: 2
      memory: 4GB
      services: full_stack
```

### Service Containers

```yaml
ServiceContainer:
  name: string             # Service name
  image: string           # Docker image
  ports: number[]          # Exposed ports
  environment: object      # Environment variables
  healthcheck: object     # Health check config
  wait_for: string        # Wait for condition
  
  # Example
  postgres:
    image: postgres:15
    ports: [5432]
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    healthcheck:
      command: "pg_isready -U test"
      interval: 5s
      timeout: 5s
```

### Test Stage Examples

### Example 1: Go Unit Tests

```yaml
pipeline:
  test:
    - name: unit-tests
      type: unit
      command: "go test -v -race -coverprofile=coverage.out ./..."
      coverage: true
      threshold: 80
      fail_on_decrease: true
      artifacts:
        - path: coverage.out
          type: file
        - path: test-results.xml
          type: file
      retry:
        max_attempts: 2
        backoff: exponential
```

### Example 2: Integration Tests with Services

```yaml
pipeline:
  test:
    - name: integration-tests
      type: integration
      command: "go test -tags=integration -v ./..."
      services:
        - name: postgres
          image: postgres:15
          ports: [5432]
          environment:
            POSTGRES_DB: testdb
            POSTGRES_USER: test
            POSTGRES_PASSWORD: test
        - name: redis
          image: redis:7
          ports: [6379]
      timeout: 300
      artifacts:
        - path: integration-results.xml
          type: file
```

### Example 3: Multi-Language Test Matrix

```yaml
pipeline:
  test:
    - name: test-go
      type: unit
      command: "go test -v ./..."
      coverage: true
      
    - name: test-typescript
      type: unit
      command: "npm test -- --coverage"
      cwd: frontend/
      coverage: true
      
    - name: test-python
      type: unit
      command: "pytest --cov=. --cov-report=xml"
      coverage: true
      
    - name: e2e-tests
      type: e2e
      command: "cypress run"
      depends_on: [test-go, test-typescript, test-python]
      services:
        - name: app
          image: app:latest
          ports: [3000]
```

### Example 4: Coverage Threshold Gate

```yaml
pipeline:
  test:
    - name: coverage-check
      type: unit
      command: "go test -coverprofile=coverage.out ./..."
      coverage: true
      threshold:
        overall: 80
        critical: 90
        paths:
          - core/**: 85
          - api/**: 75
      fail_on_decrease: true
      artifacts:
        - path: coverage.out
          type: file
        - path: coverage-report.html
          type: file
```

### Test Results API

```typescript
interface TestStage {
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance';
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  timeout: number;
  retry: RetryConfig;
  coverage: CoverageConfig;
  threshold: number;
  artifacts: Artifact[];
  services?: ServiceContainer[];
  depends_on: string[];
  condition?: string;
}

interface CoverageConfig {
  enable: boolean;
  format: 'cobertura' | 'json' | 'xml' | 'lcov';
  output: string;
  threshold: number;
  fail_on_decrease: boolean;
}

interface ServiceContainer {
  name: string;
  image: string;
  ports: number[];
  environment: Record<string, string>;
  healthcheck?: HealthCheck;
}

interface TestResult {
  stage_name: string;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  coverage?: CoverageResult;
}

class TestExecutor {
  async executeStage(stage: TestStage): Promise<TestResult> {
    await this.startServices(stage.services);
    await this.waitForHealthy(stage.services);
    
    const result = await this.runTests(stage);
    
    if (stage.coverage?.enable) {
      const coverage = await this.collectCoverage(stage);
      await this.checkThreshold(coverage, stage.threshold);
    }
    
    await this.stopServices(stage.services);
    await this.uploadArtifacts(stage);
    
    return result;
  }
  
  async runTests(stage: TestStage): Promise<TestResult> {
    const output = await this.exec(stage.command, {
      cwd: stage.cwd,
      env: stage.env,
      timeout: stage.timeout * 1000
    });
    
    return this.parseTestOutput(output);
  }
  
  async collectCoverage(stage: TestStage): Promise<CoverageResult> {
    const coverageFile = stage.coverage?.output || 'coverage.out';
    return this.parseCoverage(coverageFile);
  }
  
  async checkThreshold(coverage: CoverageResult, threshold: number): Promise<void> {
    if (coverage.percentage < threshold) {
      throw new CoverageThresholdError(
        `Coverage ${coverage.percentage}% is below threshold ${threshold}%`
      );
    }
  }
}
```

## References

- @ref:specs/pipeline.spec.dir/test
- SIP 13: Pipeline System
- SIP 74: Pipeline Conditions
- SIP 76: Integration Tests

## Copyright

This document is in the public domain.
