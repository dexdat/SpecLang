#!/usr/bin/env python3
"""
Fix corrupted children fields in spec headers.
"""

import re
from pathlib import Path

def fix_corrupted_children(filepath):
    """Fix corrupted children field."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Pattern: children field that got merged into one line
        # Match:   - ""@ref:specs/xxx  - ""@ref:specs/yyy--...
        # Fix to: - "@ref:specs/xxx"
        #          - "@ref:specs/yyy"
        
        # Find children sections that look corrupted
        # Look for pattern: - ""@ref:...  - ""@ref:...--
        corrupted_pattern = re.compile(
            r'children:\s*\n\s*-\s*""(@ref:[^\s]+)\s*-*\s*""(@ref:[^\s]+)\s*-*\s*""(@ref:[^\s]+)?.*?(?=\n\w|\n---|\n#)',
            re.MULTILINE
        )
        
        # Actually, the children got merged with the next field
        # Let's try a different approach - look for the pattern in the file
        
        # Pattern: children: followed by corrupted content ending with --
        def fix_match(match):
            # Extract all @ref: values
            refs = re.findall(r'""(@ref:[^"\s]+)', match.group(0))
            if refs:
                new_children = '\n'.join([f'  - "{ref}"' for ref in refs])
                return f'children:\n{new_children}\n'
            return match.group(0)
        
        # Try to find and fix the specific corruption pattern
        content = re.sub(
            r'children:\s*\n\s*-\s+""@ref:[^\s]+\s*-\s*""@ref:[^\s]+\s*-\s*""@ref:[^\s]+\s*-\s*""@ref:[^\s]+\s*""([^"]+)"\s*\n',
            fix_match,
            content
        )
        
        # Another pattern: children with content merged
        # children:\n  - ""@ref:xxx  - ""@ref:yyy--
        content = re.sub(
            r'children:\s*\n\s*-\s+""(@ref:[^"\s]+)\s+-\s+""(@ref:[^"\s]+)\s*-\s*""(@ref:[^"\s]+)?.*?(\n\w|\n---)',
            lambda m: f'children:\n  - "{m.group(1)}"\n  - "{m.group(2)}"\n{m.group(4)}',
            content
        )
        
        if content != original:
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
    
    print("🔧 Fixing corrupted children fields...")
    print("=" * 60)
    
    fixed_count = 0
    
    # Find all spec files
    spec_files = list(specs_dir.rglob('*.spec.md'))
    spec_files.extend(specs_dir.rglob('*.scl'))
    spec_files.extend(specs_dir.rglob('*.spec.yaml'))
    
    print(f"Found {len(spec_files)} spec files to process\n")
    
    for i, spec_file in enumerate(spec_files, 1):
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(spec_files)} files...")
        
        try:
            if fix_corrupted_children(spec_file):
                fixed_count += 1
        except Exception as e:
            print(f"  ✗ Error: {spec_file}: {e}")
    
    print("\n" + "=" * 60)
    print(f"✓ Fixed children in {fixed_count} files")

if __name__ == '__main__':
    main()