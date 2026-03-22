#!/usr/bin/env python3
"""
Fix YAML quoting in spec headers
Changes unquoted @ characters to quoted strings
"""

import re
import sys
from pathlib import Path

def fix_spec_file(filepath):
    """Fix YAML quoting in a single spec file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: id: @specs/... → id: "@specs/..."
        content = re.sub(
            r'^(id:\s+)(@[\w/-]+)',
            r'\1"\2"',
            content,
            flags=re.MULTILINE
        )
        
        # Pattern 2: tags: [@tag1, @tag2] → tags: ["@tag1", "@tag2"]
        content = re.sub(
            r'tags:\s*\[([^\]]*)\]',
            lambda m: 'tags: [' + re.sub(r'(@\w+)', r'"\1"', m.group(1)) + ']',
            content
        )
        
        # Pattern 3: refs: [@ref:...] → refs: ["@ref:..."]
        content = re.sub(
            r'(refs:|references:)\s*\[([^\]]*)\]',
            lambda m: m.group(1) + ' [' + re.sub(r'(@ref:[^,\]]+)', r'"\1"', m.group(2)) + ']',
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
    
    print("🔧 Fixing YAML quoting in specs...")
    print("=" * 60)
    
    fixed_count = 0
    error_count = 0
    
    # Find all .spec.md files
    spec_files = list(specs_dir.rglob('*.spec.md'))
    spec_files.extend(specs_dir.rglob('*.scl'))
    
    print(f"Found {len(spec_files)} spec files to process\n")
    
    for i, spec_file in enumerate(spec_files, 1):
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(spec_files)} files...")
        
        try:
            if fix_spec_file(spec_file):
                fixed_count += 1
        except Exception as e:
            print(f"  ✗ Error: {spec_file}: {e}")
            error_count += 1
    
    print("\n" + "=" * 60)
    print(f"✓ Fixed {fixed_count} files")
    if error_count > 0:
        print(f"✗ Errors in {error_count} files")
    print("\nNext step: Run validation to verify fixes")
    print("  ./bin/speclang validate")

if __name__ == '__main__':
    main()
