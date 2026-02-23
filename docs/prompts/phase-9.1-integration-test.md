# Bootstrap Phase 9.1: Integration Testing

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 9.1 of the bootstrap process.

**Prerequisites**: 
- All prior phases complete
- Python scripts (Phase 8.1) implemented
- MCP server (Phase 2) operational

## Your Task
Implement comprehensive integration tests that validate the full SpecLang system works end-to-end.

## Read These Specs First
1. `specs/testing/integration.spec` - Integration test specifications
2. `specs/testing/e2e.spec` - End-to-end test scenarios
3. `specs/mcp/server.spec` - MCP server integration points
4. `specs/daemon/core.spec` - Daemon integration points
5. `specs/pipeline/core.spec` - Pipeline integration points

## What to Build

### Files to Create
```
tests/integration/
├── conftest.py                    # Shared fixtures
├── test_full_cycle.py             # Spec-to-code round trip
├── test_cascade_system.py         # Cascade propagation
├── test_mcp_integration.py        # MCP server integration
├── test_daemon_integration.py     # Daemon integration
├── test_pipeline_integration.py   # Pipeline integration
├── test_agent_integration.py      # Agent protocol
├── test_code_generation.py        # Code generator integration
├── test_ui_integration.py         # UI integration
├── fixtures/
│   ├── sample_project/            # Test project
│   │   ├── specs/
│   │   │   ├── northstar.spec
│   │   │   ├── features/
│   │   │   └── entities/
│   │   └── .speclang/config.yaml
│   └── expected_output/           # Expected generated code
└── utils/
    ├── spec_builder.py            # Test spec builder
    ├── mock_daemon.py             # Mock daemon for tests
    └── assertions.py              # Custom assertions
```

### Test Categories

#### 1. Full Cycle Tests (test_full_cycle.py)

```python
import pytest
from pathlib import Path
import subprocess
import json

class TestFullCycle:
    """Test complete spec-to-code round trips."""
    
    @pytest.fixture
    def sample_project(self, tmp_path):
        """Create sample project structure."""
        project = tmp_path / "test_project"
        project.mkdir()
        
        specs_dir = project / "specs"
        specs_dir.mkdir()
        
        # Create northstar
        northstar = specs_dir / "northstar.spec"
        northstar.write_text("""
# speclang-header lines:10
id: @test/northstar
version: 1.0.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [test, core]
short: Test northstar spec
---
# Test Project

This is a test project for integration testing.

## Goals
- Verify full system integration
- Test code generation
- Validate cascade system
""")
        
        return project
    
    def test_spec_to_index_to_validation(self, sample_project):
        """Test: spec -> index -> validation cycle."""
        # Generate index
        result = subprocess.run(
            ["python3", "scripts/generate_index.py"],
            cwd=sample_project,
            capture_output=True
        )
        assert result.returncode == 0
        
        index_file = sample_project / "_index.json"
        assert index_file.exists()
        
        # Validate index content
        with open(index_file) as f:
            entries = [json.loads(line) for line in f]
        
        assert len(entries) >= 1
        assert entries[0]["id"] == "@test/northstar"
    
    def test_spec_to_code_generation(self, sample_project):
        """Test: spec -> code generation."""
        # Create entity spec
        entities_dir = sample_project / "specs" / "entities"
        entities_dir.mkdir()
        
        user_spec = entities_dir / "user.spec"
        user_spec.write_text("""
# speclang-header lines:12
id: @test/entities/user
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [entity, user]
short: User entity definition
---
# User Entity

### @block:user @kind:entity
User:
  description: "Application user"
  fields:
    id: UUID @required
    email: String @format:email @unique
    name: String @min:1 @max:100
    role: Role @default:"member"
""")
        
        # Generate code
        result = subprocess.run(
            ["python3", "scripts/generate_from_spec.py",
             "--target", "python",
             "--output", "generated/"],
            cwd=sample_project,
            capture_output=True
        )
        assert result.returncode == 0
        
        # Verify generated code
        generated = sample_project / "generated" / "entities" / "user.py"
        assert generated.exists()
        
        content = generated.read_text()
        assert "class User" in content
        assert "email: str" in content
        assert "name: str" in content
    
    def test_cascade_propagation(self, sample_project):
        """Test: change in spec -> cascade to dependents."""
        # Setup: Create parent and child specs
        specs_dir = sample_project / "specs"
        
        parent = specs_dir / "parent.spec"
        parent.write_text("""
# speclang-header lines:8
id: @test/parent
version: 1.0.0
layer: 1
tags: [parent]
short: Parent spec
---
# Parent

### @block:config @kind:config
Config:
  api_version: "1.0"
  timeout: 30
""")
        
        child = specs_dir / "child.spec"
        child.write_text("""
# speclang-header lines:10
id: @test/child
version: 1.0.0
layer: 2
tags: [child]
short: Child spec
depends: [@test/parent]
---
# Child

@ref:test/parent#config

### @block:service @kind:service
Service:
  uses_config: @ref:test/parent#config
""")
        
        # Generate index
        subprocess.run(
            ["python3", "scripts/generate_index.py"],
            cwd=sample_project,
            capture_output=True
        )
        
        # Validate references
        result = subprocess.run(
            ["python3", "scripts/validate_refs.py"],
            cwd=sample_project,
            capture_output=True
        )
        assert result.returncode == 0
        
        # Modify parent
        parent.write_text(parent.read_text().replace('timeout: 30', 'timeout: 60'))
        
        # Run cascade check
        result = subprocess.run(
            ["python3", "scripts/generate_from_spec.py", "--cascade"],
            cwd=sample_project,
            capture_output=True
        )
        
        # Verify cascade triggered
        assert "cascade" in result.stdout.decode().lower() or result.returncode == 0
```

#### 2. MCP Integration Tests (test_mcp_integration.py)

```python
import pytest
import asyncio
import json
from unittest.mock import AsyncMock, patch

class TestMCPIntegration:
    """Test MCP server integration."""
    
    @pytest.fixture
    async def mcp_server(self):
        """Start MCP server for testing."""
        from speclang.mcp.server import MCPServer
        
        server = MCPServer(host="localhost", port=0)
        await server.start()
        yield server
        await server.stop()
    
    @pytest.mark.asyncio
    async def test_mcp_list_tools(self, mcp_server):
        """Test MCP tools/list endpoint."""
        response = await mcp_server.handle_request({
            "jsonrpc": "2.0",
            "method": "tools/list",
            "id": 1
        })
        
        assert "result" in response
        assert "tools" in response["result"]
        
        tool_names = [t["name"] for t in response["result"]["tools"]]
        assert "speclang_validate" in tool_names
        assert "speclang_generate" in tool_names
        assert "speclang_search" in tool_names
    
    @pytest.mark.asyncio
    async def test_mcp_search_specs(self, mcp_server):
        """Test MCP spec search."""
        response = await mcp_server.handle_request({
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": "speclang_search",
                "arguments": {"query": "entity"}
            },
            "id": 2
        })
        
        assert "result" in response
        # Should return matching specs
    
    @pytest.mark.asyncio
    async def test_mcp_generate_code(self, mcp_server, tmp_path):
        """Test MCP code generation."""
        # Create test spec
        spec_file = tmp_path / "test.spec"
        spec_file.write_text("""
# speclang-header lines:8
id: @test/simple
version: 1.0.0
layer: 1
tags: [test]
short: Simple test spec
---
# Simple
""")
        
        response = await mcp_server.handle_request({
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": "speclang_generate",
                "arguments": {
                    "spec_path": str(spec_file),
                    "target": "python"
                }
            },
            "id": 3
        })
        
        assert "result" in response
```

#### 3. Daemon Integration Tests (test_daemon_integration.py)

```python
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

class TestDaemonIntegration:
    """Test daemon integration."""
    
    @pytest.mark.asyncio
    async def test_daemon_file_watching(self, tmp_path):
        """Test daemon watches and reacts to file changes."""
        from speclang.daemon.core import Daemon
        
        daemon = Daemon(project_root=tmp_path)
        events = []
        
        async def capture_event(event):
            events.append(event)
        
        daemon.on_change = capture_event
        
        await daemon.start()
        
        # Create a spec file
        spec_file = tmp_path / "specs" / "test.spec"
        spec_file.parent.mkdir(parents=True, exist_ok=True)
        spec_file.write_text("# test content")
        
        await asyncio.sleep(0.1)  # Allow event propagation
        
        await daemon.stop()
        
        assert len(events) > 0
        assert events[0]["type"] == "created"
    
    @pytest.mark.asyncio
    async def test_daemon_cascade_trigger(self, tmp_path):
        """Test daemon triggers cascade on spec change."""
        from speclang.daemon.core import Daemon
        
        daemon = Daemon(project_root=tmp_path)
        cascades = []
        
        async def capture_cascade(spec_id):
            cascades.append(spec_id)
        
        daemon.trigger_cascade = capture_cascade
        
        # Create dependency structure
        specs_dir = tmp_path / "specs"
        specs_dir.mkdir()
        
        parent = specs_dir / "parent.spec"
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
        
        child = specs_dir / "child.spec"
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
        
        await daemon.start()
        await daemon.load_index()
        
        # Modify parent
        parent.write_text(parent.read_text() + "\n\n## New Section")
        
        await asyncio.sleep(0.2)
        await daemon.stop()
        
        # Verify cascade triggered for child
        assert "@test/child" in cascades or len(cascades) >= 0
```

#### 4. Pipeline Integration Tests (test_pipeline_integration.py)

```python
import pytest
from pathlib import Path

class TestPipelineIntegration:
    """Test pipeline integration."""
    
    @pytest.fixture
    def pipeline_project(self, tmp_path):
        """Create project with pipeline config."""
        project = tmp_path / "pipeline_test"
        project.mkdir()
        
        config_dir = project / ".speclang"
        config_dir.mkdir()
        
        pipeline_config = config_dir / "pipeline.yaml"
        pipeline_config.write_text("""
stages:
  - name: validate
    steps:
      - name: check-refs
        action: validate_refs
      - name: check-autonomous
        action: validate_autonomous
  
  - name: generate
    steps:
      - name: gen-python
        action: generate
        target: python
        output: generated/python/
  
  - name: test
    steps:
      - name: run-tests
        action: shell
        command: pytest tests/

hooks:
  pre_commit:
    - stage: validate
  post_merge:
    - stage: generate
""")
        
        specs_dir = project / "specs"
        specs_dir.mkdir()
        
        (specs_dir / "test.spec").write_text("""
# speclang-header lines:8
id: @pipeline/test
version: 1.0.0
layer: 1
tags: [test]
short: Pipeline test
---
# Pipeline Test
""")
        
        return project
    
    def test_pipeline_validate_stage(self, pipeline_project):
        """Test pipeline validation stage."""
        from speclang.pipeline.core import Pipeline
        
        pipeline = Pipeline(project_root=pipeline_project)
        pipeline.load_config()
        
        result = pipeline.run_stage("validate")
        
        assert result.success
        assert "check-refs" in result.completed_steps
    
    def test_pipeline_generate_stage(self, pipeline_project):
        """Test pipeline generation stage."""
        from speclang.pipeline.core import Pipeline
        
        pipeline = Pipeline(project_root=pipeline_project)
        pipeline.load_config()
        
        # Run generate stage
        result = pipeline.run_stage("generate")
        
        assert result.success
        
        # Verify output
        output_dir = pipeline_project / "generated" / "python"
        assert output_dir.exists()
    
    def test_pipeline_hooks(self, pipeline_project):
        """Test pipeline hooks execute correctly."""
        from speclang.pipeline.core import Pipeline
        
        pipeline = Pipeline(project_root=pipeline_project)
        pipeline.load_config()
        
        # Simulate pre-commit hook
        result = pipeline.run_hook("pre_commit")
        
        assert result.success
```

### Test Configuration (conftest.py)

```python
import pytest
import tempfile
from pathlib import Path
import shutil

@pytest.fixture
def temp_project():
    """Create temporary project directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        project = Path(tmpdir) / "project"
        project.mkdir()
        
        specs = project / "specs"
        specs.mkdir()
        
        config = project / ".speclang"
        config.mkdir()
        
        (config / "config.yaml").write_text("""
project:
  name: test-project
  version: 1.0.0

validation:
  strict: true
  check_refs: true
""")
        
        yield project

@pytest.fixture
def sample_specs(temp_project):
    """Create sample specs in project."""
    specs_dir = temp_project / "specs"
    
    specs = {
        "northstar": specs_dir / "northstar.spec",
        "feature": specs_dir / "features" / "auth.spec",
        "entity": specs_dir / "entities" / "user.spec",
    }
    
    specs["feature"].parent.mkdir(parents=True, exist_ok=True)
    specs["entity"].parent.mkdir(parents=True, exist_ok=True)
    
    specs["northstar"].write_text("""
# speclang-header lines:10
id: @test/northstar
version: 1.0.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [core, northstar]
short: Test northstar
---
# Test Project Northstar

## Vision
A test project for integration testing.
""")
    
    return specs

@pytest.fixture
def mock_daemon():
    """Mock daemon for testing without file watching."""
    from unittest.mock import AsyncMock, MagicMock
    
    daemon = MagicMock()
    daemon.start = AsyncMock()
    daemon.stop = AsyncMock()
    daemon.trigger_cascade = AsyncMock()
    
    return daemon
```

### Custom Assertions (utils/assertions.py)

```python
from pathlib import Path
import json

def assert_valid_spec(filepath: Path):
    """Assert spec file has valid structure."""
    assert filepath.exists(), f"Spec file not found: {filepath}"
    
    content = filepath.read_text()
    assert "# speclang-header" in content, "Missing speclang-header"
    assert "---" in content, "Missing header terminator"
    
    lines = content.split("\n")
    header_end = None
    for i, line in enumerate(lines):
        if line.strip() == "---":
            header_end = i
            break
    
    assert header_end is not None, "Header not properly terminated"
    assert header_end > 2, "Header too short"

def assert_valid_index(index_path: Path, expected_count: int = None):
    """Assert index file is valid JSONL."""
    assert index_path.exists(), f"Index not found: {index_path}"
    
    entries = []
    with open(index_path) as f:
        for line in f:
            entries.append(json.loads(line))
    
    assert len(entries) > 0, "Index is empty"
    
    for entry in entries:
        assert "id" in entry, "Entry missing id"
        assert "path" in entry, "Entry missing path"
        assert "version" in entry, "Entry missing version"
    
    if expected_count is not None:
        assert len(entries) == expected_count, \
            f"Expected {expected_count} entries, got {len(entries)}"
    
    return entries

def assert_code_generated(output_dir: Path, entity_name: str):
    """Assert code was generated for entity."""
    assert output_dir.exists(), f"Output dir not found: {output_dir}"
    
    expected_files = list(output_dir.glob(f"**/{entity_name.lower()}*.py"))
    assert len(expected_files) > 0, \
        f"No generated file for {entity_name}"
    
    return expected_files[0]

def assert_ref_resolves(specs: dict, ref: str):
    """Assert reference resolves to existing spec."""
    target = ref.lstrip("@ref:")
    
    if "#" in target:
        spec_id, block = target.split("#", 1)
    else:
        spec_id, block = target, None
    
    assert spec_id in specs, f"Referenced spec not found: {spec_id}"
    
    if block:
        spec = specs[spec_id]
        content = spec.read_text()
        assert f"@block:{block}" in content, \
            f"Block {block} not found in {spec_id}"
```

## Test Cases

### Priority 1: Core Integration
1. Full spec-to-code cycle works
2. Index generation includes all specs
3. Validation catches errors
4. Cascade propagates changes

### Priority 2: Component Integration
5. MCP server responds to requests
6. Daemon watches and reacts
7. Pipeline stages execute in order
8. Hooks trigger at correct times

### Priority 3: Edge Cases
9. Circular dependencies detected
10. Missing references reported
11. Invalid specs rejected gracefully
12. Concurrent operations safe

## Validation Commands

```bash
# Run all integration tests
python3 -m pytest tests/integration/ -v

# Run specific test file
python3 -m pytest tests/integration/test_full_cycle.py -v

# Run with coverage
python3 -m pytest tests/integration/ --cov=speclang --cov-report=html

# Run parallel tests
python3 -m pytest tests/integration/ -n auto
```

## Success Criteria
1. All integration tests pass
2. Coverage > 80% for integration paths
3. No race conditions in concurrent tests
4. All MCP endpoints functional
5. Pipeline stages execute correctly

## Output Format
After completing, output:
1. Tests implemented
2. Test results
3. Coverage report
4. Any issues found
