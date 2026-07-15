#!/usr/bin/env python3
"""
Convert partial files (regular files with specs) into symlinks.
For each partial file:
1. Create specs/{module}.spec.dir/src/ directory
2. Copy the file there (unchanged)
3. Delete original
4. Create symlink from src/ to specs/
"""

import os
import shutil
from pathlib import Path

def get_module_from_path(file_path):
    """Get module name from file path."""
    parts = Path(file_path).parts
    if len(parts) >= 2 and parts[0] == 'src':
        return parts[1]  # e.g., 'tools' from 'src/tools/file-tools.ts'
    return None

def convert_to_symlink(file_path):
    """Convert a regular file to a symlink via specs/."""
    file_path = Path(file_path)
    module = get_module_from_path(str(file_path))
    
    if not module:
        print(f"  ❌ Can't determine module for {file_path}")
        return False
    
    # Create specs/{module}.spec.dir/src/ directory
    specs_dir = Path(f'specs/{module}.spec.dir/src')
    specs_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy file to specs (don't modify it) - skip if already exists
    dest = specs_dir / file_path.name
    if dest.exists():
        print(f"  ⚠️  Already exists: {dest}")
    else:
        if file_path.exists():
            shutil.copy2(file_path, dest)
            print(f"  ✓ Copied to {dest}")
        else:
            print(f"  ⚠️  Source file doesn't exist: {file_path}")
            return False
    
    # Remove original if it exists
    if file_path.exists():
        file_path.unlink()
        print(f"  ✓ Removed {file_path}")
    else:
        print(f"  ⚠️  Already removed: {file_path}")
    
    # Create symlink (only if it doesn't exist)
    if file_path.is_symlink():
        print(f"  ⚠️  Already symlink: {file_path}")
    else:
        # Relative path from src/tools/ to specs/tools.spec.dir/src/
        rel_path = f'../../specs/{module}.spec.dir/src/{file_path.name}'
        os.symlink(rel_path, file_path)
        print(f"  ✓ Created symlink {file_path} -> {rel_path}")
    
    return True

def main():
    # Get partial files
    import sys
    sys.path.insert(0, 'scripts')
    from check_compliance import check_compliance
    
    results = check_compliance()
    partial_files = results['partial']
    
    print(f"Converting {len(partial_files)} partial files to symlinks...\n")
    
    # Group by module
    by_module = {}
    for f in partial_files:
        module = get_module_from_path(f)
        if module not in by_module:
            by_module[module] = []
        by_module[module].append(f)
    
    for module, files in sorted(by_module.items()):
        print(f"\n=== {module} ({len(files)} files) ===")
        for f in files:
            print(f"  Processing {f}...")
            convert_to_symlink(f)

if __name__ == '__main__':
    main()
