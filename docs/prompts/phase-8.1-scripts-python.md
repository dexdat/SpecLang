# Bootstrap Phase 8.1: Python Scripts Implementation

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 8.1 of the bootstrap process.

**Prerequisites**: 
- All prior phases complete
- Python generator (Phase 3.6) available

## Your Task
Implement all Python tooling scripts from their specs. These scripts form the operational tooling layer.

## Read These Specs First
1. `specs/scripts.spec.dir/generate-index.py.spec` - Index generator
2. `specs/scripts.spec.dir/validate-refs.py.spec` - Reference validator
3. `specs/scripts.spec.dir/validate-autonomous.py.spec` - Autonomous validator
4. `specs/scripts.spec.dir/rename-spec-files.py.spec` - File renamer
5. `specs/scripts.spec.dir/generate-validation-system.py.spec` - Validation system
6. `specs/scripts.spec.dir/generate-todo.py.spec` - TODO generator
7. `specs/scripts.spec.dir/generate-sqlite-schema.py.spec` - Schema generator
8. `specs/scripts.spec.dir/generate-ralph-loop.py.spec` - Ralph loop generator
9. `specs/scripts.spec.dir/generate-opencode-plugin.py.spec` - OpenCode plugin
10. `specs/scripts.spec.dir/generate-mcp-server.py.spec` - MCP server generator
11. `specs/scripts.spec.dir/generate-from-spec.py.spec` - Generic spec generator
12. `specs/scripts.spec.dir/fix-headers.py.spec` - Header fixer
13. `specs/scripts.spec.dir/compute-header-lines.py.spec` - Header line counter
14. `specs/scripts.spec.dir/add-missing-fields.py.spec` - Field adder

## What to Build

### Files to Create
```
scripts/
├── generate_index.py         # Generate _index.json
├── validate_refs.py          # Validate all @ref:
├── validate_autonomous.py    # Validate agent_autonomous specs
├── rename_spec_files.py      # Rename files per conventions
├── generate_validation_system.py  # Generate validation module
├── generate_todo.py          # Extract TODOs from specs
├── generate_sqlite_schema.py # Generate SQLite DDL
├── generate_ralph_loop.py    # Generate Ralph loop code
├── generate_opencode_plugin.py   # Generate OpenCode plugin
├── generate_mcp_server.py    # Generate MCP server
├── generate_from_spec.py     # Generic code generator
├── fix_headers.py            # Fix malformed headers
├── compute_header_lines.py   # Count header lines
└── add_missing_fields.py     # Add missing header fields

tests/scripts/
├── test_generate_index.py
├── test_validate_refs.py
└── fixtures/
    └── sample.spec.md
```

### Common Script Structure

All scripts follow this pattern from `specs/scripts.spec.dir/generate-index.py.spec`:

```python
#!/usr/bin/env python3
# speclang-header lines:12
# id: "@speclang/scripts.<name>"
# version: 0.1.0
# ...
"""
Script description from spec.
"""

# Standard library
import os
import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Any

# Third-party (with fallback)
try:
    import yaml
except ImportError:
    print("Installing pyyaml...")
    os.system(f"{sys.executable} -m pip install pyyaml")
    import yaml

# Constants
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
SPECS_DIR = ROOT_DIR / "specs"

def main():
    """Main entry point."""
    pass

if __name__ == "__main__":
    main()
```

### Requirements

#### 1. generate_index.py (Already Implemented - Reference)
From `specs/scripts.spec.dir/generate-index.py.spec`:

```python
#!/usr/bin/env python3
"""Generate index of all spec files."""

import os
import json
import yaml
import re
from datetime import datetime
from pathlib import Path

def parse_header(filepath):
    """Parse speclang header from file."""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    header_lines = 0
    metadata = {}
    
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            match = re.search(r'lines:\s*(\d+)', line)
            if match:
                header_lines = int(match.group(1))
            
            yaml_lines = []
            j = i + 1
            end_idx = min(j + header_lines - 1, len(lines))
            
            for k in range(j, end_idx):
                line_text = lines[k].rstrip('\n')
                if line_text.strip() == '---':
                    break
                yaml_lines.append(line_text)
            
            if yaml_lines:
                yaml_text = '\n'.join(yaml_lines)
                try:
                    metadata = yaml.safe_load(yaml_text) or {}
                except yaml.YAMLError:
                    # Fallback to regex extraction
                    pass
            
            break
    
    return header_lines, metadata

def get_spec_files(root_dir):
    """Find all spec files."""
    spec_extensions = ['.scl', '.spec.md', '.spec.yaml', '.spec']
    files = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in ['.git', '.opencode', '.backup_spec_files']]
        
        for filename in filenames:
            if any(filename.endswith(ext) for ext in spec_extensions):
                filepath = os.path.join(dirpath, filename)
                relpath = os.path.relpath(filepath, root_dir)
                files.append((relpath, filepath))
    
    return files

def main():
    spec_files = get_spec_files('.')
    entries = []
    
    for relpath, filepath in spec_files:
        stat = os.stat(filepath)
        with open(filepath, 'r') as f:
            lines = sum(1 for _ in f)
        
        header_lines, metadata = parse_header(filepath)
        
        entry = {
            'path': relpath,
            'id': metadata.get('id', f'@unknown/{os.path.basename(relpath)}'),
            'version': metadata.get('version', '0.0.0'),
            'layer': metadata.get('layer', 0),
            'project_level': metadata.get('project_level'),
            'agent_support': metadata.get('agent_support'),
            'tags': metadata.get('tags', []),
            'short': metadata.get('short', ''),
            'lines': lines,
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat() + 'Z',
            'header_lines': header_lines
        }
        entries.append(entry)
    
    entries.sort(key=lambda x: x['path'])
    
    with open('_index.json', 'w') as f:
        for entry in entries:
            f.write(json.dumps(entry) + '\n')
    
    print(f"Created _index.json with {len(entries)} entries")

if __name__ == '__main__':
    main()
```

#### 2. validate_refs.py
```python
#!/usr/bin/env python3
"""Validate all @ref: references in specs."""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

def load_index():
    """Load spec index."""
    index_path = Path('_index.json')
    if not index_path.exists():
        print("Error: _index.json not found. Run generate_index.py first.")
        sys.exit(1)
    
    specs = {}
    with open(index_path) as f:
        for line in f:
            entry = json.loads(line)
            specs[entry['id']] = entry
    return specs

def extract_refs(filepath):
    """Extract all @ref: markers from a file."""
    refs = []
    ref_pattern = re.compile(r'@ref:([^\s,\]\}\)]+)')
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    for match in ref_pattern.finditer(content):
        refs.append({
            'ref': match.group(1),
            'line': content[:match.start()].count('\n') + 1
        })
    
    return refs

def validate_refs(specs):
    """Validate all references."""
    errors = []
    warnings = []
    
    for spec_id, spec in specs.items():
        filepath = spec['path']
        refs = extract_refs(filepath)
        
        for ref in refs:
            target = ref['ref']
            
            # Parse reference: @specs/path#block or @specs/path
            if '#' in target:
                target_id, block_id = target.split('#', 1)
            else:
                target_id = target
                block_id = None
            
            # Check if target exists
            if target_id not in specs:
                errors.append({
                    'file': filepath,
                    'line': ref['line'],
                    'ref': target,
                    'error': f"Target not found: {target_id}"
                })
    
    return errors, warnings

def main():
    specs = load_index()
    errors, warnings = validate_refs(specs)
    
    if errors:
        print(f"\n❌ Found {len(errors)} reference errors:")
        for err in errors:
            print(f"  {err['file']}:{err['line']}: {err['error']}")
    
    if warnings:
        print(f"\n⚠️  Found {len(warnings)} warnings")
    
    if not errors and not warnings:
        print("✓ All references valid")
    
    sys.exit(1 if errors else 0)

if __name__ == '__main__':
    main()
```

#### 3. validate_autonomous.py
```python
#!/usr/bin/env python3
"""Validate specs with agent_support: agent_autonomous."""

import os
import re
import json
from pathlib import Path

def load_autonomous_specs():
    """Load specs marked as agent_autonomous."""
    specs = []
    with open('_index.json') as f:
        for line in f:
            entry = json.loads(line)
            if entry.get('agent_support') == 'agent_autonomous':
                specs.append(entry)
    return specs

AMBIGUOUS_PATTERNS = [
    (r'\bmaybe\b', 'Consider being more definitive'),
    (r'\bsome\b.*\bthing\b', 'Be more specific'),
    (r'\bprobably\b', 'Avoid probabilistic language'),
    (r'\bshould\b', 'Use "must" or "will" for clarity'),
    (r'\bTBD\b', 'Remove TBD before autonomous operation'),
    (r'\bTODO\b', 'Remove TODO before autonomous operation'),
]

def check_completeness(spec):
    """Check autonomous spec completeness."""
    issues = []
    
    # Required fields for autonomous
    required = ['layer', 'project_level', 'tags', 'short']
    for field in required:
        if not spec.get(field):
            issues.append(f"Missing required field: {field}")
    
    return issues

def check_ambiguity(filepath):
    """Check for ambiguous language."""
    issues = []
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    for pattern, suggestion in AMBIGUOUS_PATTERNS:
        for match in re.finditer(pattern, content, re.IGNORECASE):
            line = content[:match.start()].count('\n') + 1
            issues.append({
                'line': line,
                'text': match.group(0),
                'suggestion': suggestion
            })
    
    return issues

def main():
    specs = load_autonomous_specs()
    
    if not specs:
        print("No autonomous specs found")
        return
    
    print(f"Validating {len(specs)} autonomous specs...\n")
    
    total_issues = 0
    
    for spec in specs:
        issues = []
        
        # Check completeness
        issues.extend(check_completeness(spec))
        
        # Check ambiguity
        amb_issues = check_ambiguity(spec['path'])
        if amb_issues:
            issues.append(f"Found {len(amb_issues)} ambiguous phrases")
        
        if issues:
            print(f"❌ {spec['id']}")
            for issue in issues:
                print(f"   - {issue}")
            total_issues += len(issues)
        else:
            print(f"✓ {spec['id']}")
    
    print(f"\nTotal issues: {total_issues}")
    sys.exit(1 if total_issues else 0)

if __name__ == '__main__':
    main()
```

#### 4. fix_headers.py
```python
#!/usr/bin/env python3
"""Fix malformed speclang headers."""

import os
import re
from pathlib import Path

def detect_header_lines(filepath):
    """Count lines until --- marker."""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if line.strip() == '---':
            return i + 1  # Include the --- line
    
    return 0

def fix_header(filepath, dry_run=False):
    """Fix header declaration."""
    with open(filepath, 'r') as f:
        content = f.read()
        lines = content.split('\n')
    
    # Find existing speclang-header line
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            header_lines = detect_header_lines(filepath)
            
            if header_lines > 0:
                # Update line count
                new_line = f"# speclang-header lines:{header_lines}"
                
                if dry_run:
                    print(f"{filepath}: Would update to lines:{header_lines}")
                else:
                    lines[i] = new_line
                    with open(filepath, 'w') as f:
                        f.write('\n'.join(lines))
                    print(f"{filepath}: Fixed (lines:{header_lines})")
            return
    
    # No header found - could add one
    print(f"{filepath}: No speclang-header found")

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('files', nargs='*', default=['specs/'])
    args = parser.parse_args()
    
    for target in args.files:
        path = Path(target)
        if path.is_dir():
            for f in path.rglob('*.spec*'):
                fix_header(f, args.dry_run)
        else:
            fix_header(path, args.dry_run)

if __name__ == '__main__':
    main()
```

#### 5. generate_todo.py
```python
#!/usr/bin/env python3
"""Extract TODO items from specs."""

import os
import re
import json
from pathlib import Path
from datetime import datetime

TODO_PATTERNS = [
    re.compile(r'TODO:\s*(.+)'),
    re.compile(r'FIXME:\s*(.+)'),
    re.compile(r'XXX:\s*(.+)'),
]

def extract_todos(filepath):
    """Extract TODO items from file."""
    todos = []
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines, 1):
        for pattern in TODO_PATTERNS:
            match = pattern.search(line)
            if match:
                todos.append({
                    'file': filepath,
                    'line': i,
                    'text': match.group(1).strip(),
                    'type': pattern.pattern.split(':')[0]
                })
    
    return todos

def main():
    all_todos = []
    
    for spec_file in Path('specs').rglob('*.spec*'):
        todos = extract_todos(str(spec_file))
        all_todos.extend(todos)
    
    # Sort by file
    all_todos.sort(key=lambda t: t['file'])
    
    # Output
    print(f"Found {len(all_todos)} TODOs\n")
    
    for todo in all_todos:
        print(f"{todo['file']}:{todo['line']} [{todo['type']}]")
        print(f"  {todo['text']}\n")
    
    # Write JSON
    with open('_todos.json', 'w') as f:
        json.dump({
            'generated': datetime.now().isoformat(),
            'todos': all_todos
        }, f, indent=2)

if __name__ == '__main__':
    main()
```

#### 6. add_missing_fields.py
```python
#!/usr/bin/env python3
"""Add missing header fields to specs."""

import os
import re
import yaml
from pathlib import Path

DEFAULT_FIELDS = {
    'version': '0.1.0',
    'layer': 5,
    'status': 'draft',
    'project_level': 'Alpha',
}

def add_missing_fields(filepath, dry_run=False):
    """Add missing fields to header."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find header
    match = re.search(r'# speclang-header.*?\n(.*?)---', content, re.DOTALL)
    if not match:
        return False
    
    yaml_text = match.group(1)
    try:
        metadata = yaml.safe_load(yaml_text) or {}
    except:
        return False
    
    added = []
    for field, default in DEFAULT_FIELDS.items():
        if field not in metadata:
            metadata[field] = default
            added.append(field)
    
    if not added:
        return False
    
    if dry_run:
        print(f"{filepath}: Would add {added}")
        return True
    
    # Rebuild header
    new_yaml = yaml.dump(metadata, default_flow_style=False, sort_keys=False)
    new_content = content.replace(yaml_text, '\n' + new_yaml)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"{filepath}: Added {added}")
    return True

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('files', nargs='*', default=['specs/'])
    args = parser.parse_args()
    
    for target in args.files:
        path = Path(target)
        if path.is_dir():
            for f in path.rglob('*.spec*'):
                add_missing_fields(f, args.dry_run)
        else:
            add_missing_fields(path, args.dry_run)

if __name__ == '__main__':
    main()
```

### Script Summary Table

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| generate_index.py | Build spec index | specs/*.spec* | _index.json |
| validate_refs.py | Check @ref: targets | _index.json | validation report |
| validate_autonomous.py | Validate agent_autonomous | _index.json | issues list |
| rename_spec_files.py | Rename per conventions | specs/*.spec* | renamed files |
| generate_validation_system.py | Gen validation code | specs/*.spec* | validation/*.py |
| generate_todo.py | Extract TODOs | specs/*.spec* | _todos.json |
| generate_sqlite_schema.py | Gen DDL | specs/sqlite.spec | schema.sql |
| generate_ralph_loop.py | Gen loop code | specs/ralph.spec | ralph.py |
| generate_opencode_plugin.py | Gen plugin | specs/opencode.spec | plugin/ |
| generate_mcp_server.py | Gen MCP server | specs/mcp.spec | mcp_server.py |
| generate_from_spec.py | Generic generator | any .spec | target code |
| fix_headers.py | Fix malformed headers | specs/*.spec* | fixed files |
| compute_header_lines.py | Count header lines | specs/*.spec* | line counts |
| add_missing_fields.py | Add missing fields | specs/*.spec* | updated files |

## Test Cases
1. generate_index.py creates valid JSONL
2. validate_refs.py detects missing refs
3. validate_autonomous.py detects ambiguity
4. fix_headers.py corrects line counts
5. generate_todo.py extracts all patterns
6. add_missing_fields.py adds defaults
7. All scripts handle missing files gracefully
8. All scripts work with --dry-run

## CLI Commands
```bash
# Run all scripts
python3 scripts/generate_index.py
python3 scripts/validate_refs.py
python3 scripts/validate_autonomous.py
python3 scripts/generate_todo.py

# Fix issues
python3 scripts/fix_headers.py --dry-run
python3 scripts/add_missing_fields.py --dry-run
```

## Validation
```bash
python3 -m pytest tests/scripts/ -v
```

## Output Format
After completing, output:
1. Scripts implemented
2. Test results
3. Any spec inconsistencies found
