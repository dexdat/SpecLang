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

sys.path.insert(0, str(Path(__file__).parent.parent))

from validate_refs import load_index, main

def test_load_index(tmp_path):
    """Test loading _index.json."""
    index_content = [
        {"id": "@specs/test1", "path": "specs/test1.spec.md", "imports": []},
        {"id": "@specs/test2", "path": "specs/test2.spec.md", "imports": ["@specs/test1"]},
    ]
    index_file = tmp_path / "_index.json"
    with open(index_file, 'w') as f:
        for entry in index_content:
            f.write(json.dumps(entry) + '\n')
    
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
        {"id": "@specs/test1", "path": "specs/test1.spec.md", "imports": []},
        {"id": "@specs/test2", "path": "specs/test2.spec.md", "imports": ["@specs/test1"]},
    ]
    index_file = tmp_path / "_index.json"
    with open(index_file, 'w') as f:
        for entry in index_content:
            f.write(json.dumps(entry) + '\n')
    
    monkeypatch.chdir(tmp_path)
    # Capture output
    import io
    import sys
    sys.stdout = io.StringIO()
    result = main()
    sys.stdout = sys.__stdout__
    assert result == 0  # success

def test_main_invalid(tmp_path, monkeypatch):
    """Test main with invalid references."""
    index_content = [
        {"id": "@specs/test1", "path": "specs/test1.spec.md", "imports": ["@specs/missing"]},
    ]
    index_file = tmp_path / "_index.json"
    with open(index_file, 'w') as f:
        for entry in index_content:
            f.write(json.dumps(entry) + '\n')
    
    monkeypatch.chdir(tmp_path)
    import io
    import sys
    sys.stdout = io.StringIO()
    result = main()
    output = sys.stdout.getvalue()
    sys.stdout = sys.__stdout__
    assert result == 1
    assert "import '@specs/missing' not found" in output

if __name__ == '__main__':
    pytest.main([__file__, '-v'])