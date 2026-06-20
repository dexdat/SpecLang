# speclang-header lines:7
id: "@speclang/scripts/symlink-manager"
parent: "@ref:specs/scripts"version: 0.1.0
layer: 3
target: scripts/symlink_manager.py
tags: [scripts, symlinks, dual-view, filesystem]
---

# Symlink Manager Script

Manages symlinks between specs/ and working locations.

## Purpose

Automates creation and maintenance of symlinks for dual-view pattern.

## Usage

```bash
# Create all symlinks
./scripts/symlink_manager.py --create-all

# Create symlink for specific spec
./scripts/symlink_manager.py --create specs/my-feature.spec.md

# Verify symlinks
./scripts/symlink_manager.py --verify

# Clean broken symlinks
./scripts/symlink_manager.py --clean
```

## Implementation

### @scripts/symlink-manager/impl

```python
#!/usr/bin/env python3
"""Manage symlinks for dual-view pattern."""

import os
import sys
import argparse
from pathlib import Path


def create_symlink(source: str, target: str) -> bool:
    """Create a symlink from target to source."""
    try:
        # Ensure parent directory exists
        parent = os.path.dirname(target)
        if parent:
            os.makedirs(parent, exist_ok=True)
        
        # Remove existing symlink if present
        if os.path.islink(target):
            os.unlink(target)
        
        # Create symlink (relative)
        rel_source = os.path.relpath(source, os.path.dirname(target))
        os.symlink(rel_source, target)
        return True
    except Exception as e:
        print(f"Error creating symlink {target}: {e}")
        return False


def create_spec_symlinks(spec_path: str) -> int:
    """Create symlinks for all files in a spec directory."""
    spec_dir = Path(spec_path).with_suffix('.spec.dir')
    
    if not spec_dir.exists():
        print(f"Spec directory not found: {spec_dir}")
        return 0
    
    created = 0
    
    # Create symlinks for src/ files
    src_dir = spec_dir / 'src'
    if src_dir.exists():
        slug = spec_dir.stem.replace('.spec', '')
        target_dir = Path('src') / slug
        
        for src_file in src_dir.rglob('*'):
            if src_file.is_file():
                rel_path = src_file.relative_to(src_dir)
                target = target_dir / rel_path
                
                if create_symlink(str(src_file), str(target)):
                    created += 1
    
    return created


def verify_symlinks() -> tuple:
    """Verify all symlinks point to valid targets."""
    broken = []
    valid = []
    
    for root, dirs, files in os.walk('.'):
        # Skip node_modules
        dirs[:] = [d for d in dirs if d != 'node_modules']
        
        for file in files:
            path = os.path.join(root, file)
            if os.path.islink(path):
                target = os.readlink(path)
                abs_target = os.path.normpath(os.path.join(os.path.dirname(path), target))
                
                if not os.path.exists(abs_target):
                    broken.append(path)
                else:
                    valid.append(path)
    
    return valid, broken


def clean_broken_symlinks() -> int:
    """Remove broken symlinks."""
    valid, broken = verify_symlinks()
    
    for link in broken:
        try:
            os.unlink(link)
            print(f"Removed: {link}")
        except Exception as e:
            print(f"Failed to remove {link}: {e}")
    
    return len(broken)


def main():
    parser = argparse.ArgumentParser(description='Manage symlinks')
    parser.add_argument('--create-all', action='store_true',
                        help='Create all symlinks from specs')
    parser.add_argument('--create', metavar='SPEC',
                        help='Create symlinks for specific spec')
    parser.add_argument('--verify', action='store_true',
                        help='Verify symlinks')
    parser.add_argument('--clean', action='store_true',
                        help='Clean broken symlinks')
    args = parser.parse_args()
    
    if args.create_all:
        # Find all specs and create symlinks
        specs_dir = Path('specs')
        total = 0
        for spec in specs_dir.rglob('*.spec.md'):
            total += create_spec_symlinks(str(spec))
        print(f"Created {total} symlinks")
        return 0
    
    if args.create:
        count = create_spec_symlinks(args.create)
        print(f"Created {count} symlinks")
        return 0
    
    if args.verify:
        valid, broken = verify_symlinks()
        print(f"Valid: {len(valid)}, Broken: {len(broken)}")
        if broken:
            for b in broken:
                print(f"  Broken: {b}")
            return 1
        return 0
    
    if args.clean:
        count = clean_broken_symlinks()
        print(f"Cleaned {count} broken symlinks")
        return 0
    
    parser.print_help()
    return 1


if __name__ == '__main__':
    sys.exit(main())
```

## Operations

1. **Create**: Generate symlinks from specs to working locations
2. **Verify**: Check all symlinks point to valid targets
3. **Clean**: Remove broken symlinks

## Safety

- Never overwrites non-symlink files
- Uses relative paths for portability
- Handles Windows junctions (future)

## Dependencies

- Python 3.8+
- Standard library only
