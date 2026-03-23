---
name: sip-076-integration-test-speclang-v0
title: "SIP 76: Integration Testing"
version: 0.1.0
description: Integration test specifications for SpecLang system
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 76: Integration Testing

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines integration testing specifications for the SpecLang system, ensuring all components work together correctly.

### Quick Start

Integration tests verify:
1. **Full cycles**: Spec-to-code round trips
2. **Component integration**: MCP, Daemon, Pipeline, Agents
3. **End-to-end flows**: User workflows from start to finish
4. **Edge cases**: Error handling, concurrent operations

### When to Read This

- **Writing tests**: How to structure integration tests
- **CI/CD setup**: Integration test configuration
- **Debugging failures**: Common integration issues

### Related SIPs

- SIP 24: Test Specs
- SIP 13: Pipeline
- SIP 10: Daemon
- SIP 11: MCP Tools

## Abstract

Integration testing ensures that SpecLang components work correctly together. This SIP defines test categories, fixtures, and patterns for comprehensive integration coverage.

## Motivation

Integration tests are critical because:
- Unit tests miss inter-component issues
- Real-world usage spans multiple components
- Cascade effects need end-to-end validation
- Performance issues appear at integration level

## Rationale

**Layered Testing Strategy:**

1. **Unit tests**: Individual functions
2. **Integration tests**: Component combinations
3. **E2E tests**: Full user workflows
4. **Stress tests**: High-load scenarios

This follows industry-standard testing pyramids.

## Specification

### Test Categories

```yaml
TestCategories:
  full_cycle:
    description: "Complete spec-to-code cycles"
    tests:
      - spec_to_index_to_validation
      - spec_to_code_generation
      - change_detection_to_cascade
      - hook_trigger_to_completion
    
  component_integration:
    description: "Component interaction tests"
    tests:
      - mcp_server_requests
      - daemon_file_watching
      - pipeline_stage_execution
      - agent_protocol
      - code_generator_integration
      - ui_integration
  
  data_flow:
    description: "Data flow through system"
    tests:
      - spec_parsing_flow
      - index_generation_flow
      - validation_flow
      - cascade_propagation_flow
  
  error_handling:
    description: "Error and edge case handling"
    tests:
      - invalid_spec_handling
      - missing_reference_handling
      - concurrent_access_handling
      - timeout_handling
  
  recovery:
    description: "System recovery tests"
    tests:
      - daemon_restart_recovery
      - index_rebuild_recovery
      - cascade_failure_recovery
```

### Test Fixtures

```yaml
TestFixtures:
  project_structures:
    minimal:
      specs: 1
      layers: 1
      purpose: "Quick smoke tests"
    
    small:
      specs: 10
      layers: 3
      purpose: "Basic integration tests"
    
    medium:
      specs: 100
      layers: 5
      purpose: "Standard integration tests"
    
    large:
      specs: 500
      layers: 7
      purpose: "Scale integration tests"
    
    circular_deps:
      specs: 10
      purpose: "Circular dependency detection tests"
    
    invalid_refs:
      specs: 10
      purpose: "Reference validation tests"

  mock_components:
    mock_daemon:
      purpose: "Test without file watching"
      features:
        - event_injection
        - cascade_simulation
    
    mock_mcp_server:
      purpose: "Test without real server"
      features:
        - request_recording
        - response_mocking
    
    mock_pipeline:
      purpose: "Test pipeline logic"
      features:
        - stage_control
        - hook_injection
```

### Test Patterns

```yaml
TestPatterns:
  setup_teardown:
    pattern: |
      @pytest.fixture
      def component():
          instance = create_component()
          yield instance
          instance.cleanup()
    
    purpose: "Ensure clean state for each test"
  
  given_when_then:
    pattern: |
      def test_behavior():
          # Given
          setup_preconditions()
          
          # When
          result = perform_action()
          
          # Then
          assert result.meets_expectations()
    
    purpose: "Clear test structure"
  
  parametrized:
    pattern: |
      @pytest.mark.parametrize("input,expected", [
          (case1, result1),
          (case2, result2),
      ])
      def test_cases(input, expected):
          assert process(input) == expected
    
    purpose: "Test multiple scenarios"
  
  async_testing:
    pattern: |
      @pytest.mark.asyncio
      async def test_async_operation():
          result = await async_operation()
          assert result.success
    
    purpose: "Test async components"
```

### Integration Points

```yaml
IntegrationPoints:
  parser_to_index:
    components: [Parser, IndexGenerator]
    test: "Parsed specs appear in index"
    critical_path: true
  
  index_to_validation:
    components: [Index, Validator]
    test: "Validator uses index for refs"
    critical_path: true
  
  daemon_to_cascade:
    components: [Daemon, CascadeSystem]
    test: "File changes trigger cascade"
    critical_path: true
  
  mcp_to_tools:
    components: [MCPServer, Tools]
    test: "MCP calls execute tools"
    critical_path: true
  
  pipeline_to_hooks:
    components: [Pipeline, Hooks]
    test: "Hooks trigger pipeline stages"
    critical_path: true
  
  cascade_to_codegen:
    components: [CascadeSystem, CodeGenerator]
    test: "Cascade triggers regeneration"
    critical_path: true
```

## Examples

### Example 1: Full Cycle Test

```python
class TestFullCycle:
    """Test complete spec-to-code cycles."""
    
    def test_spec_to_index_to_code(self, temp_project):
        """Spec -> Index -> Validation -> Code Generation."""
        # Create spec
        spec = temp_project / "specs" / "user.spec"
        spec.write_text("""
# speclang-header lines:6
id: @app/entities/user
version: 1.0.0
layer: 2
tags: [entity]
short: User entity
---
### @block::user @kind:entity
User:
  fields:
    id: UUID
    email: String
    name: String
""")
        
        # Generate index
        result = run_script("generate_index.py", cwd=temp_project)
        assert result.returncode == 0
        assert (temp_project / "_index.json").exists()
        
        # Validate
        result = run_script("validate_refs.py", cwd=temp_project)
        assert result.returncode == 0
        
        # Generate code
        result = run_script("generate_from_spec.py", 
                           ["--target", "python"],
                           cwd=temp_project)
        assert result.returncode == 0
        assert (temp_project / "generated" / "entities" / "user.py").exists()
```

### Example 2: Daemon Integration Test

```python
class TestDaemonIntegration:
    """Test daemon integration with other components."""
    
    @pytest.mark.asyncio
    async def test_file_change_triggers_cascade(self, temp_project):
        """Daemon detects file change and triggers cascade."""
        daemon = Daemon(project_root=temp_project)
        cascade_triggered = []
        
        async def on_cascade(spec_id):
            cascade_triggered.append(spec_id)
        
        daemon.cascade_handler = on_cascade
        
        await daemon.start()
        
        # Create spec with dependency
        parent = temp_project / "specs" / "parent.spec"
        parent.write_text("""
# speclang-header lines:6
id: @test/parent
version: 1.0.0
layer: 1
tags: [parent]
short: Parent
---
# Parent
""")
        
        child = temp_project / "specs" / "child.spec"
        child.write_text("""
# speclang-header lines:8
id: @test/child
version: 1.0.0
layer: 2
depends: [@test/parent]
tags: [child]
short: Child
---
# Child
@ref:test/parent
""")
        
        await daemon.load_index()
        
        # Modify parent
        parent.write_text(parent.read_text() + "\n\n## Update")
        
        await asyncio.sleep(0.5)
        await daemon.stop()
        
        # Verify cascade triggered for child
        assert "@test/child" in cascade_triggered
```

### Example 3: MCP Integration Test

```python
class TestMCPIntegration:
    """Test MCP server integration."""
    
    @pytest.mark.asyncio
    async def test_mcp_search_returns_specs(self, temp_project):
        """MCP search tool returns matching specs."""
        # Setup specs
        create_test_specs(temp_project, count=10)
        
        server = MCPServer(project_root=temp_project)
        await server.start()
        
        try:
            response = await server.handle_request({
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "speclang_search",
                    "arguments": {"query": "entity"}
                },
                "id": 1
            })
            
            assert "result" in response
            results = response["result"]["content"]
            assert len(results) > 0
            
        finally:
            await server.stop()
```

### Example 4: Pipeline Integration Test

```python
class TestPipelineIntegration:
    """Test pipeline integration."""
    
    def test_pipeline_stages_execute_in_order(self, temp_project):
        """Pipeline stages execute in configured order."""
        # Create pipeline config
        config = temp_project / ".speclang" / "pipeline.yaml"
        config.write_text("""
stages:
  - name: validate
    steps:
      - name: check-refs
        action: validate_refs
  - name: generate
    steps:
      - name: gen-code
        action: generate
        target: python
hooks:
  pre_commit:
    - stage: validate
""")
        
        create_test_specs(temp_project)
        
        pipeline = Pipeline(project_root=temp_project)
        pipeline.load_config()
        
        execution_order = []
        
        def track_stage(name):
            execution_order.append(name)
        
        pipeline.on_stage_start = track_stage
        
        result = pipeline.run_all()
        
        assert result.success
        assert execution_order == ["validate", "generate"]
```

### Example 5: Error Handling Test

```python
class TestErrorHandling:
    """Test error handling across components."""
    
    def test_invalid_spec_stops_pipeline(self, temp_project):
        """Invalid spec halts pipeline with clear error."""
        # Create invalid spec
        spec = temp_project / "specs" / "invalid.spec"
        spec.write_text("""
# Invalid spec - missing required fields
# speclang-header lines:3
id: @test/invalid
---
# Invalid
""")
        
        pipeline = Pipeline(project_root=temp_project)
        result = pipeline.run_stage("validate")
        
        assert not result.success
        assert "missing required field" in result.error.lower()
    
    def test_missing_reference_reported(self, temp_project):
        """Missing reference is clearly reported."""
        spec = temp_project / "specs" / "broken.spec"
        spec.write_text("""
# speclang-header lines:8
id: @test/broken
version: 1.0.0
layer: 1
tags: [test]
short: Broken refs
---
# Broken

@ref:nonexistent/spec
""")
        
        result = run_script("validate_refs.py", cwd=temp_project)
        
        assert result.returncode != 0
        assert "nonexistent/spec" in result.stderr.decode()
```

## Implementation

```python
from pathlib import Path
from typing import Generator, Callable
import pytest
import subprocess
import tempfile
import shutil

class IntegrationTestFixture:
    """Fixture for integration tests."""
    
    def __init__(self, root: Path):
        self.root = root
        self.specs_dir = root / "specs"
        self.specs_dir.mkdir(parents=True, exist_ok=True)
        
        config_dir = root / ".speclang"
        config_dir.mkdir(exist_ok=True)
        
        self._setup_default_config()
    
    def _setup_default_config(self):
        config = self.root / ".speclang" / "config.yaml"
        config.write_text("""
project:
  name: test-project
  version: 1.0.0

validation:
  strict: true
  check_refs: true
""")
    
    def create_spec(self, name: str, content: str) -> Path:
        spec = self.specs_dir / f"{name}.spec"
        spec.write_text(content)
        return spec
    
    def run_script(self, script: str, *args) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["python3", f"scripts/{script}", *args],
            cwd=self.root,
            capture_output=True
        )
    
    def cleanup(self):
        shutil.rmtree(self.root, ignore_errors=True)

@pytest.fixture
def integration_fixture(tmp_path) -> Generator[IntegrationTestFixture, None, None]:
    fixture = IntegrationTestFixture(tmp_path)
    yield fixture
    fixture.cleanup()
```

## References

- "@ref:speclang/testing
- SIP 24: Test Specs
- SIP 13: Pipeline
- SIP 10: Daemon
- SIP 11: MCP Tools

## Copyright

This document is in the public domain.
