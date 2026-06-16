#!/usr/bin/env python3
"""
Tests for generate_index.py
"""

import json
import os
import tempfile
import pytest
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from generate_index import parse_header, get_spec_files

def test_parse_header_with_lines():
    """Test parsing header with lines:N."""
    content = """# speclang-header lines:8
id: @test/spec
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [test, example]
short: Test spec
---
# Content"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.spec.md', delete=False) as f:
        f.write(content)
        fpath = f.name
    
    try:
        header_lines, metadata = parse_header(fpath)
        assert header_lines == 8
        assert metadata['id'] == '@test/spec'
        assert metadata['version'] == '1.0.0'
        assert metadata['layer'] == 5
        assert metadata['project_level'] == 'Alpha'
        assert metadata['agent_support'] == 'agent_autonomous'
        assert metadata['tags'] == ['test', 'example']
        assert metadata['short'] == 'Test spec'
    finally:
        os.unlink(fpath)

def test_parse_header_without_lines():
    """Test parsing header without lines:N."""
    content = """---
# speclang-header
id: @test/spec
version: 1.0.0
---
# Content"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.spec.md', delete=False) as f:
        f.write(content)
        fpath = f.name
    
    try:
        header_lines, metadata = parse_header(fpath)
        # Should compute header_lines dynamically
        assert header_lines == 4  # speclang-header line + 2 YAML lines + ---
        assert metadata['id'] == '@test/spec'
        assert metadata['version'] == '1.0.0'
    finally:
        os.unlink(fpath)

def test_parse_header_malformed():
    """Test parsing malformed header."""
    content = """# speclang-header lines:5
id: @test/spec
version: 1.0.0
---
# Content"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.spec.md', delete=False) as f:
        f.write(content)
        fpath = f.name
    
    try:
        header_lines, metadata = parse_header(fpath)
        # Should still extract id and version
        assert metadata['id'] == '@test/spec'
        assert metadata['version'] == '1.0.0'
    finally:
        os.unlink(fpath)

def test_get_spec_files(tmp_path):
    """Test finding spec files."""
    # Create dummy spec files
    (tmp_path / 'specs').mkdir()
    (tmp_path / 'specs' / 'test1.spec.md').write_text('')
    (tmp_path / 'specs' / 'test2.spec.yaml').write_text('')
    (tmp_path / 'specs' / 'test3.scl').write_text('')
    (tmp_path / 'specs' / 'ignore.txt').write_text('')
    (tmp_path / 'specs' / 'subdir').mkdir()
    (tmp_path / 'specs' / 'subdir' / 'test4.spec.md').write_text('')
    
    files = get_spec_files(str(tmp_path / 'specs'))
    # Should find 4 spec files
    assert len(files) == 4
    # get_spec_files returns tuples (relpath, filepath)
    paths = [os.path.basename(filepath) for relpath, filepath in files]
    assert 'test1.spec.md' in paths
    assert 'test2.spec.yaml' in paths
    assert 'test3.scl' in paths
    assert 'test4.spec.md' in paths
    assert 'ignore.txt' not in paths

def test_main_integration(tmp_path, monkeypatch):
    """Test full index generation."""
    # Create a couple of spec files
    spec_dir = tmp_path / 'specs'
    spec_dir.mkdir()
    
    spec1 = spec_dir / 'test1.spec.md'
    spec1.write_text("""# speclang-header lines:8
id: @test/spec1
version: 1.0.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [test]
short: Test spec 1
---
# Content""")
    
    spec2 = spec_dir / 'test2.spec.md'
    spec2.write_text("""# speclang-header lines:8
id: @test/spec2
version: 1.0.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [test]
short: Test spec 2
---
# Content""")
    
    monkeypatch.chdir(tmp_path)
    # Run generate_index.py via subprocess (script is in project root)
    import subprocess
    generate_index_path = Path(__file__).parent.parent / 'generate_index.py'
    result = subprocess.run(
        [sys.executable, str(generate_index_path)],
        capture_output=True,
        text=True,
        cwd=tmp_path
    )
    # Should succeed
    assert result.returncode == 0
    
    # Check _index.json exists
    index_file = tmp_path / '_index.json'
    assert index_file.exists()
    entries = []
    with open(index_file, 'r') as f:
        for line in f:
            entries.append(json.loads(line))
    assert len(entries) == 2
    ids = {e['id'] for e in entries}
    assert '@test/spec1' in ids
    assert '@test/spec2' in ids

if __name__ == '__main__':
    pytest.main([__file__, '-v'])