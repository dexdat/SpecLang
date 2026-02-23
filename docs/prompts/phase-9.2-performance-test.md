# Bootstrap Phase 9.2: Performance Testing

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 9.2 of the bootstrap process.

**Prerequisites**: 
- Integration tests (Phase 9.1) complete
- All core systems operational

## Your Task
Implement performance benchmarks and establish baseline metrics for the SpecLang system.

## Read These Specs First
1. `specs/performance/benchmarks.spec` - Performance benchmark specs
2. `specs/performance/requirements.spec` - Performance requirements
3. `specs/daemon/core.spec` - Daemon performance characteristics
4. `specs/mcp/server.spec` - MCP server performance

## What to Build

### Files to Create
```
tests/performance/
├── conftest.py                    # Performance test fixtures
├── test_parser_performance.py     # Parser benchmarks
├── test_index_performance.py      # Index generation benchmarks
├── test_validation_performance.py # Validation benchmarks
├── test_codegen_performance.py    # Code generation benchmarks
├── test_mcp_performance.py        # MCP server benchmarks
├── test_daemon_performance.py     # Daemon benchmarks
├── test_cascade_performance.py    # Cascade benchmarks
├── benchmarks/
│   ├── spec_sizes.py              # Spec size benchmarks
│   ├── spec_counts.py             # Spec count benchmarks
│   └── concurrent_ops.py          # Concurrency benchmarks
├── fixtures/
│   ├── small_project/             # 10 specs
│   ├── medium_project/            # 100 specs
│   ├── large_project/             # 1000 specs
│   └── huge_project/              # 10000 specs (generated)
└── utils/
    ├── benchmark.py               # Benchmark utilities
    ├── metrics.py                 # Metrics collection
    └── report_generator.py        # Report generation
```

### Performance Requirements

```yaml
PerformanceRequirements:
  parser:
    single_spec: 10ms          # Parse single spec
    batch_100: 500ms           # Parse 100 specs
    batch_1000: 5s             # Parse 1000 specs
    
  index_generation:
    small_project: 100ms       # < 50 specs
    medium_project: 1s         # < 200 specs
    large_project: 10s         # < 1000 specs
    
  validation:
    single_spec: 5ms           # Validate single spec
    full_project: 5s           # Validate all specs
    ref_check: 1ms             # Check single reference
    
  code_generation:
    single_entity: 50ms        # Generate single entity
    full_project: 30s          # Generate all code
    
  mcp_server:
    request_latency: 100ms     # P99 latency
    throughput: 100_rps        # Requests per second
    
  daemon:
    file_watch_latency: 50ms   # Detect file change
    cascade_trigger: 200ms     # Trigger cascade
    memory_usage: 100MB        # Max memory
    
  cascade:
    single_level: 100ms        # Cascade one level
    full_propagation: 2s       # Full cascade
```

### Benchmark Implementations

#### 1. Parser Benchmarks (test_parser_performance.py)

```python
import pytest
import time
from pathlib import Path
from speclang.parser import SpecParser

class TestParserPerformance:
    """Parser performance benchmarks."""
    
    @pytest.fixture
    def parser(self):
        return SpecParser()
    
    @pytest.fixture
    def sample_specs(self, tmp_path):
        """Generate sample specs of various sizes."""
        specs = {}
        
        for size in ["small", "medium", "large"]:
            spec = tmp_path / f"{size}.spec"
            lines = []
            lines.append("# speclang-header lines:12")
            lines.append("id: @test/spec")
            lines.append("version: 1.0.0")
            lines.append("layer: 1")
            lines.append("project_level: Alpha")
            lines.append("agent_support: agent_autonomous")
            lines.append("tags: [test]")
            lines.append("short: Test spec")
            lines.append("---")
            lines.append("")
            lines.append("# Test Spec")
            lines.append("")
            
            content_multiplier = {"small": 1, "medium": 10, "large": 100}
            for i in range(content_multiplier[size] * 100):
                lines.append(f"## Section {i}")
                lines.append(f"Content for section {i}.")
                lines.append("")
            
            spec.write_text("\n".join(lines))
            specs[size] = spec
        
        return specs
    
    def test_parse_single_small_spec(self, benchmark, parser, sample_specs):
        """Benchmark: Parse small spec (< 1KB)."""
        result = benchmark(parser.parse, sample_specs["small"])
        assert result is not None
        assert result.metadata["id"] == "@test/spec"
        
        # Assert performance
        assert benchmark.stats["mean"] < 0.01  # 10ms
    
    def test_parse_single_medium_spec(self, benchmark, parser, sample_specs):
        """Benchmark: Parse medium spec (~10KB)."""
        result = benchmark(parser.parse, sample_specs["medium"])
        assert result is not None
        
        assert benchmark.stats["mean"] < 0.05  # 50ms
    
    def test_parse_single_large_spec(self, benchmark, parser, sample_specs):
        """Benchmark: Parse large spec (~100KB)."""
        result = benchmark(parser.parse, sample_specs["large"])
        assert result is not None
        
        assert benchmark.stats["mean"] < 0.5  # 500ms
    
    def test_parse_batch_specs(self, benchmark, parser, tmp_path):
        """Benchmark: Parse batch of specs."""
        specs_dir = tmp_path / "specs"
        specs_dir.mkdir()
        
        for i in range(100):
            spec = specs_dir / f"spec_{i}.spec"
            spec.write_text(f"""
# speclang-header lines:8
id: @test/spec{i}
version: 1.0.0
layer: 1
tags: [test]
short: Test spec {i}
---
# Spec {i}

Content for spec {i}.
""")
        
        def parse_all():
            results = []
            for spec_file in specs_dir.glob("*.spec"):
                results.append(parser.parse(spec_file))
            return results
        
        results = benchmark(parse_all)
        assert len(results) == 100
        
        assert benchmark.stats["mean"] < 0.5  # 500ms for 100 specs
```

#### 2. Index Performance (test_index_performance.py)

```python
import pytest
import subprocess
import time
from pathlib import Path

class TestIndexPerformance:
    """Index generation performance benchmarks."""
    
    @pytest.fixture
    def project_sizes(self, tmp_path):
        """Create projects of various sizes."""
        projects = {}
        
        for name, count in [("small", 10), ("medium", 100), ("large", 500)]:
            project = tmp_path / name
            project.mkdir()
            specs_dir = project / "specs"
            specs_dir.mkdir()
            
            for i in range(count):
                spec = specs_dir / f"spec_{i}.spec"
                spec.write_text(f"""
# speclang-header lines:10
id: @test/{name}/spec{i}
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [test, {name}]
short: Spec {i}
---
# Spec {i}

Content for spec {i}.
""")
            
            projects[name] = project
        
        return projects
    
    def test_index_small_project(self, benchmark, project_sizes):
        """Benchmark: Index small project (10 specs)."""
        project = project_sizes["small"]
        
        def generate_index():
            result = subprocess.run(
                ["python3", "scripts/generate_index.py"],
                cwd=project,
                capture_output=True
            )
            return result.returncode
        
        result = benchmark(generate_index)
        assert result == 0
        assert benchmark.stats["mean"] < 0.1  # 100ms
    
    def test_index_medium_project(self, benchmark, project_sizes):
        """Benchmark: Index medium project (100 specs)."""
        project = project_sizes["medium"]
        
        def generate_index():
            result = subprocess.run(
                ["python3", "scripts/generate_index.py"],
                cwd=project,
                capture_output=True
            )
            return result.returncode
        
        result = benchmark(generate_index)
        assert result == 0
        assert benchmark.stats["mean"] < 1.0  # 1s
    
    def test_index_large_project(self, benchmark, project_sizes):
        """Benchmark: Index large project (500 specs)."""
        project = project_sizes["large"]
        
        def generate_index():
            result = subprocess.run(
                ["python3", "scripts/generate_index.py"],
                cwd=project,
                capture_output=True
            )
            return result.returncode
        
        result = benchmark(generate_index)
        assert result == 0
        assert benchmark.stats["mean"] < 5.0  # 5s
    
    def test_index_incremental_update(self, benchmark, project_sizes):
        """Benchmark: Incremental index update."""
        project = project_sizes["medium"]
        
        # Initial index
        subprocess.run(
            ["python3", "scripts/generate_index.py"],
            cwd=project,
            capture_output=True
        )
        
        # Add one spec
        new_spec = project / "specs" / "new.spec"
        new_spec.write_text("""
# speclang-header lines:8
id: @test/medium/new
version: 1.0.0
layer: 1
tags: [new]
short: New spec
---
# New Spec
""")
        
        def update_index():
            result = subprocess.run(
                ["python3", "scripts/generate_index.py", "--incremental"],
                cwd=project,
                capture_output=True
            )
            return result.returncode
        
        result = benchmark(update_index)
        assert benchmark.stats["mean"] < 0.05  # 50ms for incremental
```

#### 3. MCP Server Performance (test_mcp_performance.py)

```python
import pytest
import asyncio
import time
from unittest.mock import AsyncMock
from speclang.mcp.server import MCPServer

class TestMCPPerformance:
    """MCP server performance benchmarks."""
    
    @pytest.fixture
    async def server(self):
        server = MCPServer(host="localhost", port=0)
        await server.start()
        yield server
        await server.stop()
    
    @pytest.mark.asyncio
    async def test_request_latency(self, server, benchmark):
        """Benchmark: MCP request latency."""
        
        async def make_request():
            return await server.handle_request({
                "jsonrpc": "2.0",
                "method": "tools/list",
                "id": 1
            })
        
        # Warmup
        for _ in range(10):
            await make_request()
        
        # Benchmark
        latencies = []
        for _ in range(100):
            start = time.perf_counter()
            await make_request()
            latencies.append(time.perf_counter() - start)
        
        p50 = sorted(latencies)[50]
        p99 = sorted(latencies)[99]
        
        assert p50 < 0.01   # P50 < 10ms
        assert p99 < 0.1    # P99 < 100ms
    
    @pytest.mark.asyncio
    async def test_throughput(self, server):
        """Benchmark: MCP throughput."""
        
        async def make_request(i):
            return await server.handle_request({
                "jsonrpc": "2.0",
                "method": "tools/list",
                "id": i
            })
        
        # Measure requests per second
        start = time.perf_counter()
        tasks = [make_request(i) for i in range(1000)]
        await asyncio.gather(*tasks)
        elapsed = time.perf_counter() - start
        
        rps = 1000 / elapsed
        assert rps > 100  # > 100 RPS
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self, server):
        """Benchmark: Concurrent request handling."""
        
        async def make_request(i):
            return await server.handle_request({
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {
                    "name": "speclang_validate",
                    "arguments": {"path": f"specs/test_{i}.spec"}
                },
                "id": i
            })
        
        # 100 concurrent requests
        tasks = [make_request(i) for i in range(100)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        success_count = sum(1 for r in results if not isinstance(r, Exception))
        assert success_count >= 95  # 95% success rate
```

#### 4. Daemon Performance (test_daemon_performance.py)

```python
import pytest
import asyncio
import time
from pathlib import Path
from speclang.daemon.core import Daemon

class TestDaemonPerformance:
    """Daemon performance benchmarks."""
    
    @pytest.mark.asyncio
    async def test_file_watch_latency(self, tmp_path):
        """Benchmark: File change detection latency."""
        daemon = Daemon(project_root=tmp_path)
        detection_times = []
        
        original_on_change = daemon.on_change
        
        async def timed_on_change(event):
            detection_times.append(time.perf_counter() - event["timestamp"])
        
        daemon.on_change = timed_on_change
        
        await daemon.start()
        
        # Create files and measure detection time
        for i in range(10):
            spec = tmp_path / "specs" / f"test_{i}.spec"
            spec.parent.mkdir(exist_ok=True)
            
            event_time = time.perf_counter()
            spec.write_text(f"# test {i}")
            
            await asyncio.sleep(0.2)
        
        await daemon.stop()
        
        if detection_times:
            avg_latency = sum(detection_times) / len(detection_times)
            assert avg_latency < 0.05  # < 50ms average detection
    
    @pytest.mark.asyncio
    async def test_memory_usage(self, tmp_path):
        """Benchmark: Daemon memory usage."""
        import tracemalloc
        
        tracemalloc.start()
        
        daemon = Daemon(project_root=tmp_path)
        await daemon.start()
        
        # Create 100 specs
        specs_dir = tmp_path / "specs"
        specs_dir.mkdir()
        
        for i in range(100):
            spec = specs_dir / f"spec_{i}.spec"
            spec.write_text(f"""
# speclang-header lines:8
id: @test/spec{i}
version: 1.0.0
layer: 1
tags: [test]
short: Spec {i}
---
# Spec {i}
""")
        
        await asyncio.sleep(0.5)
        
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        await daemon.stop()
        
        # Peak memory should be < 100MB
        assert peak < 100 * 1024 * 1024
    
    @pytest.mark.asyncio
    async def test_cascade_propagation_time(self, tmp_path):
        """Benchmark: Cascade propagation time."""
        daemon = Daemon(project_root=tmp_path)
        cascade_times = []
        
        # Create dependency chain
        specs_dir = tmp_path / "specs"
        specs_dir.mkdir()
        
        # Create parent
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
        
        # Create children
        for i in range(10):
            child = specs_dir / f"child_{i}.spec"
            child.write_text(f"""
# speclang-header lines:8
id: @test/child{i}
version: 1.0.0
layer: 2
depends: [@test/parent]
tags: [child]
short: Child {i}
---
# Child {i}
@ref:test/parent
""")
        
        await daemon.start()
        await daemon.load_index()
        
        start = time.perf_counter()
        
        # Modify parent
        parent.write_text(parent.read_text() + "\n\n## Update")
        
        await asyncio.sleep(0.5)
        
        cascade_time = time.perf_counter() - start
        await daemon.stop()
        
        assert cascade_time < 2.0  # < 2s for cascade
```

### Benchmark Utilities (utils/benchmark.py)

```python
import time
import statistics
from dataclasses import dataclass
from typing import Callable, List, Any
from functools import wraps

@dataclass
class BenchmarkResult:
    name: str
    iterations: int
    mean: float
    median: float
    stdev: float
    min: float
    max: float
    p50: float
    p95: float
    p99: float
    
    def to_dict(self):
        return {
            "name": self.name,
            "iterations": self.iterations,
            "mean_ms": self.mean * 1000,
            "median_ms": self.median * 1000,
            "stdev_ms": self.stdev * 1000,
            "min_ms": self.min * 1000,
            "max_ms": self.max * 1000,
            "p50_ms": self.p50 * 1000,
            "p95_ms": self.p95 * 1000,
            "p99_ms": self.p99 * 1000,
        }

def benchmark(name: str, iterations: int = 100, warmup: int = 10):
    """Decorator for benchmarking functions."""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Warmup
            for _ in range(warmup):
                func(*args, **kwargs)
            
            # Measure
            times = []
            for _ in range(iterations):
                start = time.perf_counter()
                func(*args, **kwargs)
                times.append(time.perf_counter() - start)
            
            return BenchmarkResult(
                name=name,
                iterations=iterations,
                mean=statistics.mean(times),
                median=statistics.median(times),
                stdev=statistics.stdev(times) if len(times) > 1 else 0,
                min=min(times),
                max=max(times),
                p50=sorted(times)[int(len(times) * 0.5)],
                p95=sorted(times)[int(len(times) * 0.95)],
                p99=sorted(times)[int(len(times) * 0.99)],
            )
        return wrapper
    return decorator

class BenchmarkSuite:
    """Collection of benchmarks."""
    
    def __init__(self, name: str):
        self.name = name
        self.results: List[BenchmarkResult] = []
    
    def add(self, result: BenchmarkResult):
        self.results.append(result)
    
    def report(self) -> str:
        lines = [
            f"# Benchmark Report: {self.name}",
            "",
            "| Benchmark | Iterations | Mean (ms) | P50 (ms) | P99 (ms) |",
            "|-----------|------------|-----------|----------|----------|",
        ]
        
        for r in self.results:
            d = r.to_dict()
            lines.append(
                f"| {d['name']} | {d['iterations']} | "
                f"{d['mean_ms']:.2f} | {d['p50_ms']:.2f} | {d['p99_ms']:.2f} |"
            )
        
        return "\n".join(lines)
    
    def to_json(self) -> dict:
        return {
            "name": self.name,
            "results": [r.to_dict() for r in self.results]
        }
```

### Report Generator (utils/report_generator.py)

```python
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict

class PerformanceReport:
    """Generate performance test reports."""
    
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.results: List[Dict] = []
    
    def add_result(self, category: str, benchmark: str, metrics: dict):
        self.results.append({
            "category": category,
            "benchmark": benchmark,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        })
    
    def generate_markdown(self) -> str:
        lines = [
            "# SpecLang Performance Report",
            f"\nGenerated: {datetime.now().isoformat()}",
            "",
            "## Summary",
            "",
        ]
        
        # Group by category
        categories = {}
        for r in self.results:
            cat = r["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(r)
        
        for cat, benchmarks in sorted(categories.items()):
            lines.append(f"### {cat.title()}")
            lines.append("")
            lines.append("| Benchmark | Mean (ms) | P99 (ms) | Status |")
            lines.append("|-----------|-----------|----------|--------|")
            
            for b in benchmarks:
                m = b["metrics"]
                status = "✅" if m.get("passed", True) else "❌"
                lines.append(
                    f"| {b['benchmark']} | {m.get('mean_ms', 0):.2f} | "
                    f"{m.get('p99_ms', 0):.2f} | {status} |"
                )
            lines.append("")
        
        return "\n".join(lines)
    
    def generate_json(self) -> str:
        return json.dumps({
            "generated": datetime.now().isoformat(),
            "results": self.results
        }, indent=2)
    
    def save(self):
        report_md = self.output_dir / "performance_report.md"
        report_json = self.output_dir / "performance_report.json"
        
        report_md.write_text(self.generate_markdown())
        report_json.write_text(self.generate_json())
        
        return report_md, report_json
```

## Test Cases

### Priority 1: Core Operations
1. Parser handles large specs efficiently
2. Index generation scales linearly
3. Validation completes within SLA
4. Code generation is performant

### Priority 2: System Performance
5. MCP server meets latency targets
6. Daemon memory stays bounded
7. Cascade propagation is fast
8. Concurrent operations scale

### Priority 3: Stress Testing
9. 10,000 spec project handling
10. High concurrency (> 1000 RPS)
11. Long-running stability (24hr)
12. Memory leak detection

## Validation Commands

```bash
# Run all performance tests
python3 -m pytest tests/performance/ -v

# Run with benchmark comparison
python3 -m pytest tests/performance/ --benchmark-only

# Generate performance report
python3 tests/performance/utils/report_generator.py

# Run stress tests
python3 -m pytest tests/performance/benchmarks/ -v --stress
```

## Success Criteria
1. All benchmarks meet SLA
2. No performance regressions > 10%
3. Memory bounded under 100MB
4. P99 latency under 100ms
5. Throughput over 100 RPS

## Output Format
After completing, output:
1. Benchmarks implemented
2. Performance results
3. Comparison with baselines
4. Recommendations for optimization
