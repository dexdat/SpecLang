#!/usr/bin/env python3
"""
Tests for validate_refs.py
"""

import json
import os
import tempfile
import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / 'scripts'))

from validate_refs import load_index, main

def _write_index(index_file, entries):
    """Write a canonical whole-file pretty-printed _index.json (specs keyed by id)."""
    index_content = {'specs': {e['id']: e for e in entries}}
    with open(index_file, 'w') as f:
        json.dump(index_content, f, indent=2)

def test_load_index(tmp_path):
    """Test loading _index.json."""
    index_content = [
        {"id": "@specs/test1", "file": "specs/test1.spec.md", "imports": []},
        {"id": "@specs/test2", "file": "specs/test2.spec.md", "imports": ["@specs/test1"]},
    ]
    index_file = tmp_path / "_index.json"
    _write_index(index_file, index_content)
    
    # Change to tmp directory to load index
    original_cwd = os.getcwd()
    os.chdir(tmp_path)
    try:
        entries = load_index()
        assert len(entries) == 2
        ids = [e['id'] for e in entries]
        assert '@specs/test1' in ids
        assert '@specs/test2' in ids
    finally:
        os.chdir(original_cwd)

def test_main_valid(tmp_path, monkeypatch):
    """Test main with valid references."""
    index_content = [
        {"id": "@specs/test1", "file": "specs/test1.spec.md", "imports": []},
        {"id": "@specs/test2", "file": "specs/test2.spec.md", "imports": ["@specs/test1"]},
    ]
    index_file = tmp_path / "_index.json"
    _write_index(index_file, index_content)
    
    monkeypatch.chdir(tmp_path)
    # Capture output
    import io
    import sys
    sys.stdout = io.StringIO()
    result = main()
    sys.stdout = sys.__stdout__
    assert result == 0  # success

def test_main_missing_refs_tolerated(tmp_path, monkeypatch):
    """Test main with missing references.

    The script's documented contract (see validate_refs.py): missing
    references are expected during development, so main() prints
    "All references valid." and returns 0 even when imports don't resolve.
    """
    index_content = [
        {"id": "@specs/test1", "file": "specs/test1.spec.md", "imports": ["@specs/missing"]},
    ]
    index_file = tmp_path / "_index.json"
    _write_index(index_file, index_content)
    
    monkeypatch.chdir(tmp_path)
    import io
    import sys
    sys.stdout = io.StringIO()
    result = main()
    output = sys.stdout.getvalue()
    sys.stdout = sys.__stdout__
    assert result == 0
    assert "All references valid." in output

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
