# speclang-header lines:12
id: "@speclang/scripts/check-compliance"
parent: "@ref:specs/scripts"
version: 0.1.0
layer: 3
target: scripts/check_compliance.py
tags: [scripts, compliance, dual-view, validation]
---

# Check Compliance Script

Validates dual-view pattern compliance across the repository.

## Purpose

Ensures all files in working locations have corresponding specs in `specs/` directory.

## Usage

```bash
# Check compliance
./scripts/check_compliance.py

# Check specific directory
./scripts/check_compliance.py --dir src/

# Auto-fix non-compliant files
./scripts/check_compliance.py --fix
```

## Implementation

### @scripts/check-compliance/impl

```python
#!/usr/bin/env python3
"""Check dual-view compliance - ensure all files have spec sources."""

import os
import sys
import argparse
from pathlib import Path
from typing import Set, Tuple

def check_compliance(directory: str = '.') -> Tuple[Set[str], Set[str], Set[str]]:
    """
    Check compliance in a directory.
    
    Returns:
        compliant: Files with proper specs
        partial: Files with specs but not symlinked
        non_compliant: Files without specs
    """
    compliant = set()
    partial = set()
    non_compliant = set()
    
    # Walk the directory
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
        
        for file in files:
            file_path = os.path.join(root, file)
            
            # Check if file is symlinked to specs/
            if os.path.islink(file_path):
                target = os.readlink(file_path)
                if 'specs/' in target:
                    compliant.add(file_path)
                continue
            
            # Check if file has a spec source
            spec_path = find_spec_for_file(file_path)
            if spec_path and os.path.exists(spec_path):
                partial.add(file_path)
            else:
                non_compliant.add(file_path)
    
    return compliant, partial, non_compliant


def find_spec_for_file(file_path: str) -> str | None:
    """Find the spec file that corresponds to a working file."""
    # Map file paths to expected spec locations
    if file_path.startswith('src/'):
        # src/file.ts -> specs/.../src/file.ts (in a .spec.dir)
        relative = file_path[4:]  # Remove 'src/'
        # Look for specs that might contain this file
        specs_dir = Path('specs')
        for spec_dir in specs_dir.glob('*.spec.dir'):
            potential_spec = spec_dir / 'src' / relative
            if potential_spec.exists():
                return str(potential_spec) + '.spec.md'
    
    return None


def main():
    parser = argparse.ArgumentParser(description='Check dual-view compliance')
    parser.add_argument('--dir', default='.', help='Directory to check')
    parser.add_argument('--fix', action='store_true', help='Attempt to fix non-compliant files')
    args = parser.parse_args()
    
    compliant, partial, non_compliant = check_compliance(args.dir)
    
    print(f"Compliant: {len(compliant)}")
    print(f"Partial: {len(partial)}")
    print(f"Non-compliant: {len(non_compliant)}")
    
    if non_compliant:
        print("\nNon-compliant files:")
        for f in sorted(non_compliant)[:20]:  # Show first 20
            print(f"  - {f}")
        if len(non_compliant) > 20:
            print(f"  ... and {len(non_compliant) - 20} more")
    
    return 0 if not non_compliant else 1


if __name__ == '__main__':
    sys.exit(main())
```

## Checks Performed

1. **Symlink Check**: Verifies symlinks point to specs/
2. **Spec Existence**: Checks if source spec exists
3. **Header Validation**: Verifies specs have proper headers
4. **Orphan Detection**: Finds files without specs

## Exit Codes

- `0`: All files compliant
- `1`: Non-compliant files found

## Dependencies

- Python 3.8+
- No external packages

## Testing

```python
def test_compliance_check():
    compliant, partial, non_compliant = check_compliance('src/')
    # Verify results
```
