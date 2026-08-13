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

sys.path.insert(0, str(Path(__file__).parent.parent / 'scripts'))

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

def test_get_spec_files_excludes_junk_dirs(tmp_path):
    """Junk/test-artifact dirs must be pruned from spec discovery."""
    (tmp_path / 'specs').mkdir()
    (tmp_path / 'specs' / 'real.spec.md').write_text('')
    for junk in ('.tmp', '_tmp', 'node_modules', 'test-temp-bootstrap',
                 'test-temp-meta', '.vfs', 'dist', 'coverage', '.git'):
        (tmp_path / 'specs' / junk).mkdir()
        (tmp_path / 'specs' / junk / 'junk.spec.md').write_text('')

    files = get_spec_files(str(tmp_path / 'specs'))
    assert len(files) == 1
    assert files[0][0] == 'real.spec.md'


def _write_spec(spec_dir, name, spec_id, imports=None):
    meta = [
        f"id: {spec_id}",
        "version: 1.0.0",
        "layer: 0",
        "project_level: Alpha",
        "agent_support: agent_autonomous",
        "tags: [test]",
        "short: Test spec",
    ]
    if imports:
        # Quote @refs — bare @ is a reserved YAML indicator
        meta.append(f"imports: [\"{', '.join(imports)}\"]")
    # lines:N counts the marker line + metadata lines
    header = f"# speclang-header lines:{len(meta) + 1}\n" + "\n".join(meta) + "\n---\n# Content"
    (spec_dir / name).write_text(header)


def test_main_integration(tmp_path, monkeypatch):
    """Bare invocation must not write; --generate writes the index."""
    # Create a couple of spec files
    spec_dir = tmp_path / 'specs'
    spec_dir.mkdir()
    _write_spec(spec_dir, 'test1.spec.md', '@test/spec1')
    _write_spec(spec_dir, 'test2.spec.md', '@test/spec2')

    monkeypatch.chdir(tmp_path)
    # Run generate_index.py via subprocess (script lives in scripts/)
    import subprocess
    generate_index_path = Path(__file__).parent.parent / 'scripts' / 'generate_index.py'

    # Bare invocation (no mode flag): prints usage, exits non-zero, writes NOTHING
    bare = subprocess.run(
        [sys.executable, str(generate_index_path)],
        capture_output=True, text=True, cwd=tmp_path
    )
    assert bare.returncode != 0, bare.stderr
    assert 'usage' in (bare.stdout + bare.stderr).lower()
    assert not (tmp_path / '_index.json').exists()

    # Explicit --generate: writes the index and exits 0
    result = subprocess.run(
        [sys.executable, str(generate_index_path), '--generate'],
        capture_output=True, text=True, cwd=tmp_path
    )
    assert result.returncode == 0, result.stderr

    # Check _index.json exists (whole-file pretty-printed JSON with specs keyed by id)
    index_file = tmp_path / '_index.json'
    assert index_file.exists()
    with open(index_file, 'r') as f:
        data = json.load(f)
    entries = list(data['specs'].values())
    assert len(entries) == 2
    ids = {e['id'] for e in entries}
    assert '@test/spec1' in ids
    assert '@test/spec2' in ids


def test_main_validate_gate(tmp_path, monkeypatch):
    """--validate exits non-zero on missing refs; --max-missing raises the bar."""
    spec_dir = tmp_path / 'specs'
    spec_dir.mkdir()
    _write_spec(spec_dir, 'test1.spec.md', '@test/spec1', imports=['@specs/missing'])

    monkeypatch.chdir(tmp_path)
    import subprocess
    generate_index_path = Path(__file__).parent.parent / 'scripts' / 'generate_index.py'

    # Default tolerance 0: 1 missing ref -> gate FAILS (non-zero exit)
    strict = subprocess.run(
        [sys.executable, str(generate_index_path), '--validate'],
        capture_output=True, text=True, cwd=tmp_path
    )
    assert strict.returncode != 0, strict.stdout
    assert 'missing' in strict.stdout.lower()

    # Tolerance raised: same index passes the gate
    tolerant = subprocess.run(
        [sys.executable, str(generate_index_path), '--validate', '--max-missing', '1'],
        capture_output=True, text=True, cwd=tmp_path
    )
    assert tolerant.returncode == 0, tolerant.stdout

    # --check is an alias for --validate (same exit code on the same index)
    alias = subprocess.run(
        [sys.executable, str(generate_index_path), '--check'],
        capture_output=True, text=True, cwd=tmp_path
    )
    assert alias.returncode == strict.returncode

    # Read-only modes must never write _index.json
    assert not (tmp_path / '_index.json').exists()

if __name__ == '__main__':
    pytest.main([__file__, '-v'])