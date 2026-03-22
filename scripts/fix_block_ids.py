#!/usr/bin/env python3
"""
Fix block ID format in specs
Changes @block:name to @block::name (double colon)
"""

import re
import sys
from pathlib import Path

def fix_spec_file(filepath):
    """Fix block IDs in a single spec file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern: ### @block:name @kind:... → ### @block::name @kind:...
        # Fix single colon to double colon after @block
        content = re.sub(
            r'###\s+@block:(\w+)',
            r'### @block::\1',
            content
        )
        
        # Pattern: @block:FunctionName → @block::FunctionName
        content = re.sub(
            r'@block:([A-Z][a-zA-Z]+)',
            r'@block::\1',
            content
        )
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    project_root = Path(__file__).parent.parent
    specs_dir = project_root / 'specs'
    
    print("🔧 Fixing block ID format in specs...")
    print("=" * 60)
    
    fixed_count = 0
    
    # Find all .spec.md files
    spec_files = list(specs_dir.rglob('*.spec.md'))
    
    print(f"Found {len(spec_files)} spec files to process\n")
    
    for i, spec_file in enumerate(spec_files, 1):
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(spec_files)} files...")
        
        try:
            if fix_spec_file(spec_file):
                fixed_count += 1
        except Exception as e:
            print(f"  ✗ Error: {spec_file}: {e}")
    
    print("\n" + "=" * 60)
    print(f"✓ Fixed block IDs in {fixed_count} files")

if __name__ == '__main__':
    main()
