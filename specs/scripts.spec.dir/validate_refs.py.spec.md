---
id: "@speclang/scripts/validate-refs"
parent: ""@ref:specs/scripts"version: 0.1.0
layer: 3
target: scripts/validate_refs.py
tags: [scripts, validation, references, specs]
---

# Validate References Script

Validates `@ref:` references in spec files point to real specs.

## Purpose

Ensures all cross-references between specs are valid and resolvable.

## Usage

```bash
# Validate all references
./scripts/validate_refs.py

# Show broken references
./scripts/validate_refs.py --broken-only
```

## Reference Format

```markdown
@ref:specs/other#block-name     # Block reference
@ref:specs/other/spec           # File reference
@ref:northstar                  # Project reference
```

## Implementation

### @scripts/validate-refs/impl

```python
#!/usr/bin/env python3
"""Validate @ref: references in spec files."""

import re
import sys
from pathlib import Path
from typing import Set, List, Tuple

REF_PATTERN = re.compile(r'@ref:([^\s\])]+)')


def extract_refs(content: str) -> Set[str]:
    """Extract all @ref: references from content."""
    return set(REF_PATTERN.findall(content))


def resolve_ref(ref: str, spec_dir: Path) -> Path | None:
    """Resolve a reference to a file path."""
    # Handle project-level refs
    if ref == 'northstar':
        return spec_dir / 'project.scl'
    
    # Handle block refs (strip #block-name)
    if '#' in ref:
        ref = ref.split('#')[0]
    
    # Handle spec refs
    if ref.startswith('specs/'):
        path = spec_dir / ref.replace('specs/', '')
        # Try various extensions
        for ext in ['.spec.md', '.scl', '.spec.yaml']:
            full = Path(str(path) + ext)
            if full.exists():
                return full
    
    return None


def validate_spec(spec_path: Path, spec_dir: Path) -> List[Tuple[str, str]]:
    """
    Validate references in a spec file.
    
    Returns:
        List of (ref, error) tuples for broken references
    """
    broken = []
    
    try:
        content = spec_path.read_text()
        refs = extract_refs(content)
        
        for ref in refs:
            target = resolve_ref(ref, spec_dir)
            if target is None or not target.exists():
                broken.append((ref, f"Not found: {ref}"))
    except Exception as e:
        broken.append(('', f"Error reading spec: {e}"))
    
    return broken


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--broken-only', action='store_true')
    args = parser.parse_args()
    
    spec_dir = Path('specs')
    all_broken = []
    total_refs = 0
    
    for spec_file in spec_dir.rglob('*.spec.md'):
        refs = extract_refs(spec_file.read_text())
        total_refs += len(refs)
        
        broken = validate_spec(spec_file, spec_dir)
        if broken:
            all_broken.append((str(spec_file), broken))
    
    # Report
    if all_broken:
        print(f"\n❌ Broken references: {sum(len(b) for _, b in all_broken)}")
        for spec_path, broken in all_broken:
            print(f"\n{spec_path}:")
            for ref, error in broken:
                print(f"  - @{ref}: {error}")
    else:
        print(f"\n✅ All {total_refs} references valid")
    
    return 1 if all_broken else 0


if __name__ == '__main__':
    sys.exit(main())
```

## Validation Checks

1. **File Existence**: Target spec must exist
2. **Format**: Reference must follow `@ref:path` format
3. **Block References**: Block anchors are stripped for file validation

## Exit Codes

- `0`: All references valid
- `1`: Broken references found

## Dependencies

- Python 3.8+
- Standard library only
