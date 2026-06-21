# speclang-header lines:10
id: "@specs/speclang-test"
version: 1.0.0
layer: 5
target: src/.speclang-test/
project_level: Alpha
agent_support: agent_autonomous
tags: [test, infrastructure]
short: Self-hosting test infrastructure for SpecLang compiler
---

# SpecLang Self-Hosting Test Infrastructure

## Overview

This module contains test infrastructure for validating the SpecLang compiler's self-hosting capabilities. Files include assembled spec outputs, test harnesses, and verification scripts used to validate that the compiler can process its own specifications.

## Files

### @block:assemble-all @kind:code @ref:src/.speclang-test/assemble-all.ts
Assembles all code-pair spec files by reading every .spec.ts.md in specs/ and extracting Implementation code blocks to .spec.ts files.

### @block:assembler-spec @kind:spec @ref:src/.speclang-test/assembler.spec.ts
Assembler engine specification test output.

### @block:cascade-router-spec @kind:spec @ref:src/.speclang-test/cascade-router.spec.ts
Cascade router specification test output.

### @block:cascade-tracker @kind:spec @ref:src/.speclang-test/cascade-tracker.spec.ts
Cascade tracker specification test output.

### @block:daemon-spec @kind:spec @ref:src/.speclang-test/daemon.spec.ts
Daemon specification test output.

### @block:gitreins-bridge @kind:spec @ref:src/.speclang-test/gitreins-bridge.spec.ts
GitReins bridge specification test output.

### @block:guard-spec @kind:spec @ref:src/.speclang-test/guard.spec.ts
Guard specification test output.

### @block:mcp-server-spec @kind:spec @ref:src/.speclang-test/mcp-server.spec.ts
MCP server specification test output.

### @block:pipeline-spec @kind:spec @ref:src/.speclang-test/pipeline.spec.ts
Pipeline specification test output.

### @block:self-assembly @kind:code @ref:src/.speclang-test/self-assembly.ts
Self-assembly test script for validating the compiler's ability to compile itself.

### @block:self-host-harness @kind:code @ref:src/.speclang-test/self-host-harness.ts
Self-hosting test harness that runs the compiler against its own specs.

### @block:self-host-verify @kind:code @ref:src/.speclang-test/self-host-verify.ts
Verification script that validates self-hosting test results.

### @block:test-assembler @kind:test @ref:src/.speclang-test/test-assembler.ts
Unit tests for the assembler module.

### @block:test-cascade-router @kind:test @ref:src/.speclang-test/test-cascade-router.ts
Unit tests for the cascade router module.

### @block:test-daemon @kind:test @ref:src/.speclang-test/test-daemon.ts
Unit tests for the daemon module.

### @block:test-daemon-integration @kind:test @ref:src/.speclang-test/test-daemon-integration.ts
Integration tests for the daemon module.

### @block:test-guard @kind:test @ref:src/.speclang-test/test-guard.ts
Unit tests for the guard module.

### @block:test-integration @kind:test @ref:src/.speclang-test/test-integration.ts
General integration tests.

### @block:test-mcp-server @kind:test @ref:src/.speclang-test/test-mcp-server.ts
Unit tests for the MCP server module.

### @block:test-output @kind:test @ref:src/.speclang-test/test-output.ts
Test output validation script.

### @block:test-pipeline @kind:test @ref:src/.speclang-test/test-pipeline.ts
Unit tests for the pipeline module.

### @block:test-regex @kind:test @ref:src/.speclang-test/test-regex.ts
Regex utility tests.

### @block:verify-all @kind:test @ref:src/.speclang-test/verify-all.ts
Master verification script that runs all test suites.

### @block:assembled @kind:spec
Assembled spec outputs:
- assembler.spec.ts
- cascade-router.spec.ts
- daemon.spec.ts
- guard.spec.ts
- mcp-server.spec.ts
- pipeline.spec.ts
