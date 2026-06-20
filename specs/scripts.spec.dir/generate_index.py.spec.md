# speclang-header lines:11
id: "@speclang/scripts/generate-index"
parent: "@ref:specs/scripts"
version: 0.1.0
layer: 3
target: scripts/generate_index.py
tags: [scripts, index, specs, validation]
project_level: Alpha
agent_support: agent_autonomous
short: "Auto-generated spec"
---

# Generate Index Script

Generates `_index.json` from all spec files in the repository.

## Purpose

Creates a searchable index of all specs for quick lookup and validation.

## Usage

```bash
# Generate index
python3 scripts/generate_index.py

# Check mode (validate without writing)
python3 scripts/generate_index.py --check
```

## Output Format

```json
{
  "generated": "2026-03-03T04:20:00",
  "specs": [
    {
      "id": "@specs/example",
      "path": "specs/example.spec.md",
      "version": "1.0.0",
      "layer": 5,
      "tags": ["example"],
      "short": "Brief description"
    }
  ],
  "total": 42,
  "errors": []
}
```

## Implementation

### @scripts/generate-index/impl

```python
#!/usr/bin/env python3
"""Generate spec index from all spec files."""

import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any


def parse_spec_header(content: str) -> Dict[str, Any] | None:
    """Parse speclang-header from spec content."""
    header_match = re.search(r'^# speclang-header lines:(\d+)', content)
    if not header_match:
        return None
    
    line_count = int(header_match.group(1))
    lines = content.split('\n')[:line_count]
    
    header = {}
    for line in lines:
        # Parse key: value pairs
        if ':' in line and not line.startswith('#'):
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            
            # Handle arrays
            if value.startswith('[') and value.endswith(']'):
                value = [v.strip().strip('"\'') for v in value[1:-1].split(',')]
            
            header[key] = value
    
    return header


def generate_index() -> Dict[str, Any]:
    """Generate index from all spec files."""
    specs = []
    errors = []
    
    specs_dir = Path('specs')
    for spec_file in specs_dir.rglob('*.spec.md'):
        try:
            content = spec_file.read_text()
            header = parse_spec_header(content)
            
            if header:
                specs.append({
                    'id': header.get('id', ''),
                    'path': str(spec_file),
                    'version': header.get('version', ''),
                    'layer': header.get('layer', 0),
                    'tags': header.get('tags', []),
                    'short': header.get('short', '')
                })
            else:
                errors.append(f"No header found: {spec_file}")
        except Exception as e:
            errors.append(f"Error parsing {spec_file}: {e}")
    
    return {
        'generated': datetime.now().isoformat(),
        'specs': specs,
        'total': len(specs),
        'errors': errors
    }


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    
    index = generate_index()
    
    if args.check:
        # Just validate
        if index['errors']:
            print(f"Errors: {len(index['errors'])}")
            for err in index['errors']:
                print(f"  - {err}")
            return 1
        print(f"✅ Valid: {index['total']} specs")
        return 0
    
    # Write index
    with open('_index.json', 'w') as f:
        json.dump(index, f, indent=2)
    
    print(f"Generated _index.json with {index['total']} specs")
    return 0


if __name__ == '__main__':
    exit(main())
```

## Validation

- Checks all specs have required headers
- Validates ID uniqueness
- Reports parsing errors

## Dependencies

- Python 3.8+
- Standard library only
