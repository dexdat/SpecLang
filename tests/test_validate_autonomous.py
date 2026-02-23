#!/usr/bin/env python3
"""
Tests for validate_autonomous.py
"""

import json
import os
import tempfile
import pytest
from pathlib import Path
import sys

# Add parent directory to path to import validate_autonomous
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.validate_autonomous import (
    parse_header,
    extract_blocks,
    validate_step_by_step,
    validate_references,
    validate_ambiguity,
    validate_metadata,
    validate_file,
    strip_code_blocks,
    detect_steps
)

def test_strip_code_blocks():
    """Test stripping code blocks."""
    content = """
Some text.
```python
print("hello")
```
More text.
```
code block
```
"""
    stripped = strip_code_blocks(content)
    assert "print" not in stripped
    assert "Some text." in stripped
    assert "More text." in stripped

def test_detect_steps():
    """Test step detection."""
    # Numbered list
    content = "1. First step\n2. Second step"
    assert detect_steps(content) == 2
    
    # Bulleted list
    content = "- Step one\n* Step two\n• Step three"
    assert detect_steps(content) == 3
    
    # Imperative verbs at start of line (detected)
    content = "Add the numbers. Create a file. Validate input."
    assert detect_steps(content) == 1  # Only "Add" at start of line
    
    # Mixed (numbered + bullet + imperative at start of line)
    content = "1. Do this\n- Also that\nCreate something."
    assert detect_steps(content) == 3  # numbered, bullet, "Create" at start of line
    
    # No steps
    content = "This is a description without steps."
    assert detect_steps(content) == 0

def test_parse_header():
    """Test parsing speclang header."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.spec.md', delete=False) as f:
        f.write("""# speclang-header lines:8
id: @test/spec
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [test, example]
short: Test spec
---
# Content
""")
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

def test_extract_blocks():
    """Test extracting blocks from spec content."""
    content = """# @block:test/block1 @kind:operation
Step 1.
Step 2.

# @block:test/block2 @kind:entity
Description.
"""
    blocks = extract_blocks(content)
    assert len(blocks) == 2
    assert blocks[0]['id'] == 'test/block1'
    assert blocks[0]['kind'] == 'operation'
    assert blocks[1]['id'] == 'test/block2'
    assert blocks[1]['kind'] == 'entity'

def test_validate_step_by_step():
    """Test step-by-step validation."""
    blocks = [
        {'id': 'op1', 'kind': 'operation', 'content': '1. Step one\n2. Step two\n3. Step three'},
        {'id': 'op2', 'kind': 'operation', 'content': '- Bullet step one\n- Bullet step two'},
        {'id': 'note', 'kind': 'note', 'content': 'Some note.'},
    ]
    passed, coverage, missing = validate_step_by_step(blocks)
    assert passed == True
    # coverage should be high enough
    assert coverage >= 0.8
    assert missing == []
    
    # No steps
    blocks = [
        {'id': 'op1', 'kind': 'operation', 'content': 'Just a description.'},
    ]
    passed, coverage, missing = validate_step_by_step(blocks)
    assert passed == False
    assert coverage == 0.0
    assert len(missing) == 1

def test_validate_references():
    """Test reference validation."""
    index = {
        '@specs/auth': {'id': '@specs/auth'},
        '@specs/auth/login': {'id': '@specs/auth/login'},
    }
    content = """
See @ref:specs/auth for details.
Also @ref:specs/auth/login#login-op.
"""
    passed, resolved, total, unresolved = validate_references(content, index)
    assert passed == True
    assert total == 2
    assert resolved == 2
    assert unresolved == []
    
    # Unresolved reference
    content = "See @ref:specs/unknown."
    passed, resolved, total, unresolved = validate_references(content, index)
    assert passed == False
    assert total == 1
    assert resolved == 0
    assert unresolved == ['specs/unknown']

def test_validate_ambiguity():
    """Test ambiguity detection."""
    blocks = [
        {'id': 'op1', 'kind': 'operation', 'content': 'Do this exactly.'},
        {'id': 'note', 'kind': 'note', 'content': 'Maybe we should consider.'},
    ]
    passed, count, terms = validate_ambiguity(blocks)
    # Should pass because ambiguous term is in note block (not operation)
    assert passed == True
    assert count == 0
    
    blocks = [
        {'id': 'op1', 'kind': 'operation', 'content': 'You should do this.'},
    ]
    passed, count, terms = validate_ambiguity(blocks)
    assert passed == False
    assert count == 1
    assert 'should' in terms

def test_validate_metadata():
    """Test metadata validation."""
    metadata = {
        'id': '@test/spec',
        'version': '1.0.0',
        'layer': 5,
        'project_level': 'Alpha',
        'agent_support': 'agent_autonomous',
        'tags': ['test'],
        'short': 'Test',
    }
    passed, missing = validate_metadata(metadata)
    assert passed == True
    assert missing == []
    
    # Missing fields
    metadata = {'id': '@test'}
    passed, missing = validate_metadata(metadata)
    assert passed == False
    assert len(missing) > 0

def test_validate_file(tmp_path):
    """Test full file validation."""
    spec_file = tmp_path / "test.spec.md"
    spec_file.write_text("""# speclang-header lines:8
id: @test/spec
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [test]
short: Test spec
---
# @block:test/op @kind:operation
1. Step one
2. Step two
3. Step three
4. Step four
5. Step five

# @block:test/entity @kind:entity
Description.
""")
    
    # Create a minimal index
    index = {'@test/spec': {'id': '@test/spec'}}
    
    result = validate_file(str(spec_file), index)
    if not result['valid']:
        import json
        print('Validation failed:', json.dumps(result, indent=2))
    assert result['spec'] == '@test/spec'
    assert result['agent_support'] == 'agent_autonomous'
    assert result['valid'] == True
    assert result['confidence'] >= 0.8
    
    # Check each check passed
    checks = result['checks']
    assert checks['step_by_step']['passed'] == True
    assert checks['references']['passed'] == True
    assert checks['ambiguity']['passed'] == True
    assert checks['metadata']['passed'] == True

def test_cli_help():
    """Test CLI help output."""
    import subprocess
    result = subprocess.run(
        [sys.executable, 'validate_autonomous.py', '--help'],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent
    )
    assert result.returncode == 0
    assert 'usage' in result.stdout.lower()

if __name__ == '__main__':
    pytest.main([__file__, '-v'])